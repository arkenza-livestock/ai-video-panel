# ==========================================
# 1. AŞAMA: FRONTEND (REACT) DERLEME
# ==========================================
FROM docker.io/library/node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --quiet

# Ortam değişkenleri
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

# Video ve render kütüphaneleri
RUN apt-get clean && apt-get update && apt-get install -y --no-install-recommends \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libglib2.0-0 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# FFmpeg kopyalama
COPY --from=ffmpeg-source /ffmpeg /usr/bin/ffmpeg
COPY --from=ffmpeg-source /ffprobe /usr/bin/ffprobe
RUN chmod +x /usr/bin/ffmpeg && chmod +x /usr/bin/ffprobe

# Python gereksinimleri
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Önce tüm projeyi kopyala
COPY . .

# HATA ÖNLEYİCİ GÜVENLİK DUVARI: 
# Backend'in çalışırken arayabileceği tüm olası klasörleri zorla açıyoruz
RUN mkdir -p /app/backend/frontend/dist \
    && mkdir -p /app/backend/frontend/build \
    && mkdir -p /app/frontend/dist \
    && mkdir -p /app/frontend/build

# İlk aşamada derlenen dosyaları, hata verme ihtimalini sıfırlayarak kopyalıyoruz
COPY --from=frontend-builder /app/frontend/dist/* /app/backend/frontend/dist/ 2>/dev/null || true
COPY --from=frontend-builder /app/frontend/build/* /app/backend/frontend/build/ 2>/dev/null || true
COPY --from=frontend-builder /app/frontend/dist/* /app/frontend/dist/ 2>/dev/null || true
COPY --from=frontend-builder /app/frontend/build/* /app/frontend/build/ 2>/dev/null || true

RUN chmod -R 777 /app

WORKDIR /app/backend
EXPOSE 3012

CMD ["python", "main.py"]
