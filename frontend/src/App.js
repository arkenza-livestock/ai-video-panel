import React, { useState } from 'react';
import { useEditor } from './context/EditorContext';
import axios from 'axios';

function App() {
  const {
    videos, setVideos,
    audios, setAudios,
    tracks, setTracks,
    isPlaying, setIsPlaying,
    currentTime, setCurrentTime,
    duration, exportVideo, exporting, loading,
    BACKEND_URL
  } = useEditor();

  const [uploading, setUploading] = useState(false);

  // Dosya Yükleme Fonksiyonu (Video/Ses)
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      setUploading(true);
      const response = await axios.post(`${BACKEND_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (type === 'video') {
        setVideos([...videos, response.data]);
      } else {
        setAudios([...audios, response.data]);
      }
      alert("Dosya başarıyla yüklendi!");
    } catch (error) {
      console.error("Yükleme hatası:", error);
      alert("Dosya yüklenirken bir hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  // Zaman Çizelgesine Öğe Ekleme
  const addToTimeline = (item, type) => {
    const newTrack = {
      id: Date.now(),
      name: item.name,
      path: item.path,
      type: type,
      start: 0,
      duration: item.duration || 5,
    };
    setTracks([...tracks, newTrack]);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#141414', color: '#ffffff', fontFamily: 'sans-serif', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Üst Menü / Header */}
      <header style={{ height: '60px', borderBottom: '1px solid #282828', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', backgroundColor: '#1a1a1a' }}>
        <h2 style={{ margin: 0, fontSize: '18px', color: '#00adb5' }}>Atmosfer Video Stüdyo</h2>
        <button 
          onClick={() => exportVideo(tracks)} 
          disabled={exporting || tracks.length === 0}
          style={{ padding: '10px 20px', backgroundColor: '#00adb5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', opacity: (exporting || tracks.length === 0) ? 0.5 : 1 }}
        >
          {exporting ? 'Dışa Aktarılıyor...' : 'Videoyu Render Et (Export)'}
        </button>
      </header>

      {/* Ana Çalışma Alanı */}
      <main style={{ flex: 1, display: 'flex', height: 'calc(100vh - 260px)', backgroundColor: '#181818' }}>
        
        {/* Sol Panel: Medya Yükleme ve Listeleme */}
        <section style={{ width: '320px', borderRight: '1px solid #282828', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #282828' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Medya Yükle</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ flex: 1, padding: '8px', backgroundColor: '#2d2d2d', textAlign: 'center', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                + Video
                <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} style={{ display: 'none' }} />
              </label>
              <label style={{ flex: 1, padding: '8px', backgroundColor: '#2d2d2d', textAlign: 'center', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                + Ses
                <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'audio')} style={{ display: 'none' }} />
              </label>
            </div>
            {uploading && <p style={{ fontSize: '12px', color: '#00adb5', margin: '5px 0 0 0' }}>Dosya yükleniyor, lütfen bekleyin...</p>}
          </div>

          {/* Yüklenen Videolar */}
          <div style={{ flex: 1, padding: '15px', overflowY: 'auto' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#aaa' }}>Videolarım</h4>
            {loading ? <p style={{ fontSize: '12px' }}>Yükleniyor...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {videos.map((vid, idx) => (
                  <div key={idx} onClick={() => addToTimeline(vid, 'video')} style={{ padding: '8px', backgroundColor: '#242424', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', border: '1px solid #333' }}>
                    🎬 {vid.name}
                  </div>
                ))}
              </div>
            )}

            {/* Yüklenen Sesler */}
            <h4 style={{ margin: '20px 0 10px 0', fontSize: '13px', color: '#aaa' }}>Seslerim</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {audios.map((aud, idx) => (
                <div key={idx} onClick={() => addToTimeline(aud, 'audio')} style={{ padding: '8px', backgroundColor: '#242424', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', border: '1px solid #333' }}>
                  🎵 {aud.name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sağ Panel: Video Önizleme (Preview Video Player) */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '640px', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', border: '1px solid #282828' }}>
            {tracks.filter(t => t.type === 'video').length > 0 ? (
              <p style={{ color: '#00adb5' }}>Video Önizleme Aktif (Zaman: {currentTime.toFixed(2)}s / {duration.toFixed(2)}s)</p>
            ) : (
              <p style={{ color: '#666', fontSize: '14px' }}>Önizlemek için zaman çizelgesine video ekleyin.</p>
            )}
          </div>

          {/* Oynatıcı Kontrolleri */}
          <div style={{ marginTop: '15px', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button 
              onClick={() => setIsPlaying(!isPlaying)} 
              style={{ padding: '8px 16px', backgroundColor: '#2d2d2d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              {isPlaying ? '⏸ Durdur' : '▶ Oynat'}
            </button>
            <input 
              type="range" 
              min={0} 
              max={duration || 100} 
              value={currentTime} 
              onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
              style={{ width: '300px', accentColor: '#00adb5' }} 
            />
          </div>
        </section>
      </main>

      {/* Alt Panel: Zaman Çizelgesi (Timeline Area) */}
      <footer style={{ height: '200px', borderTop: '1px solid #282828', backgroundColor: '#1a1a1a', padding: '15px', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#aaa' }}>Zaman Çizelgesi (Timeline)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#111', padding: '10px', borderRadius: '6px', minHeight: '100px' }}>
          {tracks.length === 0 ? (
            <p style={{ color: '#444', fontSize: '12px', textAlign: 'center', marginTop: '35px' }}>Çizelgede henüz bir medya öğesi yok. Eklemek için soldaki videolara tıklayın.</p>
          ) : (
            tracks.map((track) => (
              <div key={track.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', backgroundColor: track.type === 'video' ? '#1c3d42' : '#2d372d', borderRadius: '4px', fontSize: '12px', borderLeft: `4px solid ${track.type === 'video' ? '#00adb5' : '#4caf50'}` }}>
                <span>{track.type === 'video' ? '🎬' : '🎵'} {track.name}</span>
                <button 
                  onClick={() => setTracks(tracks.filter(t => t.id !== track.id))}
                  style={{ background: 'none', border: 'none', color: '#ff4a4a', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Kaldır
                </button>
              </div>
            ))
          )}
        </div>
      </footer>

    </div>
  );
}

export default App;
