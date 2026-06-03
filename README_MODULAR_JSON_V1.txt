AI CONTENT STUDIO - MODULAR JSON V1

Bu sürüm önceki tek sayfalı karışık yapıyı bırakır.

Mimari:
public/
  index.html
  css/
    main.css
    studio.css
    modal.css
  js/
    app.js
    core.js
    screens/
      dashboard.js
      projects.js
      studio.js
      characters.js
      voices.js
      music.js
      aiTools.js
      settings.js
  config/
    tabs/main.json
    features/features.json
    features/voice-library.json
    features/studio-schema.json
    providers/providers.json

Prensip:
- Her sekme ayrı JS dosyası.
- Her modül JSON config ile gelir.
- API'ler opsiyonel.
- API yoksa sistem MP4 + MP3 yükleme + FFmpeg render ile çalışır.
- Sesler ana ekranda görünmez; tıklayınca modal açılır.
- Müzik, karakter, ses seçimi modal üzerinden yapılır.
- Timeline ekranı sade kalır.
- Seçili klibin ayarı sağ inspector panelinde görünür.

Çalışan temel özellikler:
- Video ekleme
- Timeline'a klip ekleme
- Klip seçme
- Kes / böl / sil / hızlandır / yavaşlat
- Karakter oluşturma
- Ses seçme modalı
- OpenAI TTS önizleme
- MP3 müzik ekleme
- Proje kaydetme
- FFmpeg render
- API ayarları

Coolify:
Build Pack: Dockerfile
Port: 8080
PUBLIC_BASE_URL boş bırakılabilir.
OPENAI_API_KEY opsiyonel: API Ayarları ekranından da girilebilir.
Redeploy yap.

Not:
Bu ürün mimarisi sonraki geliştirmeler için doğru tabandır. Yeni sağlayıcı eklemek için JSON + servis dosyası eklenir; ana arayüz bozulmaz.
