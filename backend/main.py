import os
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Atmosfer Studio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Endpoint'lerin (Senin orijinal route tanımlamaların)
@app.get("/api/assets")
async def get_assets():
    return {"videos": [], "audios": []}

@app.post("/api/export")
async def export_video(data: dict):
    return {"status": "success", "downloadUrl": "/static/output.mp4"}


# ====================================================================
# STATIC DOSYA VE ARAYÜZ YÖNLENDİRME YAPISI
# ====================================================================
current_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(current_dir, "static")

# Eğer klasör mevcutsa static assetleri mount et
if os.path.exists(static_dir):
    # Vite veya CRA tarafından üretilen assets/static klasörlerini bağla
    if os.path.exists(os.path.join(static_dir, "assets")):
        app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")
    if os.path.exists(os.path.join(static_dir, "static")):
        app.mount("/static", StaticFiles(directory=os.path.join(static_dir, "static")), name="static")

# Tüm URL isteklerini karşılayan ve React arayüzünü açan Catch-All rotası
@app.get("/{catchall:path}")
async def serve_react(catchall: str):
    # API çağrılarını pas geç
    if catchall.startswith("api/"):
        return None
    
    # İstenen özel bir dosya (logo, resim vb.) static klasörde varsa onu dön
    specific_file = os.path.join(static_dir, catchall)
    if os.path.exists(specific_file) and os.path.isfile(specific_file):
        return FileResponse(specific_file)
        
    # Geri kalan her şeyde ana React arayüzünü (index.html) ekrana bas
    return FileResponse(os.path.join(static_dir, "index.html"))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3012, reload=False)
