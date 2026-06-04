import json
import os
import subprocess
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["projects"])

# 1. VERİ DOĞRULAMA ŞEMALARI (Arayüzden gelen verileri yakalar)
class ClipSchema(BaseModel):
    id: str
    index: int
    originalName: str
    trimStart: float = 0.0
    trimEnd: float = 0.0
    speed: float = 1.0

class TimelineSchema(BaseModel):
    clips: List[ClipSchema] = []

class ProjectPayload(BaseModel):
    id: Optional[str] = None
    timeline: TimelineSchema

# Klasör ve Dosya Yolları Ayarları
TEMP_DIR = "/app/temp"
OUTPUT_DIR = "/app/output"
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Geçici veri saklama havuzu (Projelerin ayarlarını RAM üzerinde tutar)
PROJECTS_DB = {}
# Render durumlarını takip eden havuz
JOBS_DB = {}

# 2. PROJE KAYDETME ENDPOINT'İ
@router.post("/projects")
async def save_project(projectJson: str = Form(...), videos: List[UploadFile] = File([])):
    try:
        # Gelen metni JSON nesnesine ve Pydantic modeline çevir
        data = json.loads(projectJson)
        project_data = ProjectPayload(**data)
        
        project_id = project_data.id or str(uuid.uuid4())
        
        # Yüklenen video dosyalarını fiziksel olarak diske yazıyoruz
        saved_video_paths = []
        for video in videos:
            # Dosya adındaki boşlukları temizle ve güvenli hale getir
            safe_filename = video.filename.replace(" ", "_")
            file_path = os.path.join(TEMP_DIR, f"{project_id}_{safe_filename}")
            
            with open(file_path, "wb") as buffer:
                content = await video.read()
                buffer.write(content)
            saved_video_paths.append(file_path)
            
        # Proje verilerini ve dosya yollarını hafızaya kaydet
        PROJECTS_DB[project_id] = {
            "payload": project_data.dict(),
            "video_paths": saved_video_paths
        }
        
        return {"status": "saved", "projectId": project_id, "id": project_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Veri şeması veya dosya yazma hatası: {str(e)}")

# 3. REAL FFMPEG RENDER MOTORU ENDPOINT'İ
@router.post("/projects/{project_id}/render")
async def trigger_render(project_id: str):
    if project_id not in PROJECTS_DB:
        raise HTTPException(status_code=404, detail="Proje bulunamadı. Önce kaydetmelisiniz.")
        
    project = PROJECTS_DB[project_id]
    clips = project["payload"]["timeline"]["clips"]
    
    if not clips:
        raise HTTPException(status_code=400, detail="Timeline üzerinde işlenecek klip yok.")

    job_id = f"job-{str(uuid.uuid4())}"
    output_filename = f"render_{project_id}.mp4"
    output_path = os.path.join(OUTPUT_DIR, output_filename)

    # Sunucunun çökmemesi için işi sıraya alıyoruz (PENDING)
    JOBS_DB[job_id] = {"status": "RUNNING", "progress": 10, "outputUrl": None}

    try:
        # FFmpeg için birleştirme (concat) listesi hazırlıyoruz
        list_file_path = os.path.join(TEMP_DIR, f"list_{job_id}.txt")
        
        with open(list_file_path, "w") as f:
            for clip in sorted(clips, key=lambda x: x["index"]):
                # Kaydedilen dosyalardan bu klibe ait olanı bul
                matched_path = None
                for path in project["video_paths"]:
                    if clip["originalName"].replace(" ", "_") in path:
                        matched_path = path
                        break
                
                if matched_path and os.path.exists(matched_path):
                    f.write(f"file '{matched_path}'\n")

        # Gerçek FFmpeg terminal komutunu oluştur ve çalıştır
        # -y: Dosya varsa üzerine yaz, -f concat: Dosyaları arka arkaya ekle
        ffmpeg_cmd = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0", 
            "-i", list_file_path, "-c:v", "libx264", "-pix_fmt", "yuv420p", output_path
        ]
        
        # Komutu işletim sisteminde çalıştır
        process = subprocess.run(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        if process.returncode != 0:
            # FFmpeg başarısız olduysa hatayı logla
            JOBS_DB[job_id] = {"status": "FAILURE", "progress": 0, "error": process.stderr}
            return {"status": "failed", "jobId": job_id}

        # Render başarıyla bitti, durumu güncelle ve dışarı açılan video linkini tanımla
        output_url = f"/output/{output_filename}"
        JOBS_DB[job_id] = {"status": "SUCCESS", "progress": 100, "outputUrl": output_url}
        
        # Geçici txt listesini temizle
        if os.path.exists(list_file_path):
            os.remove(list_file_path)

        return {"status": "queued", "jobId": job_id, "id": job_id}
        
    except Exception as e:
        JOBS_DB[job_id] = {"status": "FAILURE", "progress": 0, "error": str(e)}
        return {"status": "failed", "jobId": job_id, "detail": str(e)}

# 4. CELERY POLLING SORGULAMA ENDPOINT'İ (Arayüzün sürekli yokladığı yer)
@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    if job_id not in JOBS_DB:
        # Eğer henüz listede yoksa tarayıcıyı bekletmek için işlemde dönüyoruz
        return {"status": "PENDING", "progress": 0, "outputUrl": None}
        
    return JOBS_DB[job_id]
