FROM python:3.10-slim

# FFmpeg ve gerekli video kütüphanelerini kur
RUN apt-get update && apt-get install -y ffmpeg libsm6 libxext6 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Paketleri bağımlılıkları kırmadan doğrudan backend klasöründen çek
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Projenin tüm klasör yapısını (backend ve frontend) koruyarak içeri al
COPY . .

EXPOSE 8089

# Çalışma dizinini backend yap ki main.py tüm iç bağımlılıklarını bulabilsin
WORKDIR /app/backend

CMD ["python", "main.py"]
