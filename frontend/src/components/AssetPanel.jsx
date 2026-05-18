import React, { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import '../styles/AssetPanel.css';

function AssetPanel() {
  // exportVideo fonksiyonu context'ten çekildi
  const { currentTime, addClip, exportVideo } = useEditor();
  const [searchQuery, setSearchQuery] = useState('');

  const allAssets = [
    { id: 1, name: 'Video 1', type: 'video', icon: '🎬', duration: 30 },
    { id: 2, name: 'Video 2', type: 'video', icon: '🎬', duration: 45 },
    { id: 3, name: 'Background', type: 'audio', icon: '🎵', duration: 180 },
    { id: 4, name: 'Nature', type: 'audio', icon: '🎵', duration: 120 },
    { id: 5, name: 'Ambience', type: 'audio', icon: '🎵', duration: 160 },
    { id: 6, name: 'Rain', type: 'audio', icon: '🎵', duration: 150 },
    { id: 7, name: 'Piano', type: 'audio', icon: '🎵', duration: 200 },
  ];

  const colors = [
    { name: 'Red', hex: '#FF6B6B' },
    { name: 'Teal', hex: '#4ECDC4' },
    { name: 'Blue', hex: '#45B7D1' },
    { name: 'Orange', hex: '#FFA502' },
    { name: 'Green', hex: '#22c55e' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Yellow', hex: '#eab308' },
  ];

  const filteredAssets = allAssets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragStart = (e, asset) => {
    e.dataTransfer.setData('asset', JSON.stringify(asset));
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // HTTP ortamlarında çökmeyi engelleyen güvenli kopyalama fonksiyonu
  const handleColorClick = (hex) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(hex)
        .then(() => console.log(`Renk kopyalandı: ${hex}`))
        .catch(err => console.error("Kopyalama başarısız:", err));
    } else {
      // Pano erişimi yoksa uygulamayı çökertmek yerine alert veriyoruz
      alert(`Seçilen Renk Kodu: ${hex} (Güvenli bağlantı -HTTPS- olmadığı için panoya otomatik kopyalanamadı)`);
    }
  };

  // Güvenli Export Tetikleyicisi
  const handleExportClick = () => {
    if (exportVideo) {
      exportVideo();
    } else {
      alert("Export fonksiyonu şu an backend üzerinde hazır değil veya tanımlanmamış.");
    }
  };

  return (
    <aside className="sidebar sidebar-left">
      {/* ASSETS PANEL */}
      <div className="panel">
        <h3>📁 Assets</h3>
        <input
          type="text"
          className="search-input"
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="assets-list">
          {filteredAssets.length > 0 ? (
            filteredAssets.map(asset => (
              <div 
                key={asset.id}
                className="asset-item"
                draggable
                onDragStart={(e) => handleDragStart(e, asset)}
                title={`${asset.name} - Drag to timeline`}
              >
                <span className="asset-icon">{asset.icon}</span>
                <div className="asset-info">
                  <p className="asset-name">{asset.name}</p>
                  <p className="asset-duration">{formatTime(asset.duration)}</p>
                </div>
                <span className="drag-hint">⋮⋮</span>
              </div>
            ))
          ) : (
            <p className="empty-state">No assets found</p>
          )}
        </div>
      </div>

      {/* COLORS PANEL */}
      <div className="panel">
        <h3>🎨 Colors</h3>
        <div className="colors-grid">
          {colors.map((color, i) => (
            <button
              key={i}
              className="color-btn"
              style={{ backgroundColor: color.hex }}
              title={color.name}
              onClick={() => handleColorClick(color.hex)} // Güvenli fonksiyona bağlandı
            />
          ))}
        </div>
      </div>

      {/* EXPORT PANEL */}
      <div className="panel">
        <h3>📤 Export</h3>
        <button 
          className="export-btn" 
          title="Export Video (Ctrl+E)"
          onClick={handleExportClick} // Tıklama işlevi eklendi
        >
          🚀 Export Video
        </button>
      </div>

      {/* INFO PANEL */}
      <div className="panel info-panel">
        <h3>ℹ️ Info</h3>
        <p className="info-text">
          <strong>Drag assets</strong> from this panel to the timeline to start editing.
        </p>
        <p className="info-text">
          <strong>Current Time:</strong> {formatTime(currentTime)}
        </p>
      </div>
    </aside>
  );
}

export default AssetPanel;
