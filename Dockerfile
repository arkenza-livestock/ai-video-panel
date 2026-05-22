# Temel imaj olarak Debian tabanlı Python kullanıyoruz (Hem node hem python çalıştırabilmek için)
FROM docker.io/library/python:3.10-slim-bookworm
WORKDIR /app

# Sistem gereksinimlerini ve Node.js'i doğrudan buraya kuruyoruz
RUN apt-get clean && apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libglib2.0-0 \
    libgl1-mesa-glx \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# FFmpeg kurulumunu doğrudan statik kaynaktan çekiyoruz
FROM docker.io/mwader/static-ffmpeg:6.1.1 AS ffmpeg-source
FROM docker.io/library/python:3.10-slim-bookworm AS final-env
WORKDIR /app

# Gerekli sistem paketlerini kur
RUN apt-get clean && apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libglib2.0-0 \
    libgl1-mesa-glx \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ffmpeg-source /ffmpeg /usr/bin/ffmpeg
COPY --from=ffmpeg-source /ffprobe /usr/bin/ffprobe
RUN chmod +x /usr/bin/ffmpeg && chmod +x /usr/bin/ffprobe

# 1. Projenin tüm dosyalarını içeri alıyoruz
COPY . .

# 2. Python bağımlılıklarını kur
RUN pip install --no-cache-dir -r backend/requirements.txt

# 3. Frontend klasörüne gir, paketleri kur ve doğrudan orada build al
WORKDIR /app/frontend
RUN npm install --quiet
RUN npm run build

# 4. Build çıktısını backend/static klasörüne kopyala (klasör yoksa oluştur)
WORKDIR /app
RUN mkdir -p /app/backend/static
RUN cp -r /app/frontend/dist/* /app/backend/static/ 2>/dev/null || cp -r /app/frontend/build/* /app/backend/static/

# 5. Çalışma dizinini backend'e çek ve ayağa kaldır
WORKDIR /app/backend
EXPOSE 3012

CMD ["python", "main.py"]
