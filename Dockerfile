FROM python:3.10-slim

# FFmpeg ve gerekli video motoru kütüphanelerini kur
RUN apt-get update && apt-get install -y ffmpeg libsm6 libxext6 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Paket listesini backend klasöründen ana dizine kopyala ve kur
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Tüm backend kodlarını konteyner içine aktar
COPY backend/ .

EXPOSE 8089

CMD ["python", "main.py"]
