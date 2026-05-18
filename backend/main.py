cat > /root/main.py << 'EOF'
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uuid
import os
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

os.makedirs("temp", exist_ok=True)
os.makedirs("output", exist_ok=True)

jobs_db = {}

class ExportRequest(BaseModel):
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
    job_id = str(uuid.uuid4())
    output_path = f"output/{job_id}.mp4"
    
    cmd = [
        "ffmpeg", "-f", "lavfi", "-i",
        f"color=c=black:s={request.resolution}:d={request.duration}",
        "-vf", "drawtext=text='Atmosfer Stüdyo':fontcolor=white:fontsize=70:x=(w-text_w)/2:y=(h-text_h)/2",
        "-c:v", "libx264", "-r", str(request.fps), "-y", output_path
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        jobs_db[job_id] = {"status": "completed", "output_path": output_path}
        return {"job_id": job_id, "status": "completed", "message": "Video oluşturuldu"}
    except Exception as e:
        jobs_db[job_id] = {"status": "failed", "error": str(e)}
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/export/download/{job_id}")
def download_video(job_id: str):
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="İş bulunamadı")
    job = jobs_db[job_id]
    if not os.path.exists(job["output_path"]):
        raise HTTPException(status_code=404, detail="Video dosyası bulunamadı")
    return FileResponse(job["output_path"], filename=f"atmosfer_{job_id}.mp4")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF
