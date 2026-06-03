AI VIDEO STUDIO FULL - Coolify paketi

Özellikler:
- n8n yok.
- SQLite database var.
- Coolify üzerinde Node.js + FFmpeg ile çalışır.
- Timeline görünümü.
- Klip sıralama.
- Klip trim/kesme alanları.
- Sahne başına konuşma ve altyazı alanları.
- Genel konuşma metni.
- Karakter ses kütüphanesi.
- Karakter başına OpenAI hazır ses veya kendi ses dosyası.
- OpenAI TTS.
- Müzik yükleme.
- FFmpeg ile final MP4 render.
- Lip sync sağlayıcı seçimi arayüzde var; gerçek API entegrasyonu sonraki aşamada bağlanır.

GitHub'a yüklenecek dosyalar:
- public/index.html
- server.js
- package.json
- Dockerfile
- .env.example

Coolify ayarı:
- Build Pack: Dockerfile
- Port: 8080
- Environment Variables:
  PORT=8080
  PUBLIC_BASE_URL=https://senin-panel-domainin
  OPENAI_API_KEY=sk-proj-...
  OPENAI_TTS_MODEL=gpt-4o-mini-tts

Önemli:
Kendi ses dosyası yükleme desteklenir ama yeni cümleleri o sesle okutma için voice-cloning API gerekir.
Lip sync entegrasyonu arayüz seviyesinde hazırdır; provider API bağlanınca aktif edilir.
