FROM python:3.11-slim

WORKDIR /app

# Sistem bağımlılıkları
RUN apt-get update && apt-get install -y \
    ffmpeg \
    imagemagick \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python paketleri
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama kodları
COPY . .

# Port
EXPOSE 8000

# Redis bekleme script'i
COPY wait-for-redis.sh /
RUN chmod +x /wait-for-redis.sh

# Başlatma
CMD ["/wait-for-redis.sh", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
