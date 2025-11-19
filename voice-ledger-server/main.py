from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# سماح من أي دومين (عشان متى حبيت تستخدمه لاحقاً)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"detail": "voice-ledger server is running (no OpenAI key needed)."}

@app.get("/health")
def health():
    return {"status": "ok"}
