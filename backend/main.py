import os
import sys

# Python kütüphanelerinin (moviepy vb.) FFmpeg'i Docker içinde doğrudan bulması için yolları sabitliyoruz
os.environ["IMAGEIO_FFMPEG_EXE"] = "/usr/bin/ffmpeg"
os.environ["FFMPEG_BINARY"] = "/usr/bin/ffmpeg"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

app = FastAPI(
    title="Atmosfer Studio Pro API",
    version="2.0"
)

# Tarayıcı güvenlik (CORS) ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- BAŞLANGIÇ: API ROUTER VE ÖZEL BACKEND KODLARINIZ ---

@app.get("/api/v1/status")
def get_status():
    return {
        "status": "ok", 
        "message": "Backend ve FFmpeg motoru 3012 portu üzerinden aktif."
    }

# Kendi yazdığın diğer @app.get, @app.post gibi API uçlarını (eğer varsa) bu aralığa ekleyebilirsin.

# --- BİTİŞ: API ROUTER VE ÖZEL BACKEND KODLARINIZ ---


# --- FRONTEND ENTEGRASYON KATMANI (GARANTİLİ DİZİN KONTROLÜ) ---
# Docker konteyneri içindeki tüm olası build klasör yollarını tarıyoruz
possible_paths = [
    os.path.abspath("/app/frontend/build"),
    os.path.abspath("../frontend/build"),
    os.path.abspath("./frontend/build")
]

frontend_build_path = None
for path in possible_paths:
    if os.path.exists(path) and os.path.exists(os.path.join(path, "index.html")):
        frontend_build_path = path
        break

if frontend_build_path:
    # CSS, JS ve medya dosyalarının tarayıcıya hatasız iletilmesi
    static_dir = os.path.join(frontend_build_path, "static")
    if os.path.exists(static_dir):
        app.mount("/static", StaticFiles(directory=static_dir), name="static")
    
    # Kullanıcı sayfayı yenilediğinde veya alt sayfalara gittiğinde React Router'ı tetikle
    @app.get("/{catchall:path}")
    async def serve_frontend(catchall: str):
        return FileResponse(os.path.join(frontend_build_path, "index.html"))
else:
    @app.get("/")
    def fallback_root():
        return {
            "status": "Backend Çalışıyor",
            "error": "Frontend build klasörü veya index.html bulunamadı.",
            "kontrol_edilen_yollar": possible_paths
        }


# Sunucunun dış dünyaya tamamen 3012 portundan kilitlenmesini sağlayan tetikleyici
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3012, reload=False)
