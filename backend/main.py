from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, dict

app = FastAPI()

# CORS Ayarları: Frontend'in backend'e erişebilmesi için açık bırakıldı
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- FRONTEND'DEN GELEN EXPORT VERİLERİ İÇİN MODELLER ---
class ExportRequest(BaseModel):
    projectId: Optional[str] = None
    assets: Optional[List[dict]] = None
    fps: Optional[int] = 30

# --- AKTİF WEBSOCKET BAĞLANTILARI İÇİN YÖNETİCİ ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# --- ENDPOINT'LER ---

# Ana Sayfa (Root) Endpoint
@app.get("/")
def read_root():
    return {"Hello": "World"}

# Örnek Item Endpoint'i
@app.get("/items/{item_id}")
def read_item(item_id: int, q: Optional[str] = None):
    return {"item_id": item_id, "q": q}

# Eksik Olan Video Export (Dışa Aktarma) Servisi
@app.post("/export")
async def export_video(payload: ExportRequest):
    try:
        # Frontend'den istek geldiğinde terminale yazdırır
        print(f"Video oluşturma talebi alındı. Proje ID: {payload.projectId}")
        
        # Buraya ileride gerçek video işleme/render kodları eklenecek
        
        return {
            "status": "success",
            "message": "Video oluşturma işlemi backend üzerinde başarıyla başlatıldı."
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# WebSocket Bağlantı Noktası
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_personal_message(f"You wrote: {data}", websocket)
            await manager.broadcast(f"Client says: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast("A client disconnected")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
