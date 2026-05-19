# 1. Aşama: Sadece Frontend build işlemi
FROM docker.io/library/node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# package-lock.json olmasa bile hata vermemesi için package*.json olarak kopyalıyoruz
COPY frontend/package*.json ./

# Hızlı ve hafif kurulum için düz npm install kullanıyoruz
RUN npm install --quiet

COPY frontend/ ./
RUN npm run build

# 2. Aşama: Backend ve Hafifletilmiş Çalışma Ortamı
FROM docker.io/library/python:3.10-slim

# FFmpeg ve sistem kütüphanelerini en hafif modda kuruyoruz (Kilitlenmeyi önler)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python bağımlılıklarını yükle
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Tüm proje dosyalarını aktar
COPY . .

# Derlenen frontend çıktılarını entegre et
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

WORKDIR /app/backend
# Sistemi tamamen 3012 portuna sabitliyoruz
EXPOSE 3012

CMD ["python", "main.py"]
