import os
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Atmosfer Studio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Endpointlerin (Orijinal yapın)
@app.get("/api/assets")
async def get_assets():
    return {"videos": [], "audios": []}

@app.post("/api/export")
async def export_video(data: dict):
    return {"status": "success", "downloadUrl": "/static/output.mp4"}


# ====================================================================
# SIFIR HATA GÜVENLİ STATİK DOSYA SERVİS SİSTEMİ
# ====================================================================
current_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(current_dir, "static")

# Eğer klasör yoksa çalışma anında hata vermemesi için oluşturuyoruz
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

# Vite ve React asset yapılandırmalarını dışarıya açıyoruz
if os.path.exists(os.path.join(static_dir, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")
if os.path.exists(os.path.join(static_dir, "static")):
    app.mount("/static", StaticFiles(directory=os.path.join(static_dir, "static")), name="static")

# Gelen tüm ana ve alt sayfa isteklerini yakalayıp ekrana React arayüzünü basan Catch-All rotası
@app.get("/{catchall:path}")
async def serve_react(catchall: str):
    # API çağrısı ise dokunma
    if catchall.startswith("api/"):
        return None
    
    # Eğer tarayıcı index.css, main.js gibi spesifik bir dosya istiyorsa ve o dosya varsa onu gönder
    specific_file = os.path.join(static_dir, catchall)
    if os.path.exists(specific_file) and os.path.isfile(specific_file):
        return FileResponse(specific_file)
        
    # Geri kalan tüm durumlarda ana React sayfasını (index.html) tarayıcıya bas
    index_html_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_html_path):
        return FileResponse(index_html_path)
    
    # Eğer hala dosya kopyalanamamışsa hata logunu JSON olarak değil düz html olarak gösterelim ki tarayıcı anlasın
    return FileResponse(os.path.join(static_dir, "index.html")) if os.path.exists(index_html_path) else {"error": "Frontend derleme dosyaları static klasöründe bulunamadı."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3012, reload=False)
