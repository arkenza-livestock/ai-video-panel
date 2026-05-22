# Multi-stage build - Önce frontend'i build et
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Frontend dependencies - npm ci yerine npm install kullan
COPY frontend/package*.json ./
RUN npm install --quiet

# Frontend source
COPY frontend/ ./
RUN npm run build

# Final image
FROM python:3.10-slim-bookworm

WORKDIR /app

# Sistem gereksinimleri
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libglib2.0-0 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# FFmpeg kurulumu
COPY --from=mwader/static-ffmpeg:6.1.1 /ffmpeg /usr/bin/ffmpeg
COPY --from=mwader/static-ffmpeg:6.1.1 /ffprobe /usr/bin/ffprobe
RUN chmod +x /usr/bin/ffmpeg /usr/bin/ffprobe

# Backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Backend source
COPY backend/ ./backend/

# Build edilmiş frontend'i kopyala (dist veya build klasörünü kontrol et)
COPY --from=frontend-builder /app/frontend/dist ./backend/static/
# Alternatif olarak build klasörünü dene
# COPY --from=frontend-builder /app/frontend/build ./backend/static/

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=3012

EXPOSE 3012

WORKDIR /app/backend

CMD ["python", "main.py"]
