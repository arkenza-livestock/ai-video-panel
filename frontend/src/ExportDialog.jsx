import React, { useState } from 'react';
import './ExportDialog.css';

function ExportDialog({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleExportVideo = async () => {
    // Tarayıcının doğrudan sunucudaki backend portuna gitmesini sağlıyoruz
    const API_URL = "http://72.62.186.96:8000"; 
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: "yeni_proje",
          fps: 30,
          assets: []
        }),
      });

      const result = await response.json();

      if (result.status === "success") {
        alert("Başarılı: " + result.message);
        if (onClose) onClose();
      } else {
        alert("Backend Hatası: " + result.message);
      }

    } catch (error) {
      console.error("Bağlantı Hatası:", error);
      alert("API Bağlantı Hatası: Sunucuya ulaşılamadı. Lütfen backend konteynerinin çalıştığından emin olun.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: '#1e1e2e', color: '#fff', padding: '30px',
        borderRadius: '8px', width: '350px', textAlign: 'center'
      }}>
        <h2>🎬 Video Export</h2>
        <p style={{ margin: '15px 0', color: '#aaa', fontSize: '14px' }}>
          Projeyi render etmek için backend servisine göndermek istiyor musunuz?
        </p>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
          <button 
            onClick={handleExportVideo}
            disabled={loading}
            style={{
              padding: '10px 20px', backgroundColor: '#10b981', color: '#fff',
              border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? "İşleniyor..." : "Render Başlat"}
          </button>
          
          <button 
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff',
              border: 'none', borderRadius: '4px', cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;
