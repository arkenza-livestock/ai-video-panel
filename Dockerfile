# 1. Aşama: Frontend derleme
FROM docker.io/library/node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --quiet
COPY frontend/ ./
RUN npm run build

# 2. Aşama: Resmi statik imajdan FFmpeg alımı
FROM docker.io/mwader/static-ffmpeg:6.1.1 AS ffmpeg-source

# 3. Aşama: Çalışma Ortamı
FROM docker.io/library/python:3.10-slim
WORKDIR /app

# FFmpeg ve FFprobe'u içeri aktar
COPY --from=ffmpeg-source /ffmpeg /usr/bin/ffmpeg
COPY --from=ffmpeg-source /ffprobe /usr/bin/ffprobe

# Çalıştırılabilirlik izinlerini garantiye al
RUN chmod +x /usr/bin/ffmpeg && chmod +x /usr/bin/ffprobe

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# Derlenen frontend dosyalarını entegre et
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Klasör yazma yetki sorunlarını çözmek için izin ver
RUN chmod -R 777 /app

WORKDIR /app/backend
EXPOSE 3012
CMD ["python", "main.py"]
