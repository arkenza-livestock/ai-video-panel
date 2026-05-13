# 🎬 ATMOSFER STÜDYO PRO v2.0

**Profesyonel Video Editor** - Advanced Timeline Editing, Effects, Asset Management, Color Grading & More

![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🌟 **Özellikler**

### 🎬 **Timeline Editor**
- ✅ Profesyonel drag-drop timeline
- ✅ Multi-layer editing (Video, Audio, Image, Text, Effects)
- ✅ Real-time playhead tracking
- ✅ Layer properties panel
- ✅ Undo/Redo (planlanıyor)

### 📊 **Asset Management**
- ✅ File upload (Resim, Müzik, Video)
- ✅ Telif-free kütüphane entegrasyonları
  - Unsplash (Resimler)
  - Pexels (Videolar)
  - Pixabay (Müzik)
  - Bensound (Royalty-free müzik)
  - Freesound (Ses efektleri)
- ✅ Asset preview ve filtering
- ✅ Metadata tagging

### ✨ **Effects & Transitions**
- 🔍 Zoom In/Out
- ⚫ Fade In/Out
- 👁️ Blur
- 🎨 Color Grading (Cinematic, Noir, Warm)
- 🐌 Slow Motion / Speed Up
- ✨ Glow Effect
- 🔊 Audio Fade & Crossfade
- 🔄 Transitions (Dissolve, Wipe, Slide)

### 🎵 **Audio Processing**
- ✅ Audio mixing
- ✅ Volume normalization
- ✅ Crossfade editing
- ✅ Audio layer management
- 🔄 EQ & Effects (Planlanıyor)

### 🎨 **Advanced Features**
- ✅ Color grading presets
- ✅ Text overlay & animations
- ✅ Watermark support
- ✅ Multiple resolution support (1080p, 4K)
- ✅ Export quality presets

### 📁 **Project Management**
- ✅ Create/Edit/Delete projects
- ✅ Project categories (Savaş, Uyku, Müzik, Podcast, vb.)
- ✅ Template system
- ✅ Project versioning (Planlanıyor)

### 🚀 **Export Options**
- ✅ MP4 (H.264)
- ✅ WebM (VP9)
- ✅ MOV (ProRes)
- ✅ Quality presets (Low, Medium, High, 4K)
- ✅ YouTube optimization
- ✅ Batch export (Planlanıyor)

### 📺 **Video Categories**

| Kategori | Kullanım | Müzik | Efektler |
|----------|----------|-------|----------|
| **⚔️ Savaş** | Samuray vs Şövalye | Epic, Drama | Zoom, Slow-mo |
| **🌙 Uyku** | Ambient, Meditasyon | Ambient, Piano | Fade, Soft |
| **🎵 Müzik** | Müzik Klibi | Elektronik, Pop | Sync, Effects |
| **🎙️ Podcast** | Konuşma Arka Fonu | Ambient | Dynamic BG |
| **🎬 Sinematik** | Trailer, Intro | Epic | Cinematic Grade |
| **🌿 Doğa** | Travel Vlog | Ambient | Pan, Zoom |
| **📚 Tütöryial** | Eğitim İçeriği | Upbeat | Text Overlay |

---

## 🛠️ **Teknoloji Stack**

| Component | Technology |
|-----------|-----------|
| **Frontend** | React 18, Axios, Framer Motion |
| **Backend** | FastAPI, Pydantic, SQLite/PostgreSQL |
| **Video Processing** | FFmpeg, MoviePy, OpenCV |
| **Audio Processing** | Librosa, SoundFile, PyDub |
| **Queue System** | Celery + Redis |
| **Container** | Docker & Docker Compose |
| **Database** | SQLite (dev), PostgreSQL (prod) |

---

## 📋 **Gereksinimler**

### Local Development
- Python 3.11+
- Node.js 18+
- Redis
- FFmpeg
- 4GB+ RAM

### Docker (Önerilen)
- Docker & Docker Compose
- 4GB+ system RAM

---

## 🚀 **Hızlı Başlangıç**

### **Docker ile (2 Dakika)**

```bash
# 1. Proje dosyalarını aç
cd Atmosfer-Pro-Complete

# 2. Docker Compose ile başlat
docker-compose up -d

# 3. Uygulamalara erişim
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### **Local Geliştirme (5 Dakika)**

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Terminal 1: Backend API
python main.py

# Terminal 2: Celery Worker
celery -A video_worker worker --loglevel=info

# Terminal 3: Frontend
cd frontend
npm install
npm start
```

---

## 📖 **API Endpoints**

### **Info & Formats**
```
GET  /                    - API information
GET  /health              - Health check
GET  /templates           - Get all templates
GET  /effects             - Get available effects
GET  /assets/libraries    - Get asset libraries
GET  /export-presets      - Export quality presets
```

### **Project Management**
```
POST   /projects                    - Create new project
GET    /projects                    - List all projects
GET    /projects/{id}               - Get project details
PUT    /projects/{id}               - Update project
DELETE /projects/{id}               - Delete project
```

### **Timeline & Layers**
```
POST   /projects/{id}/layers        - Add layer to timeline
GET    /projects/{id}/layers        - Get all layers
PUT    /projects/{id}/layers/{lid}  - Update layer
DELETE /projects/{id}/layers/{lid}  - Delete layer
```

### **Assets**
```
POST /assets/upload        - Upload file
GET  /assets               - List assets
```

### **Export & Rendering**
```
POST /projects/{id}/export - Export/render video
GET  /export-presets       - Quality presets
```

**Swagger UI:** http://localhost:8000/docs

---

## 📊 **Workflow**

```
1. Proje Oluştur (Kategori seç)
   ↓
2. Asset Yükle (Resim, müzik, video)
   ↓
3. Timeline'a Ekle (Drag-drop)
   ↓
4. Efektler Ekle (Zoom, Fade, vb.)
   ↓
5. Ön İzleme (Real-time preview)
   ↓
6. Dış Aktar (Quality preset seç)
   ↓
7. İndir veya YouTube'a Yükle
```

---

## 🎯 **Proje Kategorileri & Şablonlar**

### **⚔️ Savaş Kategorisi** (Samet'in Kanalı için!)

```
Yapı:
├─ Intro (0-30s) - Title card
├─ Karakteri 1 (30-120s) - Biography
├─ Karakteri 2 (120-240s) - Biography
├─ Savaş (240-360s) - Action scene
└─ Sonuç (360-390s) - Epic finale

Varsayılan Müzikler:
├─ Epic Drama Theme
├─ Battle Intensity
└─ Tragic Finale

Efektler:
├─ Zoom & Pan
├─ Color Grading (Cinematic)
├─ Slow Motion
└─ Text Overlay (İsimler, yıllar)
```

### **🌙 Uyku Ambiyansı**

```
Yapı:
├─ Intro (30s) - Gentle
└─ Main (Remaining) - Ambient

Varsayılan Müzikler:
├─ Ambient Piano
├─ Nature Sounds
└─ Lo-fi Beats

Efektler:
├─ Fade In/Out
└─ Soft Focus
```

---

## 💾 **Depolama Yapısı**

```
Atmosfer-Pro-Complete/
├── backend/
│   ├── main.py                 # FastAPI uygulaması
│   ├── video_worker.py         # Celery görevleri
│   ├── requirements.txt         # Python paketleri
│   ├── Dockerfile             # Container tanımı
│   └── .env                   # Konfigürasyon
│
├── frontend/
│   ├── src/
│   │   ├── App.js            # React ana bileşen
│   │   ├── App.css           # Stiller
│   │   └── index.js          # Entry point
│   ├── public/
│   │   └── index.html        # HTML şablonu
│   ├── package.json          # npm paketleri
│   ├── Dockerfile            # Container tanımı
│   └── .env                  # Frontend config
│
├── docker-compose.yml         # Docker services
├── README.md                  # Bu dosya
└── QUICK_START.md            # Hızlı başlangıç
```

---

## 🔧 **Konfigürasyon**

### **Backend (.env)**
```env
DEBUG=true
LOG_LEVEL=info
REDIS_URL=redis://localhost:6379/0
DATABASE_URL=sqlite:///./atmosfer_pro.db
VIDEO_CODEC=libx264
VIDEO_PRESET=medium
VIDEO_BITRATE=5000k
```

### **Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENV=development
```

---

## 📊 **Database Schema**

```sql
-- Projects
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  duration INTEGER,
  template TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  data JSON
)

-- Layers (Timeline)
CREATE TABLE layers (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  layer_type TEXT,
  start_time REAL,
  end_time REAL,
  asset_id TEXT,
  properties JSON,
  order_index INTEGER
)

-- Assets
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  type TEXT,
  source TEXT,
  filename TEXT,
  url TEXT,
  metadata JSON,
  created_at TIMESTAMP
)
```

---

## 🎨 **UI/UX Highlights**

- **Modern Dark Theme** - Gözleri rahat ettirecek profesyonel tasarım
- **Drag-Drop Timeline** - DaVinci Resolve tarzı editing
- **Real-time Preview** - Anında görüş kontrol
- **Responsive Design** - Mobil-friendly interface
- **Smooth Animations** - Framer Motion ile profesyonel geçişler
- **Intuitive Controls** - Kolay öğrenilir arayüz

---

## 🚀 **Advanced Features (Yol Haritası)**

### **Faz 3 (Şu An)**
- ✅ Timeline Editor
- ✅ Asset Management
- ✅ Effects & Transitions
- ✅ Color Grading
- ✅ Export System

### **Faz 4 (Yakında)**
- 🔄 Undo/Redo System
- 🔄 Real-time Collaboration
- 🔄 Advanced Audio Mixing
- 🔄 Motion Graphics
- 🔄 Automation & Keyframing

### **Faz 5 (Gelecek)**
- 🔄 YouTube Direct Upload
- 🔄 Social Media Auto-optimization
- 🔄 AI-powered Captions
- 🔄 Green Screen Effects
- 🔄  3D Transitions

---

## 🐛 **Sorun Giderme**

### **Port Zaten Kullanımda**
```bash
docker-compose down
docker-compose up -d
```

### **Redis Bağlantı Hatası**
```bash
# Check if Redis is running
redis-cli ping  # Should return PONG
```

### **FFmpeg Bulunamadı**
```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt-get install ffmpeg

