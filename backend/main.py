from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import uvicorn

app = FastAPI(
    title="Atmosfer Studio Pro API",
    version="2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API ROUTER VE KODLARINIZ BURAYA EKLEYEBİLİRSİNİZ ---
@app.get("/api/v1/status")
def get_status():
    return {"status": "ok", "message": "Backend servisleri 3012 portu üzerinden çalışıyor."}


# --- FRONTEND ENTEGRASYON KATMANI (GARANTİLİ DİZİN KONTROLÜ) ---
# Docker içindeki mutlak yolları (Absolute Path) kontrol ediyoruz
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
    # Statik klasör tanımlaması (css, js, media dosyaları için)
    static_dir = os.path.join(frontend_build_path, "static")
    if os.path.exists(static_dir):
        app.mount("/static", StaticFiles(directory=static_dir), name="static")
    
    # Geri kalan tüm istekleri React Router'ın karşılaması için index.html'e yönlendir
    @app.get("/{catchall:path}")
    async def serve_frontend(catchall: str):
        return FileResponse(os.path.join(frontend_build_path, "index.html"))
else:
    @app.get("/")
    def fallback_root():
        return {
            "status": "Backend Çalışıyor",
            "error": "Frontend build klasörü veya index.html bulunamadı.",
            "tar can yollari": possible_paths
        }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3012, reload=False)
