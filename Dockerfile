# ==========================================
# 1. AŞAMA: FRONTEND (REACT) DERLEME
# ==========================================
FROM docker.io/library/node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
# Derleme hızını artırmak ve şişmeyi önlemek için temiz kurulum yapıyoruz
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

# Sistem kütüphanelerini güvenle yükle
RUN apt-get clean && apt-get update && apt-get install -y --no-install-recommends \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libglib2.0-0 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ffmpeg-source /ffmpeg /usr/bin/ffmpeg
COPY --from=ffmpeg-source /ffprobe /usr/bin/ffprobe
RUN chmod +x /usr/bin/ffmpeg && chmod +x /usr/bin/ffprobe

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# CRITICAL HATA ÇÖZÜMÜ: Hem 'dist' hem 'build' ihtimalini garantiye alıyoruz.
# React projen hangisini üretirse üretsin backend klasörüne doğru isimle taşınacak.
RUN if [ -d "/app/frontend/dist" ]; then \
        cp -r /app/frontend/dist ./frontend/dist && cp -r /app/frontend/dist ./frontend/build; \
    else \
        cp -r /app/frontend/build ./frontend/build && cp -r /app/frontend/build ./frontend/dist; \
    fi

RUN chmod -R 777 /app

WORKDIR /app/backend
EXPOSE 3012

CMD ["python", "main.py"]
