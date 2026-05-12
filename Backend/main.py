"""
ATMOSFER STÜDYO PRO - Profesyonel Video Editor Backend
Advanced video editing API with timeline, effects, and asset management
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uuid
import json
import os
from datetime import datetime
from celery import Celery
from dotenv import load_dotenv
import sqlite3
from enum import Enum

# Load environment variables
load_dotenv()

# ============================================================================
# ENUMS & CONSTANTS
# ============================================================================

class VideoCategory(str, Enum):
    """Video Kategorileri"""
    SAVAŞ = "savaş"  # Samuray, Şövalye, Gladyatör vs
    UYKU = "uyku"
    MEDITASYON = "meditasyon"
    ÇALIŞMA = "çalışma"
    MÜZIK_KLİP = "müzik_klip"
    PODCAST = "podcast"
    SİNEMATİK = "sinematik"
    DOĞA = "doğa"
    TÜTÖRİYAL = "tütöryial"
    OYUN = "oyun"

class LayerType(str, Enum):
    """Timeline Katman Türleri"""
    VIDEO = "video"
    IMAGE = "image"
    AUDIO = "audio"
    TEXT = "text"
    EFFECT = "effect"
    TRANSITION = "transition"

class EffectType(str, Enum):
    """Efekt Türleri"""
    ZOOM = "zoom"
    PAN = "pan"
    FADE = "fade"
    DISSOLVE = "dissolve"
    COLOR_GRADE = "color_grade"
    BLUR = "blur"
    GLOW = "glow"
    SHARPEN = "sharpen"
    SLOW_MOTION = "slow_motion"
    SPEED_UP = "speed_up"

# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

def init_database():
    """Initialize SQLite database"""
    conn = sqlite3.connect("atmosfer_pro.db")
    cursor = conn.cursor()
    
    # Projects table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            duration INTEGER,
            template TEXT,
            created_at TIMESTAMP,
            updated_at TIMESTAMP,
            data JSON
        )
    """)
    
    # Layers table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS layers (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            layer_type TEXT NOT NULL,
            start_time REAL,
            end_time REAL,
            asset_id TEXT,
            properties JSON,
            order_index INTEGER,
            FOREIGN KEY(project_id) REFERENCES projects(id)
        )
    """)
    
    # Assets table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assets (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            source TEXT,
            category TEXT,
            filename TEXT,
            url TEXT,
            metadata JSON,
            created_at TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()

init_database()

# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

app = FastAPI(
    title="Atmosfer Stüdyo PRO",
    description="Profesyonel Video Editor - Advanced Timeline Editing, Asset Management, Effects & More",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis & Celery Setup
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("video_pro", broker=redis_url, backend=redis_url)
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
)

# Create directories
os.makedirs("temp", exist_ok=True)
os.makedirs("output", exist_ok=True)
os.makedirs("uploads", exist_ok=True)
os.makedirs("logs", exist_ok=True)

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class TimelineLayer(BaseModel):
    """Timeline Layer Model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    layer_type: LayerType
    asset_id: Optional[str] = None
    start_time: float
    end_time: float
    properties: Dict[str, Any] = {}
    effects: List[Dict[str, Any]] = []
    transitions: List[Dict[str, Any]] = []

class VideoTemplate(BaseModel):
    """Video Template Model"""
    name: str
    category: VideoCategory
    description: str
    structure: Dict[str, Any]
    default_assets: Dict[str, str] = {}

class Project(BaseModel):
    """Video Project Model"""
    title: str
    category: VideoCategory
    duration: int = 300  # 5 minutes default
    fps: int = 30
    resolution: str = "1920x1080"
    template: Optional[str] = None
    layers: List[TimelineLayer] = []

class ProjectResponse(BaseModel):
    """Project Response"""
    project_id: str
    title: str
    category: str
    status: str
    created_at: str
    layers_count: int

