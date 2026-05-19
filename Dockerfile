# 1. Aşama: Frontend (React) projesini derle
FROM node:18-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 2. Aşama: Python (FastAPI) ortamını kur ve birleştir
FROM python:3.10-slim

# Sistem paketlerini ve FFmpeg motorunu kur
RUN apt-get update && apt-get install -y ffmpeg libsm6 libxext6 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend bağımlılıklarını yükle
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Tüm proje dosyalarını içeri aktar
COPY . .

# İlk aşamada derlenen React çıktılarını Python'ın erişebileceği yere taşı
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Çalışma alanını backend yap ve 3012 portunu dışa aç
WORKDIR /app/backend
EXPOSE 3012

# Uygulamayı başlat
CMD ["python", "main.py"]
