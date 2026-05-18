cat > /root/main.py << 'EOF'
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import uuid
import os
import json
import subprocess
from datetime import datetime

app = FastAPI(title="Atmosfer Stüdyo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Klasörler
os.makedirs("temp", exist_ok=True)
os.makedirs("output", exist_ok=True)

# Video job veritabanı
jobs_db = {}

class ExportRequest(BaseModel):
    timeline: dict = {}
    duration: int = 60
    resolution: str = "1920x1080"
    fps: int = 30

@app.get("/")
def root():
    return {"message": "Atmosfer Stüdyo API çalışıyor", "status": "active"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/export")
def export_video(request: ExportRequest):
    """Video oluşturma endpoint'i"""
    job_id = str(uuid.uuid4())
    
    # İş bilgilerini kaydet
    job_data = {
        "job_id": job_id,
        "status": "processing",
        "duration": request.duration,
        "resolution": request.resolution,
        "fps": request.fps,
        "created_at": datetime.now().isoformat()
    }
    jobs_db[job_id] = job_data
    
    # FFmpeg ile basit video oluştur
    output_path = f"output/{job_id}.mp4"
    
    cmd = [
        "ffmpeg", "-f", "lavfi", "-i",
        f"color=c=black:s={request.resolution}:d={request.duration}",
        "-vf", f"drawtext=text='Atmosfer Stüdyo':fontcolor=white:fontsize=70:x=(w-text_w)/2:y=(h-text_h)/2",
        "-c:v", "libx264",
        "-r", str(request.fps),
        "-y", output_path
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        job_data["status"] = "completed"
        job_data["output_path"] = output_path
        return {"job_id": job_id, "status": "completed", "message": "Video oluşturuldu"}
    except Exception as e:
        job_data["status"] = "failed"
        job_data["error"] = str(e)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/export/status/{job_id}")
def get_export_status(job_id: str):
    """İş durumunu sorgula"""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="İş bulunamadı")
    return jobs_db[job_id]

@app.get("/api/export/download/{job_id}")
def download_video(job_id: str):
    """Oluşturulan videoyu indir"""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="İş bulunamadı")
    
    job = jobs_db[job_id]
    if job.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Video henüz hazır değil")
    
    output_path = job.get("output_path")
    if not output_path or not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Video dosyası bulunamadı")
    
    return FileResponse(output_path, media_type="video/mp4", filename=f"atmosfer_{job_id}.mp4")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF
