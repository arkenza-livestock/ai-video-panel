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

# Senin orijinal API Endpoint'lerin
@app.get("/api/assets")
async def get_assets():
    return {"videos": [], "audios": []}

@app.post("/api/export")
async def export_video(data: dict):
    return {"status": "success", "downloadUrl": "/static/output.mp4"}


# ====================================================================
# GARANTİLİ YAN KLASÖR STATİK BAĞLANTISI
# ====================================================================
current_dir = os.path.dirname(os.path.abspath(__file__))

# Az önce yan klasörde derlenen dist veya build yollarını hedef alıyoruz
frontend_paths = [
    os.path.join(current_dir, "..", "frontend", "dist"),
    os.path.join(current_dir, "..", "frontend", "build"),
    os.path.join(current_dir, "frontend", "dist"),
    os.path.join(current_dir, "frontend", "build")
]

static_dir = None
for path in frontend_paths:
    if os.path.exists(path) and "index.html" in os.listdir(path):
        static_dir = path
        break

if static_dir:
    # Assets veya static klasörleri mevcutsa mount et
    if os.path.exists(os.path.join(static_dir, "assets")):
        app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")
    if os.path.exists(os.path.join(static_dir, "static")):
        app.mount("/static", StaticFiles(directory=os.path.join(static_dir, "static")), name="static")

    # Tüm tarayıcı isteklerini index.html'e pasla (Arayüzün açılması için)
    @app.get("/{catchall:path}")
    async def serve_react(catchall: str):
        if catchall.startswith("api/"):
            return None
        
        specific_file = os.path.join(static_dir, catchall)
        if os.path.exists(specific_file) and os.path.isfile(specific_file):
            return FileResponse(specific_file)
            
        return FileResponse(os.path.join(static_dir, "index.html"))
else:
    # Eğer hiçbir yer bulamazsa çökme, geçici olarak ana dizini bağla
    @app.get("/")
    async def root():
        return {"status": "API Aktif", "message": "Derlenen arayüz klasörü bulunamadı."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3012, reload=False)