class Asset(BaseModel):
    """Asset Model (Resim, Müzik, SFX)"""
    asset_type: str  # music, image, sfx, video
    source: str  # uploaded, unsplash, pexels, epidemic
    category: str
    metadata: Dict[str, Any] = {}

class ExportSettings(BaseModel):
    """Export Quality Settings"""
    format: str = "mp4"  # mp4, webm, mov
    quality: str = "high"  # low, medium, high, 4k
    preset: str = "balanced"  # fast, balanced, slow (quality)
    bitrate: str = "5000k"
    fps: int = 30
    watermark: Optional[bool] = False
    youtube_optimize: Optional[bool] = False

# ============================================================================
# API ENDPOINTS - INFO & FORMATS
# ============================================================================

@app.get("/", tags=["Info"])
def root():
    """API Root"""
    return {
        "name": "Atmosfer Stüdyo PRO",
        "version": "2.0.0",
        "type": "Professional Video Editor",
        "features": [
            "Timeline Editor",
            "Asset Management",
            "Effects & Transitions",
            "Color Grading",
            "Audio Mixing",
            "Template System",
            "YouTube Integration"
        ]
    }

@app.get("/health", tags=["Info"])
def health():
    """Health Check"""
    return {"status": "healthy", "timestamp": str(datetime.now())}

@app.get("/templates", tags=["Templates"])
def get_templates():
    """Get all available templates"""
    templates = {
        "savaş": {
            "name": "Savaş Kategorisi",
            "description": "Samuray vs Şövalye, Gladyatör vs Savaşçı",
            "structure": {
                "intro": {"duration": 30, "type": "cinematic"},
                "character_1": {"duration": 120, "type": "biography"},
                "character_2": {"duration": 120, "type": "biography"},
                "battle": {"duration": 180, "type": "action"},
                "conclusion": {"duration": 30, "type": "epic"}
            },
            "recommended_music": ["Epic Drama", "Battle Theme", "Intense Action"],
            "recommended_effects": ["Zoom", "Slow Motion", "Color Grade"]
        },
        "uyku": {
            "name": "Uyku Ambiyansı",
            "description": "Yağmur, Orman, Okyanus",
            "structure": {
                "intro": {"duration": 30, "type": "calm"},
                "main": {"duration": 540, "type": "ambient"}
            },
            "recommended_music": ["Ambient", "Piano", "Nature Sounds"],
            "recommended_effects": ["Fade", "Soft Focus"]
        },
        "müzik_klip": {
            "name": "Müzik Klibi",
            "description": "Şarkı senkronizasyonu",
            "structure": {
                "intro": {"duration": 15, "type": "teaser"},
                "verse_1": {"duration": 45, "type": "setup"},
                "chorus": {"duration": 30, "type": "peak"},
                "verse_2": {"duration": 45, "type": "development"},
                "outro": {"duration": 30, "type": "finale"}
            }
        },
        "podcast": {
            "name": "Podcast Arka Fonu",
            "description": "Dinamik arka plan + alt yazılar",
            "structure": {
                "intro": {"duration": 20, "type": "branding"},
                "content": {"duration": 600, "type": "dynamic"},
                "outro": {"duration": 15, "type": "closing"}
            }
        },
        "sinematik": {
            "name": "Sinematik Intro/Outro",
            "description": "Film açılışı, Trailer, Finale",
            "structure": {
                "opening": {"duration": 60, "type": "dramatic"},
                "content": {"duration": 300, "type": "storytelling"},
                "credits": {"duration": 30, "type": "elegant"}
            }
        }
    }
    return templates

