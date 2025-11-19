from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict
import os
import json
import hashlib

app = FastAPI(title="Voice Ledger Sync Server")

# السماح للمتصفح من أي مصدر (يمكنك تضييقها لاحقاً)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # لو تحب تحدد نطاق معين حدد رابط موقعك هنا
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)


class SyncRequest(BaseModel):
  email: str
  payload: Dict[str, Any]


def email_to_filename(email: str) -> str:
  """تحويل البريد لاسم ملف آمن باستخدام hash."""
  h = hashlib.sha256(email.strip().lower().encode("utf-8")).hexdigest()
  return os.path.join(DATA_DIR, f"{h}.json")


def load_existing(email: str) -> Dict[str, Any]:
  path = email_to_filename(email)
  if not os.path.exists(path):
    return {"clients": {}}
  try:
    with open(path, "r", encoding="utf-8") as f:
      return json.load(f)
  except Exception:
    return {"clients": {}}


def save_data(email: str, data: Dict[str, Any]) -> None:
  path = email_to_filename(email)
  with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)


def merge_payload(old: Dict[str, Any], new: Dict[str, Any]) -> Dict[str, Any]:
  """
  دمج بيانات الكشوفات:
  - لا نحذف شيء.
  - لو نفس الـ id لنفس الكشف من جهازين، نأخذ آخر نسخة (من الجهاز الجديد).
  - نرتب الكشوفات تنازلياً حسب التاريخ (الأحدث أولاً).
  """
  result: Dict[str, Any] = {"clients": {}}

  def merge_from(source: Dict[str, Any]):
    for cname, cdata in source.get("clients", {}).items():
      r_client = result["clients"].setdefault(cname, {"statements": []})
      # نحول القائمة لقاموس حسب id عشان نقدر نحدث
      existing_by_id = {s.get("id"): s for s in r_client["statements"] if s.get("id")}

      for st in cdata.get("statements", []):
        sid = st.get("id")
        if not sid:
          continue
        # أي نسخة تصل الآن تعتبر أحدث
        existing_by_id[sid] = st

      # نعيدها لقائمة مرتبة
      r_client["statements"] = sorted(
        existing_by_id.values(),
        key=lambda s: s.get("date") or "",
        reverse=True
      )

  # ندمج أولاً القديم ثم الجديد
  merge_from(old)
  merge_from(new)

  return result


@app.get("/")
def root():
  return {"status": "ok", "message": "Voice Ledger Sync API يعمل ✔"}


@app.post("/sync")
def sync_data(body: SyncRequest):
  """
  يستقبل:
  {
    "email": "user@example.com",
    "payload": { ... data from browser ... }
  }

  ويرجع:
  {
    "merged": { ... data بعد الدمج ... }
  }
  """
  existing = load_existing(body.email)
  merged = merge_payload(existing, body.payload)
  save_data(body.email, merged)
  return {"merged": merged}