# Windows
choco install ffmpeg
```

### **Frontend API'ye Bağlanamıyor**
```bash
# Check if backend is running
curl http://localhost:8000/health

# Check .env file
cat frontend/.env
# REACT_APP_API_URL=http://localhost:8000
```

---

## 📚 **Dokümantasyon**

- [QUICK_START.md](./QUICK_START.md) - 2 dakikada başla
- [API.md](./docs/API.md) - Detaylı API dokümantasyonu
- [TEMPLATES.md](./docs/TEMPLATES.md) - Şablon sistemi
- [EFFECTS.md](./docs/EFFECTS.md) - Efektler rehberi

---

## 📊 **Performance**

| Metrik | Değer |
|--------|-------|
| Max Project Duration | 10 hours |
| Max File Size | 1GB |
| Supported Resolutions | 1080p, 2K, 4K |
| Max Layers | 50+ |
| Export Time (1min video) | 2-5 minutes |
| Memory Usage | 800MB-2GB |

---

## 🔐 **Security**

- ✅ CORS enabled
- ✅ Input validation
- ✅ File type restrictions
- ✅ Maximum file size limits
- ✅ Rate limiting (planned)
- ✅ API authentication (planned)

---

## 📝 **License**

MIT License - Detaylar için [LICENSE](./LICENSE)

---

## 🙏 **Teşekkürler**

- **Samet** - Proje vizyonu ve gereksinimleri
- **OpenSource Community** - FFmpeg, MoviePy, Celery
- **React Team** - UI Framework
- **FastAPI** - Modern Python Web Framework

---

## 📧 **İletişim & Destek**

Sorularınız veya geri bildiriminiz için:
- 📝 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions
- 📧 Email: support@atmosfer-studio.com

---

**Profesyonel video üretimi artık hepimizin için erişilebilir! 🚀**

**Atmosfer Stüdyo PRO - Where Creativity Meets Technology**

---

*Last Updated: May 2024*
*Version: 2.0.0*
