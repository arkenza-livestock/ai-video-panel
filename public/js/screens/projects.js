from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import json
import uuid
from typing import List, Optional

router = APIRouter(prefix="/api/projects", tags=["projects"])

# Pydantic Veri Doğrulama Şemaları (Validation)
class ClipSchema(BaseModel):
    id: str
    index: int
    originalName: str
    trimStart: float = 0.0
    trimEnd: float = 0.0
    speed: float = 1.0

class TimelineSchema(BaseModel):
    clips: List[ClipSchema]

class ProjectPayload(BaseModel):
    id: Optional[str] = None
    timeline: TimelineSchema

@router.post("")
async def save_project(projectJson: str = Form(...), videos: List[UploadFile] = File([])):
    try:
        # Gelen string veriyi JSON'a ve Pydantic modeline dönüştür
        data = json.loads(projectJson)
        project_data = ProjectPayload(**data)
        
        project_id = project_data.id or str(uuid.uuid4())
        
        # Disk üzerinde dosyaları kaydetme simülasyonu/mantığı
        # Gerçek kodunuzda burası dosyaları /app/temp klasörüne yazar.
        
        return {"status": "saved", "projectId": project_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Veri şeması hatası: {str(e)}")

@router.post("/{project_id}/render")
async def trigger_render(project_id: str):
    try:
        # Celery Worker'ı çağıran asenkron tetikleyici görevi
        # Örnek: task = celery_app.send_task("tasks.run_ffmpeg_render", args=[project_id])
        
        # Sisteme benzersiz bir Celery Job ID fırlatıyoruz
        mock_job_id = f"job-{str(uuid.uuid4())}"
        return {"status": "queued", "jobId": mock_job_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FFmpeg sıraya alınamadı: {str(e)}")
