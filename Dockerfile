# 1. Aşama: Frontend derleme
FROM docker.io/library/node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --quiet
COPY frontend/ ./
RUN npm run build

# 2. Aşama: Çalışma Ortamı (Apt-get indirmeleri tamamen kaldırıldı)
FROM docker.io/library/python:3.10-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# Sorun çıkaran dist yerine loglardaki gerçek çıktı olan build'ı bağlıyoruz
COPY --from=frontend-builder /app/frontend/build ./frontend/build

WORKDIR /app/backend
EXPOSE 3012
CMD ["python", "main.py"]
