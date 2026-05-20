import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
  // Dinamik URL tespiti: Coolify üzerinde port veya env ne olursa olsun patlamaz
  const BACKEND_URL = 
    import.meta.env?.VITE_API_URL || 
    process.env?.REACT_APP_API_URL || 
    `${window.location.protocol}//${window.location.hostname}:3012`;

  const [videos, setVideos] = useState([]);
  const [audios, setAudios] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // İlk açılışta yüklenen medyaları API'den çek
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BACKEND_URL}/api/assets`);
        if (res.data) {
          setVideos(res.data.videos || []);
          setAudios(res.data.audios || []);
        }
      } catch (err) {
        console.error("Medyalar sunucudan yüklenemedi:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, [BACKEND_URL]);

  // Videoyu birleştirip render etme tetikleyicisi
  const exportVideo = async (timelineTracks) => {
    if (exporting) return;
    try {
      setExporting(true);
      const res = await axios.post(`${BACKEND_URL}/api/export`, {
        tracks: timelineTracks || tracks
      });
      if (res.data && res.data.downloadUrl) {
        alert("Video başarıyla oluşturuldu! İndirme linki hazır.");
      }
    } catch (err) {
      console.error("Render hatası:", err);
      alert("Video işlenirken sunucu tarafında bir hata oluştu.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <EditorContext.Provider value={{
      videos, setVideos,
      audios, setAudios,
      tracks, setTracks,
      selectedTrack, setSelectedTrack,
      isPlaying, setIsPlaying,
      currentTime, setCurrentTime,
      duration, setDuration,
      loading, exporting, exportVideo,
      BACKEND_URL
    }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor bileşeni EditorProvider bloğu dışarısında kullanılamaz.');
  }
  return context;
};
