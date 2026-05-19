# 1. Aşama: Frontend derleme
FROM docker.io/library/node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --quiet
COPY frontend/ ./
RUN npm run build

# 2. Aşama: Çalışma Ortamı
FROM docker.io/library/python:3.10-slim
WORKDIR /app

# ÇÖZÜM: Önceden derlenmiş statik FFmpeg binary dosyasını saniyeler içinde içeri alıyoruz
ADD https://github.com/mwolfe38/static-ffmpeg-binaries/raw/master/ffmpeg-linux-64 /usr/bin/ffmpeg
RUN chmod +x /usr/bin/ffmpeg

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

COPY --from=frontend-builder /app/frontend/build ./frontend/build

WORKDIR /app/backend
EXPOSE 3012
CMD ["python", "main.py"]
