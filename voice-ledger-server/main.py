from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Any, Dict, Optional
from fastapi.middleware.cors import CORSMiddleware

import json
import sqlite3
from pathlib import Path
from datetime import datetime
from threading import Lock

# ==============================
# إعدادات قاعدة البيانات
# ==============================

BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "voice_ledger.db"

_db_lock = Lock()


def init_db() -> None:
  """إنشاء جدول التخزين إذا لم يكن موجوداً."""
  with _db_lock:
    conn = sqlite3.connect(DB_PATH)
    try:
      cur = conn.cursor()
      cur.execute(
        """
        CREATE TABLE IF NOT EXISTS sync_data (
          email TEXT PRIMARY KEY,
          payload TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
        """
      )
      conn.commit()
    finally:
      conn.close()


def load_payload(email: str) -> Optional[Dict[str, Any]]:
  """قراءة البيانات المخزنة لهذا البريد."""
  with _db_lock:
    conn = sqlite3.connect(DB_PATH)
    try:
      cur = conn.cursor()
      cur.execute("SELECT payload FROM sync_data WHERE email = ?", (email,))
      row = cur.fetchone()
      if not row:
        return None
      return json.loads(row[0])
    finally:
      conn.close()


def save_payload(email: str, data: Dict[str, Any]) -> None:
  """حفظ (أو تحديث) بيانات هذا البريد."""
  payload = json.dumps(data, ensure_ascii=False)
  now = datetime.utcnow().isoformat()
  with _db_lock:
    conn = sqlite3.connect(DB_PATH)
    try:
      cur = conn.cursor()
      cur.execute(
        """
        INSERT INTO sync_data (email, payload, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          payload = excluded.payload,
          updated_at = excluded.updated_at
        """,
        (email, payload, now),
      )
      conn.commit()
    finally:
      conn.close()


# ==============================
# نماذج Pydantic
# ==============================

class SyncRequest(BaseModel):
  email: EmailStr
  data: Dict[str, Any]


class SyncResponse(BaseModel):
  status: str
  message: str
  data: Dict[str, Any]


# ==============================
# دوال المـَرْج (الدمج الآمن)
# ==============================

def merge_data(server_data: Optional[Dict[str, Any]],
               client_data: Dict[str, Any]) -> Dict[str, Any]:
  """
  دمج بيانات العميل مع بيانات السيرفر لنفس البريد بدون حذف أي شيء.
  - إذا لا توجد بيانات على السيرفر => نرجع بيانات العميل كما هي.
  - إذا توجد بيانات على السيرفر:
      * ندمج العملاء clients بالاسم.
      * لكل عميل: ندمج الكشوفات statements حسب id.
      * إذا وجد نفس id في الجهتين نحتفظ بالكشف الذي يحتوي على بنود أكثر.
  """
  if not server_data:
    return client_data or {"clients": {}}

  # نضمن وجود المفتاح الأساسي
  server_clients = dict(server_data.get("clients", {}))
  incoming_clients = dict(client_data.get("clients", {}))

  merged_clients: Dict[str, Any] = {}

  # نبدأ من بيانات السيرفر
  for cname, cdata in server_clients.items():
    merged_clients[cname] = {
      "statements": list(cdata.get("statements", []))
    }

  # ندمج بيانات العميل القادم
  for cname, cdata in incoming_clients.items():
    incoming_statements = cdata.get("statements", [])
    if cname not in merged_clients:
      merged_clients[cname] = {"statements": list(incoming_statements)}
      continue

    existing_list = merged_clients[cname].get("statements", [])
    by_id: Dict[str, Dict[str, Any]] = {}

    # بيانات السيرفر أولاً
    for st in existing_list:
      sid = str(st.get("id") or "")
      if not sid:
        sid = f"st_{datetime.utcnow().timestamp()}"
        st["id"] = sid
      by_id[sid] = st

    # ثم بيانات الجهاز الحالي (لا نحذف القديمة)
    for st in incoming_statements:
      sid = str(st.get("id") or "")
      if not sid:
        sid = f"st_{datetime.utcnow().timestamp()}"
        st["id"] = sid

      if sid not in by_id:
        by_id[sid] = st
      else:
        # إذا موجود في الجهتين نأخذ الكشف الذي يحتوي على بنود أكثر
        old_entries = by_id[sid].get("entries", [])
        new_entries = st.get("entries", [])
        if len(new_entries) > len(old_entries):
          by_id[sid] = st

    merged_clients[cname]["statements"] = list(by_id.values())

  return {"clients": merged_clients}


# ==============================
# إنشاء تطبيق FastAPI
# ==============================

app = FastAPI(
  title="Voice Ledger Sync API",
  version="1.0.0",
  description="خدمة مزامنة لدفتر كشف الحساب اليومي."
)

# تفعيل CORS لكل المصادر (بما أن الاستعمال شخصي)
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
  init_db()


@app.get("/health")
def health_check():
  return {"status": "ok", "time": datetime.utcnow().isoformat()}


@app.post("/sync", response_model=SyncResponse)
def sync_data(req: SyncRequest):
  """
  نقطة المزامنة الرئيسية.
  - يستقبل email + data (نفس شكل state.data في الواجهة).
  - يقرأ بيانات هذا البريد من قاعدة البيانات.
  - يدمج server_data مع client_data بطريقة آمنة (بدون حذف).
  - يحفظ النسخة المدموجة في قاعدة البيانات.
  - يرجع البيانات المدموجة للواجهة لتخزينها في localStorage.
  """
  try:
    existing = load_payload(req.email)
    merged = merge_data(existing, req.data or {"clients": {}})
    save_payload(req.email, merged)
    return SyncResponse(
      status="ok",
      message="تمت المزامنة ودمج البيانات بنجاح.",
      data=merged
    )
  except Exception as exc:
    print("Sync error:", exc)
    raise HTTPException(status_code=500, detail="حدث خطأ أثناء المزامنة.")
