# 1. Aşama: Sadece Frontend build işlemi
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --quiet
COPY frontend/ ./
RUN npm run build

# 2. Aşama: Backend ve Hafifletilmiş Çalışma Ortamı
FROM python:3.10-slim

# FFmpeg kurulumunu en hafif ve kararlı hale getiriyoruz
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python gereksinimlerini yükle
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Proje dosyalarını aktar
COPY . .

# Derlenen frontend dosyalarını entegre et
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

WORKDIR /app/backend
EXPOSE 3012

CMD ["python", "main.py"]
