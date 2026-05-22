import os
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI(title="Atmosfer Studio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExportRequest(BaseModel):
    tracks: List[Dict[str, Any]]

@app.get("/api/assets")
async def get_assets():
    return {"videos": [], "audios": []}

@app.post("/api/export")
async def export_video(data: ExportRequest):
    return {"status": "success", "downloadUrl": "/static/output.mp4"}

# ====================================================================
# STATİK DOSYA SERVİSİ - DÜZELTİLMİŞ VERSİYON
# ====================================================================
current_dir = os.path.dirname(os.path.abspath(__file__))

# Olası frontend build yolları
frontend_paths = [
    os.path.join(current_dir, "..", "frontend", "dist"),
    os.path.join(current_dir, "..", "frontend", "build"),
    os.path.join(current_dir, "frontend", "dist"),
    os.path.join(current_dir, "frontend", "build"),
    os.path.join(current_dir, "static"),  # Statik klasör kontrolü
]

static_dir = None
for path in frontend_paths:
    if os.path.exists(path):
        index_path = os.path.join(path, "index.html")
        if os.path.exists(index_path):
            static_dir = path
            print(f"✅ Statik dosyalar bulundu: {static_dir}")
            break

if static_dir:
    # Assets klasörünü mount et
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    
    # Ana yönlendirme
    @app.get("/")
    async def serve_root():
        return FileResponse(os.path.join(static_dir, "index.html"))
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # API isteklerini engelleme
        if full_path.startswith("api/"):
            return None
        
        # Dosya yolu
        file_path = os.path.join(static_dir, full_path)
        
        # Eğer dosya varsa direkt servis et
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Yoksa index.html döndür (React Router için)
        return FileResponse(os.path.join(static_dir, "index.html"))
    
    print(f"✅ Frontend servisi aktif: {static_dir}")
else:
    print("❌ UYARI: Derlenmiş frontend dosyaları bulunamadı!")
    
    @app.get("/")
    async def root():
        return {
            "status": "API Aktif", 
            "message": "Frontend build edilmedi. Lütfen 'npm run build' komutunu çalıştırın.",
            "searched_paths": frontend_paths
        }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3012))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
