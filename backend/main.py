# ==========================================
# 1. AŞAMA: FRONTEND BUILD
# ==========================================
FROM docker.io/library/node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --quiet

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY frontend/ ./
# Build alırken hatasız bittiğinden emin oluyoruz
RUN npm run build

# ==========================================
# 2. AŞAMA: FFmpeg KAYNAĞI
# ==========================================
FROM docker.io/mwader/static-ffmpeg:6.1.1 AS ffmpeg-source

# ==========================================
# 3. AŞAMA: BACKEND & ÇALIŞTIRMA ORTAMI
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

# Tüm kaynak kodları içeri al
COPY . .

# Backend klasörünün içinde temiz bir static klasörü oluştur
RUN rm -rf /app/backend/static && mkdir -p /app/backend/static

# React build klasörünün içeriğini doğrudan backend/static altına kopyala
# (Hata varsa Docker build aşamasında patlasın ki nerede durduğumuzu görelim)
COPY --from=frontend-builder /app/frontend/build/ /app/backend/static/

RUN chmod -R 777 /app

WORKDIR /app/backend
EXPOSE 3012

CMD ["python", "main.py"]
