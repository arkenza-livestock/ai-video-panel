# 1. Aşama: Sadece Frontend build işlemi
FROM docker.io/library/node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --quiet

COPY frontend/ ./
RUN npm run build

# 2. Aşama: Backend ve Çalışma Ortamı
FROM docker.io/library/python:3.10-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# HATA ÇÖZÜMÜ: dist yerine projenin gerçek çıktısı olan build klasörünü kopyalıyoruz
COPY --from=frontend-builder /app/frontend/build ./frontend/build

WORKDIR /app/backend
EXPOSE 3012

CMD ["python", "main.py"]
