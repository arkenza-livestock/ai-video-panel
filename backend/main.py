from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import uuid
import os
import json
import subprocess
import shutil
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
import moviepy.editor as mp
from celery import Celery
import redis
import asyncio
from concurrent.futures import ThreadPoolExecutor

# ==================== KONFİGÜRASYON ====================
class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "atmosfer-super-secret-key-2024")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./atmosfer.db")
    OUTPUT_DIR = "output"
    TEMP_DIR = "temp"
    UPLOAD_DIR = "uploads"
    MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB
    ALLOWED_EXTENSIONS = {".mp4", ".mp3", ".wav", ".jpg", ".png", ".jpeg"}

config = Config()

# ==================== UYGULAMA BAŞLATMA ====================
app = FastAPI(
    title="Atmosfer Stüdyo Pro API",
    description="Profesyonel Video Düzenleme ve Otomasyon Sistemi",
    version="2.0.0"
)

# CORS Ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Celery ve Redis
celery_app = Celery("atmosfer", broker=config.REDIS_URL, backend=config.REDIS_URL)
redis_client = redis.from_url(config.REDIS_URL)

# Thread Pool
executor = ThreadPoolExecutor(max_workers=4)

# ==================== VERİ MODELLERİ ====================
class Project(BaseModel):
    id: str
    name: str
    category: str
    template: Optional[str] = None
    created_at: str
    updated_at: str
    settings: dict = {}
    timeline: dict = {}
    status: str = "draft"

class VideoJob(BaseModel):
    project_id: str
    output_format: str = "mp4"
    resolution: str = "1920x1080"
    fps: int = 30
    bitrate: str = "5M"
    include_watermark: bool = True
    upload_to_youtube: bool = False
    youtube_title: Optional[str] = None
    youtube_description: Optional[str] = None
    youtube_tags: Optional[List[str]] = None
    youtube_category: str = "22"
    youtube_privacy: str = "unlisted"

class Asset(BaseModel):
    id: str
    type: str  # image, audio, video, font
    name: str
    url: str
    thumbnail: Optional[str] = None
    duration: Optional[float] = None
    metadata: dict = {}

# ==================== VERİTABANI (GEÇİCİ) ====================
projects_db = {}
assets_db = {}
jobs_db = {}

# ==================== API ENDPOINTLERİ ====================

@app.get("/")
async def root():
    return {
        "message": "Atmosfer Stüdyo Pro API",
        "version": "2.0.0",
        "status": "online",
        "timestamp": datetime.now().isoformat()
    }

# -------------------- PROJE YÖNETİMİ --------------------
@app.post("/api/projects")
async def create_project(
    name: str = Form(...),
    category: str = Form(...),
    template: Optional[str] = Form(None)
):
    project_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    project = {
        "id": project_id,
        "name": name,
        "category": category,
        "template": template,
        "created_at": now,
        "updated_at": now,
        "settings": {
            "resolution": "1920x1080",
            "fps": 30,
            "duration": 60,
            "background_color": "#000000"
        },
        "timeline": {
            "video_tracks": [],
            "audio_tracks": [],
            "text_tracks": []
        },
        "status": "draft"
    }
    
    projects_db[project_id] = project
    
    # JSON'a kaydet
    with open(f"{config.TEMP_DIR}/{project_id}.json", "w") as f:
        json.dump(project, f)
    
    return {"project_id": project_id, "project": project}

@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    if project_id not in projects_db:
        if os.path.exists(f"{config.TEMP_DIR}/{project_id}.json"):
            with open(f"{config.TEMP_DIR}/{project_id}.json", "r") as f:
                return json.load(f)
        raise HTTPException(404, "Proje bulunamadı")
    return projects_db[project_id]

