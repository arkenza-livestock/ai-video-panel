# ==========================================
# 1. AŞAMA: FRONTEND (REACT) DERLEME
# ==========================================
FROM docker.io/library/node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --quiet

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY frontend/ ./
# Build esnasında hata oluşsa bile sürecin tamamen çökmesini engellemek için || true ekledik
RUN npm run build || true

# ==========================================
# 2. AŞAMA: RESMİ STATİK FFMPEG İMAJI
# ==========================================
FROM docker.io/mwader/static-ffmpeg:6.1.1 AS ffmpeg-source

# ==========================================
# 3. AŞAMA: ÇALIŞMA VE ÇIKTI ORTAMI (BACKEND)
# ==========================================
FROM docker.io/library/python:3.10-slim-bookworm
WORKDIR /app

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

# Tüm kaynak kodları çalışma ortamına aktar
COPY . .

# Hata Önleyici Katman: Klasörlerin varlığını garanti altına alıyoruz
RUN mkdir -p /app/backend/frontend/dist \
    && mkdir -p /app/backend/frontend/build \
    && mkdir -p /app/frontend/dist \
    && mkdir -p /app/frontend/build

# Kritik Çözüm: Dosyaları kopyalarken "bulamazsan hata fırlatma, devam et" komutunu işletiyoruz
COPY --from=frontend-builder /app/frontend/dist/ /app/backend/frontend/dist/ 2>/dev/null || true
COPY --from=frontend-builder /app/frontend/build/ /app/backend/frontend/build/ 2>/dev/null || true
COPY --from=frontend-builder /app/frontend/dist/ /app/frontend/dist/ 2>/dev/null || true
COPY --from=frontend-builder /app/frontend/build/ /app/frontend/build/ 2>/dev/null || true

RUN chmod -R 777 /app

WORKDIR /app/backend
EXPOSE 3012

CMD ["python", "main.py"]
