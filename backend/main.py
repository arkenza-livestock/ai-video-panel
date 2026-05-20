import os
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Atmosfer Studio API", version="1.0.0")

# Tarayıcı engellerini (CORS) aşmak için izinler
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Örnek API Endpoint'leri
@app.get("/api/assets")
async def get_assets():
    return {"videos": [], "audios": []}

@app.post("/api/export")
async def export_video(data: dict):
    return {"status": "success", "downloadUrl": "/static/output.mp4"}

# Production ortamında derlenmiş React dosyalarını servis etme mantığı
current_dir = os.path.dirname(os.path.abspath(__file__))
frontend_paths = [
    os.path.join(current_dir, "frontend", "dist"),
    os.path.join(current_dir, "frontend", "build"),
    os.path.join(current_dir, "..", "frontend", "dist"),
    os.path.join(current_dir, "..", "frontend", "build")
]

static_dir = None
for path in frontend_paths:
    if os.path.exists(path) and os.path.isdir(path):
        if "index.html" in os.listdir(path):
            static_dir = path
            break

if static_dir:
    # Asset dosyaları için static klasörünü bağla
    if os.path.exists(os.path.join(static_dir, "static")):
        app.mount("/static", StaticFiles(directory=os.path.join(static_dir, "static")), name="static")
    
    # Tüm sayfa yönlendirmelerini index.html'e pasla (SPA routing)
    @app.get("/{catchall:path}")
    async def serve_react(catchall: str):
        if catchall.startswith("api/"):
            return None
        
        specific_file = os.path.join(static_dir, catchall)
        if os.path.exists(specific_file) and os.path.isfile(specific_file):
            return FileResponse(specific_file)
            
        return FileResponse(os.path.join(static_dir, "index.html"))
else:
    @app.get("/")
    async def root():
        return {"message": "API aktif, ancak frontend statik dosyaları bulunamadı."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3012, reload=True)