@app.put("/api/projects/{project_id}")
async def update_project(project_id: str, project_data: dict):
    if project_id not in projects_db:
        raise HTTPException(404, "Proje bulunamadı")
    
    projects_db[project_id].update(project_data)
    projects_db[project_id]["updated_at"] = datetime.now().isoformat()
    
    with open(f"{config.TEMP_DIR}/{project_id}.json", "w") as f:
        json.dump(projects_db[project_id], f)
    
    return {"status": "updated", "project": projects_db[project_id]}

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    if project_id in projects_db:
        del projects_db[project_id]
    
    project_file = f"{config.TEMP_DIR}/{project_id}.json"
    if os.path.exists(project_file):
        os.remove(project_file)
    
    output_file = f"{config.OUTPUT_DIR}/{project_id}.mp4"
    if os.path.exists(output_file):
        os.remove(output_file)
    
    return {"status": "deleted"}

@app.get("/api/projects")
async def list_projects():
    return {"projects": list(projects_db.values()), "count": len(projects_db)}

# -------------------- ASSET YÖNETİMİ --------------------
@app.post("/api/assets/upload")
async def upload_asset(
    file: UploadFile = File(...),
    asset_type: str = Form("image")
):
    # Dosya uzantısını kontrol et
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in config.ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Desteklenmeyen dosya türü: {ext}")
    
    # Dosyayı kaydet
    asset_id = str(uuid.uuid4())
    file_path = f"{config.UPLOAD_DIR}/{asset_id}{ext}"
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    asset = {
        "id": asset_id,
        "type": asset_type,
        "name": file.filename,
        "url": file_path,
        "created_at": datetime.now().isoformat()
    }
    
    assets_db[asset_id] = asset
    
    return {"asset_id": asset_id, "asset": asset}

@app.get("/api/assets")
async def list_assets(asset_type: Optional[str] = None):
    assets = list(assets_db.values())
    if asset_type:
        assets = [a for a in assets if a["type"] == asset_type]
    return {"assets": assets, "count": len(assets)}

@app.delete("/api/assets/{asset_id}")
async def delete_asset(asset_id: str):
    if asset_id in assets_db:
        file_path = assets_db[asset_id]["url"]
        if os.path.exists(file_path):
            os.remove(file_path)
        del assets_db[asset_id]
    return {"status": "deleted"}

# -------------------- ŞABLONLAR --------------------
@app.get("/api/templates")
async def get_templates(category: Optional[str] = None):
    templates = {
        "sleep": [
            {"id": "sleep_01", "name": "Gece Yağmuru", "duration": 180, "preview": "/static/sleep_01.jpg"},
            {"id": "sleep_02", "name": "Okyanus Dalgaları", "duration": 180, "preview": "/static/sleep_02.jpg"},
            {"id": "sleep_03", "name": "Orman Rüzgarı", "duration": 180, "preview": "/static/sleep_03.jpg"},
            {"id": "sleep_04", "name": "Şömine Sesi", "duration": 180, "preview": "/static/sleep_04.jpg"}
        ],
        "book": [
            {"id": "book_01", "name": "Kütüphane Sessizliği", "duration": 120, "preview": "/static/book_01.jpg"},
            {"id": "book_02", "name": "Sayfa Çevirme", "duration": 120, "preview": "/static/book_02.jpg"},
            {"id": "book_03", "name": "Kahve ve Kitap", "duration": 120, "preview": "/static/book_03.jpg"}
        ],
        "journey": [
            {"id": "journey_01", "name": "Gece Treni", "duration": 180, "preview": "/static/journey_01.jpg"},
            {"id": "journey_02", "name": "Şehir Işıkları", "duration": 180, "preview": "/static/journey_02.jpg"},
            {"id": "journey_03", "name": "Deniz Vapuru", "duration": 180, "preview": "/static/journey_03.jpg"}
        ],
        "war": [
            {"id": "war_01", "name": "Savaş Rüzgarı", "duration": 60, "preview": "/static/war_01.jpg"},
            {"id": "war_02", "name": "Asker Marşı", "duration": 60, "preview": "/static/war_02.jpg"}
        ]
    }
    
    if category and category in templates:
        return {"templates": templates[category]}
    return {"templates": templates}

