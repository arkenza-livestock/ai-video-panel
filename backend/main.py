from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from datetime import datetime
import uuid

app = FastAPI(title="Atmosfer Studio API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Clip(BaseModel):
    id: float
    name: str
    type: str
    icon: str
    track: str
    startTime: float
    duration: float
    effects: List[dict] = []
    volume: int = 100

class Timeline(BaseModel):
    clips: List[Clip]
    duration: int
    fps: int
    resolution: str

class ProjectSettings(BaseModel):
    projectName: str
    fps: int
    resolution: str
    bitrate: str
    audioFormat: str
    theme: str

class ExportRequest(BaseModel):
    format: str
    quality: str
    fps: int

# STORAGE
PROJECTS_DIR = "projects"
EXPORTS_DIR = "exports"

if not os.path.exists(PROJECTS_DIR):
    os.makedirs(PROJECTS_DIR)
if not os.path.exists(EXPORTS_DIR):
    os.makedirs(EXPORTS_DIR)

# HEALTH CHECK
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "Atmosfer Studio API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

# PROJECTS
@app.get("/api/projects")
async def get_projects():
    """List all projects"""
    try:
        projects = []
        if os.path.exists(PROJECTS_DIR):
            for file in os.listdir(PROJECTS_DIR):
                if file.endswith('.json'):
                    projects.append({
                        "id": file.replace('.json', ''),
                        "name": file.replace('.json', ''),
                        "created": os.path.getctime(os.path.join(PROJECTS_DIR, file))
                    })
        return {"projects": projects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/projects")
async def create_project(settings: ProjectSettings):
    """Create new project"""
    try:
        project_id = str(uuid.uuid4())
        project_data = {
            "id": project_id,
            "settings": settings.dict(),
            "timeline": [],
            "created": datetime.now().isoformat()
        }
        
        with open(f"{PROJECTS_DIR}/{project_id}.json", 'w') as f:
            json.dump(project_data, f, indent=2)
        
        return {"id": project_id, "message": "Project created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    """Get project by ID"""
    try:
        path = f"{PROJECTS_DIR}/{project_id}.json"
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="Project not found")
        
        with open(path, 'r') as f:
            project = json.load(f)
        return project
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/projects/{project_id}")
async def update_project(project_id: str, data: dict):
    """Update project"""
    try:
        path = f"{PROJECTS_DIR}/{project_id}.json"
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="Project not found")
        
        with open(path, 'r') as f:
            project = json.load(f)
        
        project.update(data)
        project["updated"] = datetime.now().isoformat()
        
        with open(path, 'w') as f:
            json.dump(project, f, indent=2)
        
        return {"message": "Project updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete project"""
    try:
        path = f"{PROJECTS_DIR}/{project_id}.json"
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="Project not found")
        
        os.remove(path)
        return {"message": "Project deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# TIMELINE
@app.post("/api/projects/{project_id}/timeline")
async def save_timeline(project_id: str, timeline: Timeline):
    """Save timeline for project"""
    try:
        path = f"{PROJECTS_DIR}/{project_id}.json"
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="Project not found")
        
        with open(path, 'r') as f:
            project = json.load(f)
        
        project["timeline"] = [clip.dict() for clip in timeline.clips]
        project["settings"]["fps"] = timeline.fps
        project["settings"]["resolution"] = timeline.resolution
        project["updated"] = datetime.now().isoformat()
        
        with open(path, 'w') as f:
            json.dump(project, f, indent=2)
        
        return {"message": "Timeline saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# EXPORT
@app.post("/api/export")
async def export_video(export_request: ExportRequest):
    """Start video export job"""
    try:
        export_id = str(uuid.uuid4())
        
        export_job = {
            "id": export_id,
            "format": export_request.format,
            "quality": export_request.quality,
            "fps": export_request.fps,
            "status": "queued",
            "progress": 0,
            "created": datetime.now().isoformat()
        }
        
        # Save export job (would be sent to worker queue in production)
        with open(f"{EXPORTS_DIR}/{export_id}.json", 'w') as f:
            json.dump(export_job, f, indent=2)
        
        return {
            "export_id": export_id,
            "message": "Export job created",
            "status": "queued"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/export/{export_id}")
async def get_export_status(export_id: str):
    """Get export job status"""
    try:
        path = f"{EXPORTS_DIR}/{export_id}.json"
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="Export job not found")
        
        with open(path, 'r') as f:
            job = json.load(f)
        
        return job
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ASSETS
@app.get("/api/assets")
async def get_assets():
    """Get available assets"""
    assets = [
        {"id": 1, "name": "Video 1", "type": "video", "icon": "🎬", "duration": 30},
        {"id": 2, "name": "Video 2", "type": "video", "icon": "🎬", "duration": 45},
        {"id": 3, "name": "Background", "type": "audio", "icon": "🎵", "duration": 180},
        {"id": 4, "name": "Nature", "type": "audio", "icon": "🎵", "duration": 120},
        {"id": 5, "name": "Ambience", "type": "audio", "icon": "🎵", "duration": 160},
    ]
    return {"assets": assets}

# EFFECTS
@app.get("/api/effects")
async def get_effects():
    """Get available effects"""
    effects = [
        {"id": 1, "name": "Fade In", "icon": "✨"},
        {"id": 2, "name": "Fade Out", "icon": "✨"},
        {"id": 3, "name": "Zoom", "icon": "🔍"},
        {"id": 4, "name": "Blur", "icon": "🌫️"},
        {"id": 5, "name": "Speed Up", "icon": "⚡"},
        {"id": 6, "name": "Color Grade", "icon": "🎨"},
    ]
    return {"effects": effects}

# FILE UPLOAD
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload media file"""
    try:
        file_id = str(uuid.uuid4())
        file_path = f"{PROJECTS_DIR}/{file_id}_{file.filename}"
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        return {
            "id": file_id,
            "filename": file.filename,
            "size": len(content),
            "message": "File uploaded successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ERROR HANDLING
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
