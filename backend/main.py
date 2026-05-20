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

# API Endpoint'lerin
@app.get("/api/assets")
async def get_assets():
    return {"videos": [], "audios": []}

@app.post("/api/export")
async def export_video(data: dict):
    return {"status": "success", "downloadUrl": "/static/output.mp4"}


# ====================================================================
# SABİT STATIC KLASÖR BAĞLANTISI
# ====================================================================
current_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(current_dir, "static")

# Statik klasörün varlığını kontrol etmeden direkt mount ediyoruz
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Tüm istekleri index.html'e yönlendir (Arayüzün açılması için)
@app.get("/{catchall:path}")
async def serve_react(catchall: str):
    if catchall.startswith("api/"):
        return None
    
    specific_file = os.path.join(static_dir, catchall)
    if os.path.exists(specific_file) and os.path.isfile(specific_file):
        return FileResponse(specific_file)
        
    return FileResponse(os.path.join(static_dir, "index.html"))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3012, reload=False)