@app.get("/effects", tags=["Effects"])
def get_effects():
    """Get available effects and transitions"""
    return {
        "effects": {
            "visual": [
                {"id": "zoom", "name": "Zoom In/Out", "category": "motion"},
                {"id": "pan", "name": "Pan Left/Right", "category": "motion"},
                {"id": "fade", "name": "Fade In/Out", "category": "opacity"},
                {"id": "dissolve", "name": "Dissolve", "category": "transition"},
                {"id": "blur", "name": "Blur", "category": "filter"},
                {"id": "glow", "name": "Glow", "category": "light"},
                {"id": "color_grade", "name": "Color Grade", "category": "color"},
                {"id": "slow_motion", "name": "Slow Motion", "category": "time"},
                {"id": "speed_up", "name": "Speed Up", "category": "time"},
                {"id": "sepia", "name": "Sepia", "category": "color"},
                {"id": "vignette", "name": "Vignette", "category": "light"},
                {"id": "glitch", "name": "Glitch", "category": "distortion"}
            ],
            "audio": [
                {"id": "fade_audio", "name": "Audio Fade", "category": "volume"},
                {"id": "crossfade", "name": "Crossfade", "category": "transition"},
                {"id": "normalize", "name": "Normalize", "category": "level"},
                {"id": "reverb", "name": "Reverb", "category": "effect"},
                {"id": "echo", "name": "Echo", "category": "effect"},
                {"id": "eq", "name": "EQ", "category": "tone"}
            ],
            "transitions": [
                {"id": "fade", "name": "Fade", "duration": 500},
                {"id": "dissolve", "name": "Dissolve", "duration": 500},
                {"id": "wipe", "name": "Wipe", "duration": 500},
                {"id": "slide", "name": "Slide", "duration": 500},
                {"id": "zoom_transition", "name": "Zoom Transition", "duration": 500}
            ]
        }
    }

@app.get("/assets/libraries", tags=["Assets"])
def get_asset_libraries():
    """Get available asset libraries (Telif-free)"""
    return {
        "music": [
            {"id": "epidemic", "name": "Epidemic Sound", "type": "premium", "categories": ["all"]},
            {"id": "bensound", "name": "Bensound", "type": "free", "url": "bensound.com"},
            {"id": "pixabay_music", "name": "Pixabay Music", "type": "free", "url": "pixabay.com/music"},
            {"id": "youtube_audio", "name": "YouTube Audio Library", "type": "free"},
            {"id": "incompetech", "name": "Incompetech", "type": "free", "url": "incompetech.com"},
            {"id": "freepd", "name": "FreePD", "type": "free", "url": "freepd.com"}
        ],
        "images": [
            {"id": "unsplash", "name": "Unsplash", "type": "free", "url": "unsplash.com"},
            {"id": "pexels", "name": "Pexels", "type": "free", "url": "pexels.com"},
            {"id": "pixabay", "name": "Pixabay", "type": "free", "url": "pixabay.com"},
            {"id": "wikimedia", "name": "Wikimedia Commons", "type": "free", "url": "commons.wikimedia.org"}
        ],
        "sfx": [
            {"id": "freesound", "name": "Freesound", "type": "free", "url": "freesound.org"},
            {"id": "zapsplat", "name": "Zapsplat", "type": "free", "url": "zapsplat.com"},
            {"id": "bbc_sfx", "name": "BBC Sound Effects", "type": "free"}
        ]
    }

# ============================================================================
# API ENDPOINTS - PROJECT MANAGEMENT
# ============================================================================

@app.post("/projects", response_model=ProjectResponse, tags=["Projects"])
def create_project(project: Project):
    """Create new video project"""
    project_id = str(uuid.uuid4())
    
    conn = sqlite3.connect("atmosfer_pro.db")
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO projects (id, title, category, duration, created_at, updated_at, data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        project_id,
        project.title,
        project.category.value,
        project.duration,
        str(datetime.now()),
        str(datetime.now()),
        json.dumps({
            "fps": project.fps,
            "resolution": project.resolution,
            "template": project.template,
            "layers_count": len(project.layers)
        })
    ))
    
    conn.commit()
    conn.close()
    
    return ProjectResponse(
        project_id=project_id,
        title=project.title,
        category=project.category.value,
        status="created",
        created_at=str(datetime.now()),
        layers_count=len(project.layers)
    )

@app.get("/projects/{project_id}", tags=["Projects"])
def get_project(project_id: str):
    """Get project details"""
    conn = sqlite3.connect("atmosfer_pro.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {
        "project_id": row[0],
        "title": row[1],
        "category": row[2],
        "duration": row[3],
        "created_at": row[5]
    }

@app.get("/projects", tags=["Projects"])
def list_projects():
    """List all projects"""
    conn = sqlite3.connect("atmosfer_pro.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, title, category, duration, created_at FROM projects ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    return {
        "projects": [
            {
                "id": row[0],
                "title": row[1],
                "category": row[2],
                "duration": row[3],
                "created_at": row[4]
            }
            for row in rows
        ],
        "count": len(rows)
    }

@app.put("/projects/{project_id}", tags=["Projects"])
def update_project(project_id: str, project: Project):
    """Update project"""
    conn = sqlite3.connect("atmosfer_pro.db")
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE projects 
        SET title = ?, category = ?, duration = ?, updated_at = ?
        WHERE id = ?
    """, (project.title, project.category.value, project.duration, str(datetime.now()), project_id))
    
    conn.commit()
    conn.close()
    
    return {"status": "updated", "project_id": project_id}

@app.delete("/projects/{project_id}", tags=["Projects"])
def delete_project(project_id: str):
    """Delete project"""
    conn = sqlite3.connect("atmosfer_pro.db")
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM layers WHERE project_id = ?", (project_id,))
    cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    
    conn.commit()
    conn.close()
    
    return {"status": "deleted", "project_id": project_id}

# ============================================================================
# API ENDPOINTS - TIMELINE & LAYERS
# ============================================================================

@app.post("/projects/{project_id}/layers", tags=["Timeline"])
def add_layer(project_id: str, layer: TimelineLayer):
    """Add layer to timeline"""
    conn = sqlite3.connect("atmosfer_pro.db")
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO layers (id, project_id, layer_type, start_time, end_time, asset_id, properties, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        layer.id,
        project_id,
        layer.layer_type.value,
        layer.start_time,
        layer.end_time,
        layer.asset_id,
        json.dumps(layer.properties),
        0
    ))
    
    conn.commit()
    conn.close()
    
    return {"status": "layer_added", "layer_id": layer.id}

@app.get("/projects/{project_id}/layers", tags=["Timeline"])
def get_layers(project_id: str):
    """Get all layers for project"""
    conn = sqlite3.connect("atmosfer_pro.db")
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, layer_type, start_time, end_time, asset_id, properties 
        FROM layers 
        WHERE project_id = ? 
        ORDER BY order_index
    """, (project_id,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return {
        "layers": [
            {
                "id": row[0],
                "type": row[1],
                "start_time": row[2],
                "end_time": row[3],
                "asset_id": row[4],
                "properties": json.loads(row[5]) if row[5] else {}
            }
            for row in rows
        ],
        "count": len(rows)
    }

@app.put("/projects/{project_id}/layers/{layer_id}", tags=["Timeline"])
def update_layer(project_id: str, layer_id: str, layer: TimelineLayer):
    """Update layer properties"""
    conn = sqlite3.connect("atmosfer_pro.db")
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE layers 
        SET start_time = ?, end_time = ?, properties = ?
        WHERE id = ? AND project_id = ?
    """, (
        layer.start_time,
        layer.end_time,
        json.dumps(layer.properties),
        layer_id,
        project_id
    ))
    
    conn.commit()
    conn.close()
    
    return {"status": "layer_updated", "layer_id": layer_id}

@app.delete("/projects/{project_id}/layers/{layer_id}", tags=["Timeline"])
def delete_layer(project_id: str, layer_id: str):
    """Delete layer from timeline"""
    conn = sqlite3.connect("atmosfer_pro.db")
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM layers WHERE id = ? AND project_id = ?", (layer_id, project_id))
    
    conn.commit()
    conn.close()
    
    return {"status": "layer_deleted", "layer_id": layer_id}

# ============================================================================
# API ENDPOINTS - ASSETS
# ============================================================================

@app.post("/assets/upload", tags=["Assets"])
async def upload_asset(file: UploadFile = File(...)):
    """Upload asset (image, audio, video)"""
    asset_id = str(uuid.uuid4())
    filename = f"{asset_id}_{file.filename}"
    filepath = f"uploads/{filename}"
    
    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)
    
    conn = sqlite3.connect("atmosfer_pro.db")
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO assets (id, type, source, filename, url, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        asset_id,
        "uploaded",
        "local",
        filename,
        filepath,
        str(datetime.now())
    ))
    
    conn.commit()
    conn.close()
    
    return {
        "asset_id": asset_id,
        "filename": filename,
        "url": filepath,
        "status": "uploaded"
    }

@app.get("/assets", tags=["Assets"])
def list_assets():
    """List all uploaded assets"""
    conn = sqlite3.connect("atmosfer_pro.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, type, filename, url FROM assets ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    return {
        "assets": [
            {
                "id": row[0],
                "type": row[1],
                "filename": row[2],
                "url": row[3]
            }
            for row in rows
        ],
        "count": len(rows)
    }

# ============================================================================
# API ENDPOINTS - EXPORT & RENDERING
# ============================================================================

@app.post("/projects/{project_id}/export", tags=["Export"])
def export_project(project_id: str, settings: ExportSettings):
    """Export/render video project"""
    
    job_id = str(uuid.uuid4())
    
    # Send to Celery worker
    task = celery_app.send_task("render_video", args=[
        project_id,
        {
            "format": settings.format,
            "quality": settings.quality,
            "preset": settings.preset,
            "bitrate": settings.bitrate,
            "fps": settings.fps,
            "watermark": settings.watermark,
            "youtube_optimize": settings.youtube_optimize
        }
    ])
    
    return {
        "job_id": job_id,
        "status": "rendering",
        "message": f"Video rendering started. Job ID: {job_id}",
        "estimate_time": "5-30 minutes depending on length and quality"
    }

@app.get("/export-presets", tags=["Export"])
def get_export_presets():
    """Get export quality presets"""
    return {
        "presets": {
            "web": {
                "format": "mp4",
                "quality": "medium",
                "bitrate": "2500k",
                "fps": 30,
                "description": "Web/Social Media"
            },
            "youtube": {
                "format": "mp4",
                "quality": "high",
                "bitrate": "5000k",
                "fps": 30,
                "youtube_optimize": True,
                "description": "YouTube Optimized"
            },
            "cinema": {
                "format": "mov",
                "quality": "4k",
                "bitrate": "10000k",
                "fps": 60,
                "description": "Cinema Quality"
            },
            "mobile": {
                "format": "mp4",
                "quality": "low",
                "bitrate": "1000k",
                "fps": 24,
                "description": "Mobile Friendly"
            }
        }
    }

# ============================================================================
# CELERY TASKS
# ============================================================================

@celery_app.task(name="render_video")
def render_video_task(project_id: str, export_settings: dict):
    """Celery task: Render video project"""
    print(f"🎬 Rendering project: {project_id}")
    print(f"📊 Settings: {export_settings}")
    
    try:
        # Here goes FFmpeg rendering logic
        # This is a placeholder for the actual rendering
        
        output_file = f"output/{project_id}_{export_settings['quality']}.{export_settings['format']}"
        
        return {
            "project_id": project_id,
            "status": "completed",
            "output_file": output_file,
            "message": "✅ Video rendering completed"
        }
    except Exception as e:
        return {
            "project_id": project_id,
            "status": "failed",
            "error": str(e),
            "message": "❌ Video rendering failed"
        }

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
