cat > /app/main.py << 'EOF'
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid
import json
import os
from celery import Celery

# FastAPI uygulamasını başlat
app = FastAPI(title="Atmosfer Stüdyo API", description="Video otomasyon sistemi")

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis bağlantısı (Celery için)
celery_app = Celery(
    "video_worker",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0"
)

# Klasör yapısını oluştur
os.makedirs("temp", exist_ok=True)
os.makedirs("output", exist_ok=True)

# Video işlerini tutacağımız basit bir liste
jobs_db = {}

# --- Veri Modelleri ---
class VideoJob(BaseModel):
    format: str
    title: str
    story_text: str
    duration_hours: int = 3
    music_type: str = "piano"
    rain_intensity: str = "medium"
    sound_frequency: str = "normal"

class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str

# --- API Endpoint'leri ---

@app.get("/")
def root():
    return {"message": "Atmosfer Stüdyo API çalışıyor 🎬", "version": "1.0.0"}

@app.get("/formats")
def get_formats():
    return {
        "formats": [
            {
                "id": "sleep",
                "name": "🌙 Uyku Ambiyansı",
                "description": "3 saat yağmur, lo-fi müzik ve huzurlu atmosfer",
                "default_duration": 3,
                "icon": "🌙"
            },
            {
                "id": "book",
                "name": "📖 Kitap Okuma Ambiyansı",
                "description": "Sayfa sesi, hafif klasik müzik, yumuşak yağmur",
                "default_duration": 1,
                "icon": "📖"
            },
            {
                "id": "journey",
                "name": "🚂 Yolculuk Ambiyansı",
                "description": "Tren rayı, uzak anonslar, gece yolculuğu hissi",
                "default_duration": 3,
                "icon": "🚂"
            }
        ]
    }

@app.post("/create-job", response_model=JobResponse)
def create_job(job: VideoJob):
    """Yeni video oluşturma işi başlat - Celery'ye gönder"""
    job_id = str(uuid.uuid4())
    
    # İş bilgilerini kaydet
    job_data = {
        "status": "queued",
        "format": job.format,
        "title": job.title,
        "story_text": job.story_text,
        "duration_hours": job.duration_hours,
        "music_type": job.music_type,
        "rain_intensity": job.rain_intensity,
        "created_at": str(__import__("datetime").datetime.now())
    }
    
    jobs_db[job_id] = job_data
    
    # JSON dosyasına kaydet
    with open(f"temp/{job_id}.json", "w") as f:
        json.dump(job_data, f, indent=2)
    
    # Celery'ye video oluşturma görevi gönder
    celery_app.send_task("create_video", args=[job_id, {
        "format": job.format,
        "duration_hours": job.duration_hours,
        "music_type": job.music_type,
        "rain_intensity": job.rain_intensity
    }])
    
    return JobResponse(
        job_id=job_id,
        status="queued",
        message=f"İşiniz kuyruğa alındı! ID: {job_id}"
    )

@app.get("/job-status/{job_id}")
def get_job_status(job_id: str):
    """İşin durumunu sorgula"""
    if job_id not in jobs_db:
        if os.path.exists(f"temp/{job_id}.json"):
            with open(f"temp/{job_id}.json", "r") as f:
                job_data = json.load(f)
                return {"job_id": job_id, **job_data}
        raise HTTPException(status_code=404, detail="İş bulunamadı")
    
    return {"job_id": job_id, **jobs_db[job_id]}

@app.get("/jobs")
def list_all_jobs():
    """Tüm işleri listele"""
    return {"jobs": jobs_db, "count": len(jobs_db)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF
