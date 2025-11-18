from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime
import json
import os

from sqlalchemy import create_engine, Column, String, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker

# =========================
# إعداد قاعدة البيانات البسيطة (SQLite)
# =========================

DB_URL = os.getenv("DATABASE_URL", "sqlite:///./voice_ledger.db")

engine = create_engine(DB_URL, connect_args={"check_same_thread": False} if DB_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class AccountData(Base):
  __tablename__ = "accounts"

  email = Column(String, primary_key=True, index=True)
  data_json = Column(Text, nullable=False)  # نخزن فيها الـ JSON الخاص بجميع العملاء والكشوفات
  updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)

# =========================
# نماذج البيانات المستلمة من التطبيق
# =========================

class SyncPayload(BaseModel):
  email: str
  data: Dict[str, Any]  # نفس شكل state.data في الواجهة (مثل { "clients": {...} })


# =========================
# تطبيق FastAPI
# =========================

app = FastAPI(
  title="Voice Ledger Sync API",
  description="خدمة مزامنة لكشوفات تطبيق دفتر كشف الحساب اليومي.",
  version="1.0.0"
)


# دالة مساعدة: دمج بيانات العميل دون حذف
def merge_clients_data(existing_data: Dict[str, Any], new_data: Dict[str, Any]) -> Dict[str, Any]:
  """
  existing_data و new_data نفس الهيكل:
  {
    "clients": {
      "اسم العميل": {
        "statements": [ { id, date, title, entries[], manualTotal, extraNotes }, ... ]
      },
      ...
    }
  }
  الدمج:
  - لا نحذف أي كشف قديم.
  - نوحد الكشوفات حسب id، لو نفس id موجود في الاثنين نأخذ نسخة "الجديدة" (من new_data).
  - نرتب الكشوفات بحيث الأحدث في الأعلى (حسب التاريخ أو حسب رقم id).
  """
  result = {"clients": {}}

  existing_clients = (existing_data or {}).get("clients", {})
  new_clients = (new_data or {}).get("clients", {})

  # جميع أسماء العملاء
  all_names = set(existing_clients.keys()) | set(new_clients.keys())

  for name in all_names:
    ex_client = existing_clients.get(name, {"statements": []})
    new_client = new_clients.get(name, {"statements": []})

    ex_statements = ex_client.get("statements", []) or []
    new_statements = new_client.get("statements", []) or []

    # خريطة id -> statement
    combined_map = {}

    # نبدأ بالقديمة
    for st in ex_statements:
      st_id = st.get("id")
      if not st_id:
        continue
      combined_map[st_id] = st

    # ثم نضيف الجديدة (لو نفس id نكتب فوق القديمة)
    for st in new_statements:
      st_id = st.get("id")
      if not st_id:
        continue
      combined_map[st_id] = st

    # نحولها لقائمة
    merged_list = list(combined_map.values())

    # نحاول الترتيب حسب التاريخ (لو موجود)، وإلا حسب id (اللي فيه رقم timestamp)
    def sort_key(st):
      date_str = st.get("date") or ""
      try:
        # نحاول تحويل التاريخ لصيغة يوم-شهر-سنة بسيطة
        return (date_str, st.get("id", ""))
      except Exception:
        return ("", st.get("id", ""))

    merged_list.sort(key=sort_key, reverse=True)

    result["clients"][name] = {
      "statements": merged_list
    }

  return result


@app.post("/api/sync")
def sync_data(payload: SyncPayload):
  """
  المزامنة الكاملة:
  - التطبيق يرسل (email + كل بياناته المحلية data)
  - السيرفر يجلب أي بيانات سابقة لهذا الإيميل (إن وجدت)
  - يدمجها مع البيانات الجديدة (بدون مسح)
  - يخزن النتيجة في قاعدة البيانات
  - يرجع النتيجة للتطبيق، والتطبيق يحفظها في localStorage

  بهذا الشكل:
  - لو جوال A فيه 5 كشوفات، وجوال B فيه 4 كشوفات لنفس الإيميل:
    بعد المزامنة يصبح لدى الاثنين 9 كشوفات (دمج كامل) بدون حذف.
  """
  email = payload.email.strip().lower()
  if not email:
    raise HTTPException(status_code=400, detail="Email is required")

  db = SessionLocal()
  try:
    # قراءة البيانات الحالية (إن وجدت)
    existing = db.query(AccountData).filter(AccountData.email == email).first()
    existing_data = {}
    if existing:
      try:
        existing_data = json.loads(existing.data_json)
      except Exception:
        existing_data = {}

    # دمج البيانات
    merged = merge_clients_data(existing_data, payload.data)

    # حفظ في قاعدة البيانات
    data_json = json.dumps(merged, ensure_ascii=False)
    now = datetime.utcnow()

    if existing:
      existing.data_json = data_json
      existing.updated_at = now
    else:
      acc = AccountData(email=email, data_json=data_json, updated_at=now)
      db.add(acc)

    db.commit()

    # نرجع البيانات المدموجة
    return {
      "status": "ok",
      "email": email,
      "data": merged,
      "updated_at": now.isoformat() + "Z"
    }

  finally:
    db.close()


@app.get("/api/ping")
def ping():
  return {"status": "ok", "message": "Voice Ledger Sync API is running"}
