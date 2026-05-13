#!/bin/bash

echo "🎬 Atmosfer Stüdyo PRO - Başlatılıyor..."
echo ""

if ! command -v docker &> /dev/null; then
    echo "❌ Docker yüklü değil"
    exit 1
fi

echo "Seçin:"
echo "1) Başlat"
echo "2) Durdur"
echo "3) Loglar"
echo "4) Temizle ve yeniden başlat"
echo ""
read -p "Seçim (1-4): " choice

case $choice in
    1)
        echo "🚀 Başlatılıyor..."
        docker-compose up -d
        sleep 3
        echo "✅ Başlandı!"
        echo ""
        echo "Frontend: http://localhost:3000"
        echo "Backend:  http://localhost:8000"
        echo "API:      http://localhost:8000/docs"
        ;;
    2)
        echo "⛔ Durduruluyor..."
        docker-compose down
        echo "✅ Durduruldu"
        ;;
    3)
        echo "📋 Loglar (CTRL+C ile çıkın)..."
        docker-compose logs -f
        ;;
    4)
        echo "🧹 Temizleniyor..."
        docker-compose down -v
        sleep 2
        echo "🚀 Yeniden başlatılıyor..."
        docker-compose up -d
        sleep 3
        echo "✅ Tamamen yenilendi!"
        echo ""
        echo "Frontend: http://localhost:3000"
        echo "Backend:  http://localhost:8000"
        ;;
    *)
        echo "❌ Geçersiz seçim"
        exit 1
        ;;
esac

echo ""
echo "✨ Tamamlandı!"
