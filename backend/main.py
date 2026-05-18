cat > /root/main.py << 'EOF'
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uuid
import os
import subprocess

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("output", exist_ok=True)
jobs_db = {}

class ExportRequest(BaseModel):
    duration: int = 10

@app.get("/")
def root():
    return {"message": "Atmosfer API calisiyor"}

@app.post("/api/export")
def export_video(req: ExportRequest):
    job_id = str(uuid.uuid4())
    output_path = f"output/{job_id}.mp4"
    
    cmd = ["ffmpeg", "-f", "lavfi", "-i", f"color=c=black:s=640x480:d={req.duration}", "-c:v", "libx264", "-y", output_path]
    subprocess.run(cmd, check=True, capture_output=True)
    
    jobs_db[job_id] = {"status": "done", "path": output_path}
    return {"job_id": job_id, "status": "completed"}

@app.get("/api/export/download/{job_id}")
def download(job_id: str):
    if job_id not in jobs_db:
        raise HTTPException(404, "Bulunamadi")
    return FileResponse(jobs_db[job_id]["path"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF
