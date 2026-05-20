import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
  // .env dosyasından gelen URL'i hem Vite hem CRA için güvenli şekilde oku
  const BACKEND_URL = 
    import.meta.env?.VITE_API_URL || 
    process.env?.REACT_APP_API_URL || 
    `${window.location.protocol}//${window.location.hostname}:3012`;

  // State tanımlamaları (Çökmeyi önlemek için varsayılan boş array/obje)
  const [videos, setVideos] = useState([]);
  const [audios, setAudios] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // API bağlantısını test eden ve ilk verileri çeken güvenli fonksiyon
  useEffect(() => {
    const initEditor = async () => {
      try {
        setLoading(true);
        // Backend'e hafif bir istek atıp ayakta mı kontrol ediyoruz
        const response = await axios.get(`${BACKEND_URL}/api/assets`).catch(() => ({ data: { videos: [], audios: [] } }));
        
        if (response.data) {
          setVideos(response.data.videos || []);
          setAudios(response.data.audios || []);
        }
      } catch (err) {
        console.error("Editor Context başlatılamadı, yerel modda çalışıyor:", err);
      } finally {
        setLoading(false);
      }
    };

    initEditor();
  }, [BACKEND_URL]);

  // Video Export (Dışa Aktarma) Fonksiyonu
  const exportVideo = async (timelineData) => {
    if (exporting) return;
    try {
      setExporting(true);
      const response = await axios.post(`${BACKEND_URL}/api/export`, {
        tracks: timelineData || tracks
      });
      
      if (response.data && response.data.downloadUrl) {
        alert("Video başarıyla oluşturuldu!");
        // İndirme işlemini başlat veya state'e kaydet
      } else {
        throw new Error("Geçersiz API yanıtı");
      }
    } catch (error) {
      console.error("Export Hatası:", error);
      alert("Video dönüştürme (Export) sırasında bir hata oluştu.");
    } finally {
      setExporting(false);
    }
  };

  // Context içinden dışarıya aktarılan güvenli yapılar
  const value = {
    videos,
    setVideos,
    audios,
    setAudios,
    tracks,
    setTracks,
    selectedTrack,
    setSelectedTrack,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    loading,
    exporting,
    exportVideo,
    BACKEND_URL
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

// Kolay kullanım için Custom Hook (Export hatası vermemesi için en altta temiz tanımlama)
export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor mutlaka an EditorProvider içinde kullanılmalıdır');
  }
  return context;
};
