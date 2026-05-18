import React, { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import '../styles/Inspector.css'; // Gerekirse kendi stil dosyanın yolunu yazabilirsin

function ExportDialog({ isOpen, onClose }) {
  const { timeline, projectSettings } = useEditor();
  const [loading, setLoading] = useState(false);

  // Eğer modal açık değilse ekrana hiçbir şey basma
  if (!isOpen) return null;

  const handleExportVideo = async () => {
    const API_URL = "http://72.62.186.96:8000"; 
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: projectSettings?.projectName || "yeni_proje",
          fps: 30,
          assets: timeline || [] 
        }),
      });

      const result = await response.json();

      if (result.status === "success") {
        alert("Başarılı: " + result.message);
        if (onClose) onClose(); // Başarılıysa pencereyi kapat
      } else {
        alert("Backend Hatası: " + result.message);
      }

    } catch (error) {
      console.error("Bağlantı Hatası:", error);
      alert("API Bağlantı Hatası: Sunucuya ulaşılamadı. Lütfen 8000 portunun açık olduğundan emin olun.");
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
        borderRadius: '8px', width: '400px', textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        <h2>🎬 Video Export / Render</h2>
        <p style={{ margin: '15px 0', color: '#aaa' }}>
          Mevcut projeniz derlenmek üzere sunucuya gönderilecek.
        </p>
        
        <div style={{ marginBottom: '20px', fontSize: '14px', textAlign: 'left', backgroundColor: '#252538', padding: '10px', borderRadius: '4px' }}>
          <strong>Proje Adı:</strong> {projectSettings?.projectName || 'İsimsiz Proje'}<br/>
          <strong>Element Sayısı:</strong> {timeline?.length || 0} adet
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            onClick={handleExportVideo}
            disabled={loading}
            style={{
              padding: '10px 20px', backgroundColor: '#10b981', color: '#fff',
              border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? "Gönderiliyor..." : "Render Başlat"}
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