# -------------------- VİDEO OLUŞTURMA --------------------
@app.post("/api/render/{project_id}")
async def render_video(project_id: str, job_config: VideoJob):
    if project_id not in projects_db:
        raise HTTPException(404, "Proje bulunamadı")
    
    job_id = str(uuid.uuid4())
    job_data = {
        "job_id": job_id,
        "project_id": project_id,
        "status": "queued",
        "config": job_config.dict(),
        "created_at": datetime.now().isoformat()
    }
    
    jobs_db[job_id] = job_data
    
    # Celery'ye gönder
    celery_app.send_task("render_video", args=[project_id, job_id, job_config.dict()])
    
    return {"job_id": job_id, "status": "queued"}

@app.get("/api/render/status/{job_id}")
async def render_status(job_id: str):
    if job_id not in jobs_db:
        raise HTTPException(404, "İş bulunamadı")
    
    # Redis'ten status kontrol et
    status = redis_client.get(f"job_{job_id}")
    if status:
        jobs_db[job_id]["status"] = status.decode()
    
    return jobs_db[job_id]

@app.get("/api/render/download/{job_id}")
async def download_video(job_id: str):
    output_path = f"{config.OUTPUT_DIR}/{job_id}.mp4"
    if not os.path.exists(output_path):
        raise HTTPException(404, "Video henüz hazır değil")
    
    return FileResponse(output_path, media_type="video/mp4", filename=f"atmosfer_{job_id}.mp4")

# -------------------- YOUTUBE ENTEGRASYONU --------------------
@app.post("/api/youtube/upload/{job_id}")
async def upload_to_youtube(
    job_id: str,
    title: str = Form(...),
    description: str = Form(""),
    tags: str = Form(""),
    privacy: str = Form("unlisted")
):
    output_path = f"{config.OUTPUT_DIR}/{job_id}.mp4"
    if not os.path.exists(output_path):
        raise HTTPException(404, "Video bulunamadı")
    
    # YouTube'a yükleme işlemi (API anahtarı gerekli)
    # Şimdilik simülasyon
    return {
        "status": "upload_simulated",
        "video_id": f"yt_{job_id}",
        "url": f"https://youtu.be/yt_{job_id}"
    }

# ==================== CELERY GÖREVLERİ ====================
@celery_app.task(name="render_video")
def render_video_task(project_id: str, job_id: str, config: dict):
    redis_client.set(f"job_{job_id}", "processing")
    
    try:
        # FFmpeg ile video oluştur
        project = projects_db.get(project_id)
        if not project:
            raise Exception("Proje bulunamadı")
        
        output_path = f"/app/output/{job_id}.mp4"  # Docker içinde
        
        # Basit video oluştur (şimdilik)
        cmd = [
            "ffmpeg", "-f", "lavfi", "-i",
            f"color=c=black:s={config['resolution']}:d={config.get('duration', 60)}",
            "-vf", f"drawtext=text='{project['name']}':fontcolor=white:fontsize=70:x=(w-text_w)/2:y=(h-text_h)/2",
            "-c:v", "libx264",
            "-b:v", config['bitrate'],
            "-r", str(config['fps']),
            output_path
        ]
        subprocess.run(cmd, check=True)
        
        redis_client.set(f"job_{job_id}", "completed")
        
        # YouTube'a yükle
        if config.get("upload_to_youtube"):
            # YouTube upload kodları buraya gelecek
            pass
        
        return {"status": "completed", "output": output_path}
        
    except Exception as e:
        redis_client.set(f"job_{job_id}", f"failed: {str(e)}")
        raise e

# ==================== KLASÖR OLUŞTURMA ====================
os.makedirs(config.OUTPUT_DIR, exist_ok=True)
os.makedirs(config.TEMP_DIR, exist_ok=True)
os.makedirs(config.UPLOAD_DIR, exist_ok=True)

# ==================== BAŞLAT ====================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
