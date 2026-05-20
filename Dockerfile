# ==========================================
# 1. AŞAMA: FRONTEND (REACT) DERLEME
# ==========================================
FROM docker.io/library/node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Bağımlılıkları kopyala
COPY frontend/package*.json ./

# Axios paketini el ile zorunlu yüklüyoruz
RUN npm install --quiet && npm install axios --quiet

# Tüm kaynak kodları kopyala ve derle
COPY frontend/ ./
RUN npm run build

# ==========================================
# 2. AŞAMA: RESMİ STATİK FFMPEG İMAJI
# ==========================================
FROM docker.io/mwader/static-ffmpeg:6.1.1 AS ffmpeg-source

# ==========================================
# 3. AŞAMA: ÇALIŞMA VE ÇIKTI ORTAMI (BACKEND)
# ==========================================
# HATA ÇÖZÜMÜ: Depo hatalarını engellemek için kararlı Debian Bookworm tabanına geçtik
FROM docker.io/library/python:3.10-slim-bookworm
WORKDIR /app

# Paket depolarını temizle, güncelle ve video işleme kütüphanelerini tek satırda güvenle kur
RUN apt-get clean && apt-get update && apt-get install -y --no-install-recommends \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libglib2.0-0 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# FFmpeg ve FFprobe'u güvenli imajdan çek ve çalıştırılabilir yap
COPY --from=ffmpeg-source /ffmpeg /usr/bin/ffmpeg
COPY --from=ffmpeg-source /ffprobe /usr/bin/ffprobe
RUN chmod +x /usr/bin/ffmpeg && chmod +x /usr/bin/ffprobe

# Python gereksinimlerini yükle
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Tüm backend projesini kopyala
COPY . .

# React'in ürettiği 'build' klasörünü backend'in erişebileceği yere kopyala
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Video kayıt ve render işlemleri için yazma izinlerini ayarla
RUN chmod -R 777 /app

WORKDIR /app/backend
EXPOSE 3012

CMD ["python", "main.py"]
