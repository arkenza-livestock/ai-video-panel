import os
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Atmosfer Studio API", version="1.0.0")

# CORS Ayarları - Tarayıcı engellerini aşmak için
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Endpoint'lerin (Kendi yazdığın diğer endpoint'ler varsa buraya ekleyebilirsin)
@app.get("/api/assets")
async def get_assets():
    return {"videos": [], "audios": []}

@app.post("/api/export")
async def export_video(data: dict):
    return {"status": "success", "downloadUrl": "/static/output.mp4"}


# ====================================================================
# FRONTEND STATIK DOSYALARINI GÜVENLİ SERVİS ETME MANTIĞI
# ====================================================================
current_dir = os.path.dirname(os.path.abspath(__file__))

# Docker imajı içindeki olası tüm build/dist klasör yollarını tarıyoruz
frontend_paths = [
    os.path.join(current_dir, "frontend", "build"),
    os.path.join(current_dir, "frontend", "dist"),
    os.path.join(current_dir, "..", "frontend", "build"),
    os.path.join(current_dir, "..", "frontend", "dist"),
    "/app/backend/frontend/build",
    "/app/backend/frontend/dist"
]

static_dir = None
for path in frontend_paths:
    if os.path.exists(path) and os.path.isdir(path):
        if "index.html" in os.listdir(path):
            static_dir = path
            print(True, f"--- Statik klasör bulundu: {path} ---")
            break

if static_dir:
    # JS ve CSS varlıklarının yüklenmesi için static klasörünü mount et
    if os.path.exists(os.path.join(static_dir, "static")):
        app.mount("/static", StaticFiles(directory=os.path.join(static_dir, "static")), name="static")
    
    # Tarayıcıdan gelen tüm sayfa isteklerini index.html'e pasla (SPA Yönlendirmesi)
    @app.get("/{catchall:path}")
    async def serve_react(catchall: str):
        # API isteklerini engelleme, pas geç
        if catchall.startswith("api/"):
            return None
        
        specific_file = os.path.join(static_dir, catchall)
        if os.path.exists(specific_file) and os.path.isfile(specific_file):
            return FileResponse(specific_file)
            
        return FileResponse(os.path.join(static_dir, "index.html"))
else:
    @app.get("/")
    async def root():
        return {
            "status": "API Aktif",
            "message": "Frontend statik build dosyaları diskte bulunamadı. Lütfen Docker kopyalama adımlarını kontrol edin."
        }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3012, reload=False)
