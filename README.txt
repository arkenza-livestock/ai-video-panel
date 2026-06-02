KURULUM - VPS PUBLIC UPLOAD SÜRÜMÜ

Bu paket Cloudinary/S3 gerektirmez.
Panel, dosyaları kendi VPS'inde /uploads klasörüne koyar ve public URL oluşturur.

1) Paketi VPS'e yükle:
   unzip video_uretici_panel_vps_public_upload.zip
   cd video_uretici_panel_vps_public_upload

2) Node.js kurulu değilse:
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs

3) Bağımlılıkları kur:
   npm install

4) .env dosyasını düzenle:
   cp .env.example .env
   nano .env

Örnek:
   PORT=8080
   PUBLIC_BASE_URL=http://72.62.186.96:8080
   N8N_WEBHOOK_URL=http://72.62.186.96:5678/webhook/video-uret

5) Paneli çalıştır:
   npm start

6) Tarayıcıdan aç:
   http://72.62.186.96:8080

7) n8n içine n8n_webhook_video_uret_vps_upload.json dosyasını import et.
   Workflow'u Active yap.

8) n8n environment içine şunu ekle:
   RUNWAYML_API_SECRET

ÖNEMLİ:
Bu paket, görsel yükleme ve public URL sorununu çözer.
n8n workflow ilk klip üretimini döndürmeye ayarlı güvenli iskelet sürümdür.
10 dakikalık çoklu klip + final render için Shotstack/FFmpeg toplama adımı canlı n8n testinden sonra bağlanmalı.
