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

# API Rotaları
@app.get("/api/assets")
async def get_assets():
    return {"videos": [], "audios": []}

@app.post("/api/export")
async def export_video(data: dict):
    return {"status": "success", "downloadUrl": "/static/output.mp4"}


# ====================================================================
# STATİK DOSYALARI DOĞRUDAN SERVİS ETME ALANI
# ====================================================================
current_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(current_dir, "static")

# Statik klasör yoksa bile çökmemesi için oluştur
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

# Vite ve CRA asset yollarını doğrudan mount et
if os.path.exists(os.path.join(static_dir, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")
if os.path.exists(os.path.join(static_dir, "static")):
    app.mount("/static", StaticFiles(directory=os.path.join(static_dir, "static")), name="static")

# Tüm tarayıcı isteklerini doğrudan index.html'e pasla
@app.get("/{catchall:path}")
async def serve_react(catchall: str):
    if catchall.startswith("api/"):
        return None
    
    specific_file = os.path.join(static_dir, catchall)
    if os.path.exists(specific_file) and os.path.isfile(specific_file):
        return FileResponse(specific_file)
        
    # index.html dosyasını doğrudan fırlatıyoruz
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return {
        "status": "API Aktif",
        "message": "Statik arayüz dosyaları kopyalanamadı. Lütfen Docker build adımlarını inceleyin."
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3012, reload=False)
