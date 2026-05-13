⚡ HIZLI BAŞLANGÇ - ATMOSFER STÜDYO PRO

═════════════════════════════════════════════════════════════

🚀 DOCKER İLE (2 DAKİKA)

1. Klasöre gir
   cd Atmosfer-Pro-Complete

2. Başlat
   docker-compose up -d

3. Erişim
   • Frontend:  http://localhost:3000
   • Backend:   http://localhost:8000
   • API Docs:  http://localhost:8000/docs

═════════════════════════════════════════════════════════════

📱 ILK VIDEO NASIL YAPILIR?

1. Frontend'i aç: http://localhost:3000

2. "Create New Project" tıkla

3. Proje adı gir: "Samuray vs Şövalye" (örneğin)

4. Kategori seç: ⚔️ Savaş

5. "Create Project" tıkla

6. Editor açılacak:
   • Sol: Assets (Resim, müzik yükle)
   • Orta: Timeline (Katmanları sürükle)
   • Sağ: Effects (Efektler ekle)

7. Assets ekle:
   • "📤 Your Files" tıkla
   • Resim/müzik yükle
   • Timeline'a sürükle

8. Timeline'da düzenle:
   • Katmanları taşı
   • Başlama/bitiş zamanlarını ayarla
   • Efekt ekle

9. Dış aktar:
   • "🎬 Export" tıkla
   • Kalite seç (High = YouTube)
   • "🚀 Export" tıkla

═════════════════════════════════════════════════════════════

🎨 TEMEL EFEKTLER

🔍 Zoom      - Genişlet/Daraalt
⚫ Fade       - Açılış/Kapanış
👁️ Blur      - Bulanıklaştır
🎨 Color     - Renk işleme (Sinematik, vb.)
🐌 Slow-mo   - Yavaşlat (Daha dramatik)
✨ Glow      - Parlak efekt
🔊 Audio     - Ses katmanları (Müzik, SFX)

═════════════════════════════════════════════════════════════

📁 TELIF-FREE KÜTÜPHANELER

Sağ klikda "🌐 Free Libraries":

📸 Unsplash   - Harika resimler
🎵 Pixabay    - Royalty-free müzik
🔊 Freesound  - Ses efektleri
🎼 Bensound   - Background müzik

═════════════════════════════════════════════════════════════

⚙️ AYARLAR

Backend (.env):
- DEBUG=true
- VIDEO_PRESET=medium  (fast/medium/slow)
- VIDEO_BITRATE=5000k  (Youtube için)

Frontend (.env):
- REACT_APP_API_URL=http://localhost:8000

═════════════════════════════════════════════════════════════

🛑 DURDUR VE YENİDEN BAŞLAT

# Durdur (veriler saklanır)
docker-compose down

# Tamamen temizle
docker-compose down -v

# Yeniden başlat
docker-compose up -d

═════════════════════════════════════════════════════════════

📊 LOGLAR

# Tüm loglar
docker-compose logs -f

# Sadece backend
docker-compose logs -f backend

# Sadece worker
docker-compose logs -f worker

# Sadece frontend
docker-compose logs -f frontend

═════════════════════════════════════════════════════════════

💾 DOSYALAR NEREDE KAYDEDILIR?

• Video çıkışları:  output/
• Yüklenen dosyalar: uploads/
• Geçici dosyalar:  temp/
• Loglar:           logs/

═════════════════════════════════════════════════════════════

🎬 SAMURAY VS ŞÖVALİE ÖRNEĞİ

Kategori: ⚔️ Savaş

Yapı:
├─ Intro (0-30s)        Title "SAMURAY vs ŞÖVALİE"
├─ Samuray (30-120s)    3 resim + müzik
├─ Şövalye (120-240s)   3 resim + müzik
├─ Savaş (240-360s)     Video veya resimler
└─ Sonuç (360-390s)     "Kimin Kazanacağını Bulmak İçin İzle"

Efektler:
• Zoom In (Samuray resimleri için)
• Slow Motion (Savaş sahnesi)
• Color Grade (Sinematik)
• Fade (Geçişler)

Müzik:
• Intro: Epic Drama
• Samuray: Japanese Theme
• Savaş: Battle Intensity
• Sonuç: Tragic/Victory

═════════════════════════════════════════════════════════════

🔗 FAYDARLI LINKLER

• API Dokümanı: http://localhost:8000/docs
• Swagger UI:   http://localhost:8000/redoc
• Unsplash:     https://unsplash.com
• Pixabay:      https://pixabay.com

═════════════════════════════════════════════════════════════

❓ SORUN MU?

Port Kullanımda?
→ docker-compose down && docker-compose up -d

Redis Hatası?
→ redis-cli ping  (PONG dönmeli)

FFmpeg Yok?
→ brew install ffmpeg (Mac)
→ choco install ffmpeg (Windows)
→ sudo apt install ffmpeg (Linux)

═════════════════════════════════════════════════════════════

📈 PERFORMANCE TİPLERİ

• 1 dakika video = 2-5 dakika render
• 5 dakika video = 10-20 dakika render
• 10 dakika video = 20-40 dakika render

(Quality: High, Resolution: 1080p ile)

Hızlandırmak için: Quality'yi Medium yapın

═════════════════════════════════════════════════════════════

🎯 İLK ADIM

1. docker-compose up -d
2. http://localhost:3000 aç
3. Proje oluştur
4. Resim yükle
5. Timeline'a sürükle
6. Export et

30 dakika içinde ilk videonu tamamlayabilirsin!

═════════════════════════════════════════════════════════════

Daha detaylı bilgi için README.md oku!

Good luck! 🚀✨
