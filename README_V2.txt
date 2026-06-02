AI VIDEO PANEL v2

GitHub'da değiştirilecek dosyalar:
- public/index.html
- server.js
- package.json
- .env.example
- n8n_webhook_video_uret_v2.json

Eklenenler:
- 15 sn klip seçimi
- Çoklu görsel yükleme
- Otomatik sahne/görsel üretme seçenekleri
- Müzik yükleme veya AI müzik promptu
- Final render, loop, YouTube metadata ayarları

Not: n8n workflow şu an v2 payload'ı düzgün alıp sahne listesine dönüştüren iskelet sürümdür. Sonraki adımda OpenAI/Runway/FFmpeg node'larını bağlayacağız.
