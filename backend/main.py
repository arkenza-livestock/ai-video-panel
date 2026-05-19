from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="Atmosfer Studio API",
    version="2.0"
)

# Tarayıcıdan erişimde sorun çıkmaması için CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Atmosfer Studio Pro API is running"}

# Docker içerisinde çökmesini engelleyen kritik başlatma kodu
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8089)
