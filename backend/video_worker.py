import os
import json
import subprocess
import time
from celery import Celery

# Redis bağlantısı - DOCKER İÇİN DÜZELTİLDİ
celery_app = Celery(
    "video_worker",
    broker="redis://redis:6379/0",      # localhost yerine redis
    backend="redis://redis:6379/0"      # localhost yerine redis
)

# Geçici video oluşturma fonksiyonu
def create_video_with_ffmpeg(job_id, config):
    """
    FFmpeg ile video oluştur
    """
    duration_seconds = config["duration_hours"] * 3600
    
    # Klasörleri oluştur
    os.makedirs("temp", exist_ok=True)
    os.makedirs("output", exist_ok=True)
    
    # Geçici görsel (siyah ekran)
    image_path = "temp/blank.png"
    
    # Siyah bir görsel oluştur
    subprocess.run([
        "ffmpeg", "-f", "lavfi", "-i", "color=c=black:s=1920x1080:d=1",
        "-frames:v", "1", image_path
    ], capture_output=True)
    
    # Video dosya yolu
    output_path = f"output/{job_id}.mp4"
    
    # FFmpeg ile video oluştur
    cmd = [
        "ffmpeg",
        "-loop", "1",
        "-i", image_path,
        "-t", str(duration_seconds),
        "-vf", "zoompan=z=1.001:x=0:y=0:d=1:s=1920x1080",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-r", "24",
        output_path
    ]
    
    subprocess.run(cmd, capture_output=True)
    
    return output_path

@celery_app.task(name="create_video")
def create_video_task(job_id, config):
    """
    Celery görevi: Video oluştur
    """
    print(f"🎬 Video oluşturma başladı: {job_id}")
    print(f"📝 Konfigürasyon: {config}")
    
    try:
        video_path = create_video_with_ffmpeg(job_id, config)
        print(f"✅ Video oluştu: {video_path}")
        
        return {
            "job_id": job_id,
            "status": "completed",
            "video_path": video_path,
            "message": "Video başarıyla oluşturuldu"
        }
        
    except Exception as e:
        print(f"❌ Hata: {e}")
        return {
            "job_id": job_id,
            "status": "failed",
            "error": str(e),
            "message": "Video oluşturulurken hata oluştu"
        }

if __name__ == "__main__":
    celery_app.start()
