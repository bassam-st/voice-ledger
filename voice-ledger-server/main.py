from fastapi import FastAPI
from pydantic import BaseModel, EmailStr
from typing import Dict, Any
import json
import os
import threading

DATA_FILE = "sync_data.json"
lock = threading.Lock()

app = FastAPI(title="Voice Ledger Sync Server", version="1.0.0")


class SyncRequest(BaseModel):
  email: EmailStr
  payload: Dict[str, Any]


class SyncResponse(BaseModel):
  merged_data: Dict[str, Any]


def load_all() -> Dict[str, Any]:
  if not os.path.exists(DATA_FILE):
    return {}
  try:
    with open(DATA_FILE, "r", encoding="utf-8") as f:
      return json.load(f)
  except Exception:
    return {}


def save_all(data: Dict[str, Any]) -> None:
  with open(DATA_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False)


def merge_payload(old: Dict[str, Any], new: Dict[str, Any]) -> Dict[str, Any]:
  """
  دمج بيانات العميل بدون مسح:
  - يجمع جميع العملاء.
  - يجمع جميع الكشوفات لكل عميل حسب id.
  - إذا تكرر id يتم أخذ آخر نسخة (من الجهاز الحالي).
  """
  if not old:
    return new or {}

  if new is None:
    new = {}

  old_clients = (old.get("clients") or {})
  new_clients = (new.get("clients") or {})
  merged = {"clients": {}}

  all_client_names = set(old_clients.keys()) | set(new_clients.keys())

  for cname in all_client_names:
    old_c = old_clients.get(cname, {}) or {}
    new_c = new_clients.get(cname, {}) or {}
    old_statements = old_c.get("statements") or []
    new_statements = new_c.get("statements") or []

    by_id: Dict[str, Dict[str, Any]] = {}

    for st in old_statements:
      sid = str(st.get("id") or "")
      if sid:
        by_id[sid] = st

    for st in new_statements:
      sid = str(st.get("id") or "")
      if sid:
        by_id[sid] = st  # يكتب فوق القديم

    merged_statements = sorted(
      by_id.values(),
      key=lambda s: s.get("date") or "",
      reverse=True,
    )

    merged["clients"][cname] = {"statements": merged_statements}

  return merged


@app.get("/")
def root():
  return {"status": "ok", "message": "voice-ledger sync server"}


@app.post("/sync", response_model=SyncResponse)
def sync(req: SyncRequest):
  with lock:
    all_data = load_all()
    user_data = all_data.get(req.email, {})
    merged = merge_payload(user_data, req.payload or {})
    all_data[req.email] = merged
    save_all(all_data)

  return SyncResponse(merged_data=merged)
