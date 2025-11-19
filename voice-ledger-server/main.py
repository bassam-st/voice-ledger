from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import json

client = OpenAI()  # يعتمد على متغير البيئة OPENAI_API_KEY

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # يمكنك تضييقها على دومينك
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VoiceRequest(BaseModel):
    text: str
    client_name: str | None = None
    has_entries: bool | None = None
    current_tab: str | None = None

class VoiceResponse(BaseModel):
    action: str = "none"
    reply: str | None = None
    client_name: str | None = None
    title: str | None = None
    amount: float | None = None
    desc: str | None = None
    currency: str | None = None
    direction: str | None = None

SYSTEM_PROMPT = """
أنت مساعد صوتي محاسب يعمل لصالح "بسّام" داخل تطبيق دفتر كشف حساب.
وظيفتك فهم الأوامر الصوتية بالعربية (لهجة يمنية غالباً) وإرجاع JSON فقط بدون أي نص آخر.

الأفعال المتاحة (action):
- "add_entry" : إضافة بند جديد.
- "save_statement" : حفظ الكشف الحالي.
- "new_statement_same_client" : إنشاء كشف جديد لنفس العميل.
- "set_client_name" : تغيير أو ضبط اسم العميل. استخدم الحقل client_name.
- "set_title" : ضبط عنوان الكشف. استخدم الحقل title.
- "set_amount_last_entry" : ضبط مبلغ آخر بند. استخدم الحقل amount كرقم.
- "add_entry_with_values" : إضافة بند جديد مع القيم (desc, amount, currency, direction).
- "none" : عندما لا تفهم.

الرد الصوتي:
- الحقل reply يجب أن يكون جملة عربية مهذبة، وتخاطب المستخدم باسمه "بسّام".

قواعد:
- أعد دائماً JSON صالح فقط بدون أي شرح خارجي.
- مثال JSON صحيح:
  {"action":"add_entry","reply":"تم إضافة بند جديد يا بسام"}
"""

@app.post("/voice-command", response_model=VoiceResponse)
def voice_command(req: VoiceRequest):
  user_content = {
      "text": req.text,
      "client_name": req.client_name,
      "has_entries": req.has_entries,
      "current_tab": req.current_tab,
  }

  completion = client.chat.completions.create(
      model="gpt-4o-mini",
      messages=[
          {"role": "system", "content": SYSTEM_PROMPT},
          {"role": "user", "content": json.dumps(user_content, ensure_ascii=False)},
      ],
      temperature=0.2,
  )

  raw = completion.choices[0].message.content or ""
  try:
      data = json.loads(raw)
  except Exception:
      data = {"action": "none", "reply": "لم أفهم الأمر بشكل واضح يا بسّام."}

  # تأكد من وجود الحقول الأساسية
  if "action" not in data:
      data["action"] = "none"
  return data
