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
    return {"status": "ok", "message": "Backend servisleri çalışıyor."}

# --- BİTİŞ: KENDİ ÖZEL API ROUTER VE KODLARINIZI BURAYA EKLEYEBİLİRSİNİZ ---


# Frontend (React) Statik Dosyalarını Sunma Katmanı
# Docker yapısındaki göreceli yola göre frontend klasörünü bulur
frontend_dist_path = os.path.abspath("../frontend/dist")

if os.path.exists(frontend_dist_path):
    # CSS, JS gibi statik varlıkları dışarı aç
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")
    
    # Kullanıcı ana sayfaya veya herhangi bir alt sayfaya geldiğinde React arayüzünü yükle
    @app.get("/{catchall:path}")
    async def serve_frontend(catchall: str):
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))
else:
    @app.get("/")
    def fallback_root():
        return {"error": "Frontend derleme dosyaları (dist) bulunamadı. Lütfen Dockerfile derlemesini kontrol edin."}


# Docker katmanında kilitlenmeyi önleyen ve 3012 portunu tetikleyen başlatıcı
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3012)
