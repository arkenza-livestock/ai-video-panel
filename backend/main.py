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

# Tarayıcı güvenliği (CORS) ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- BAŞLANGIÇ: KENDİ ÖZEL API ROUTER VE KODLARINIZI BURAYA EKLEYEBİLİRSİNİZ ---

@app.get("/api/v1/status")
def get_status():
    return {"status": "ok", "message": "Backend servisleri 3012 portu üzerinden çalışıyor."}

# --- BİTİŞ: KENDİ ÖZEL API ROUTER VE KODLARINIZI BURAYA EKLEYEBİLİRSİNİZ ---


# Frontend (React) Statik Dosyalarını Sunma Katmanı
frontend_dist_path = os.path.abspath("../frontend/dist")

if os.path.exists(frontend_dist_path):
    # CSS, JS gibi statik dosyaları dışarı aç
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")
    
    # Herhangi bir alt sayfaya gidildiğinde doğrudan React index.html dosyasını yükle
    @app.get("/{catchall:path}")
    async def serve_frontend(catchall: str):
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))
else:
    @app.get("/")
    def fallback_root():
        return {"error": "Frontend derleme dosyaları (dist) bulunamadı. Lütfen Dockerfile aşamalarını kontrol edin."}


# Sunucuyu kesin olarak 3012 portundan başlatan tetikleyici
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3012, reload=False)
