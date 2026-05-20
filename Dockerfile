# ==========================================
# 1. AŞAMA: FRONTEND (REACT) DERLEME
# ==========================================
FROM docker.io/library/node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --quiet || npm install --quiet

# Coolify ortam değişkenlerini derleme anına aktarır
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY frontend/ ./
RUN npm run build

# ==========================================
# 2. AŞAMA: RESMİ STATİK FFMPEG İMAJI
# ==========================================
FROM docker.io/mwader/static-ffmpeg:6.1.1 AS ffmpeg-source

# ==========================================
# 3. AŞAMA: ÇALIŞMA VE ÇIKTI ORTAMI (BACKEND)
# ==========================================
FROM docker.io/library/python:3.10-slim-bookworm
WORKDIR /app

# Sistem kütüphanelerini yükle
RUN apt-get clean && apt-get update && apt-get install -y --no-install-recommends \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libglib2.0-0 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# FFmpeg araçlarını kopyala
COPY --from=ffmpeg-source /ffmpeg /usr/bin/ffmpeg
COPY --from=ffmpeg-source /ffprobe /usr/bin/ffprobe
RUN chmod +x /usr/bin/ffmpeg && chmod +x /usr/bin/ffprobe

# Backend gereksinimlerini kur
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Tüm proje kaynak kodlarını kopyala
COPY . .

# CRITICAL FIX: Derlenen frontend dosyalarını ilk aşamadan güvenli bir geçici klasöre çekiyoruz
COPY --from=frontend-builder /app/frontend /app/frontend_compiled

# Hem dist hem build ihtimallerini kontrol edip backend'in aradığı yere klonluyoruz
RUN mkdir -p frontend/dist frontend/build && \
    if [ -d "/app/frontend_compiled/dist" ]; then \
        cp -r /app/frontend_compiled/dist/* ./frontend/dist/ && \
        cp -r /app/frontend_compiled/dist/* ./frontend/build/; \
    elif [ -d "/app/frontend_compiled/build" ]; then \
        cp -r /app/frontend_compiled/build/* ./frontend/build/ && \
        cp -r /app/frontend_compiled/build/* ./frontend/dist/; \
    fi && \
    rm -rf /app/frontend_compiled

RUN chmod -R 777 /app

WORKDIR /app/backend
EXPOSE 3012

CMD ["python", "main.py"]
