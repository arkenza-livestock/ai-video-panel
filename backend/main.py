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
# GARANTİLİ YAN KLASÖR STATİK BAĞLANTISI - DÜZELTİLDİ
# ====================================================================
current_dir = os.path.dirname(os.path.abspath(__file__))

# Önce backend/static klasörünü dene (npm run build sonrası kopyaladığımız yer)
static_dir = os.path.join(current_dir, "static")

# Eğer static klasörü yoksa diğer yolları dene
if not os.path.exists(static_dir):
    frontend_paths = [
        os.path.join(current_dir, "..", "frontend", "dist"),
        os.path.join(current_dir, "..", "frontend", "build"),
        os.path.join(current_dir, "frontend", "dist"),
        os.path.join(current_dir, "frontend", "build")
    ]
    
    for path in frontend_paths:
        if os.path.exists(path) and os.path.isdir(path):
            static_dir = path
            break

if os.path.exists(static_dir):
    # index.html var mı kontrol et
    index_path = os.path.join(static_dir, "index.html")
    
    if os.path.exists(index_path):
        # Assets veya static klasörleri mevcutsa mount et
        assets_dir = os.path.join(static_dir, "assets")
        if os.path.exists(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        
        static_assets_dir = os.path.join(static_dir, "static")
        if os.path.exists(static_assets_dir):
            app.mount("/static", StaticFiles(directory=static_assets_dir), name="static")
        
        # Ana sayfa
        @app.get("/")
        async def serve_root():
            return FileResponse(index_path)
        
        # Tüm tarayıcı isteklerini index.html'e pasla (Arayüzün açılması için)
        @app.get("/{full_path:path}")
        async def serve_react(full_path: str):
            # API isteklerini engelleme
            if full_path.startswith("api/"):
                return None
            
            # Dosya yolu
            file_path = os.path.join(static_dir, full_path)
            
            # Eğer dosya varsa direkt servis et
            if os.path.exists(file_path) and os.path.isfile(file_path):
                return FileResponse(file_path)
            
            # Yoksa index.html döndür (React Router için)
            return FileResponse(index_path)
        
        print(f"✅ Frontend aktif: {static_dir}")
    else:
        print(f"❌ index.html bulunamadı: {static_dir}")
        @app.get("/")
        async def root():
            return {"status": "API Aktif", "message": "index.html bulunamadı"}
else:
    # Eğer hiçbir yer bulamazsa
    print(f"❌ Statik klasör bulunamadı. Aranan: {static_dir}")
    @app.get("/")
    async def root():
        return {"status": "API Aktif", "message": "Derlenen arayüz klasörü bulunamadı."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3012, reload=False)
