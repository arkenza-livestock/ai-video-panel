import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
  // Backend URL tespiti - daha güvenilir
  const getBackendUrl = () => {
    // Environment variable kontrolü
    if (import.meta.env?.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    if (process.env?.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    // Aynı host üzerinden çalışıyorsa
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    // Eğer development modundaysa
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3012';
    }
    // Production: aynı host, port 3012
    return `${protocol}//${hostname}:3012`;
  };

  const BACKEND_URL = getBackendUrl();

  const [videos, setVideos] = useState([]);
  const [audios, setAudios] = useState([]);
  const [tracks, setTracks] = useState([
    { id: 'track1', name: 'Video Track', type: 'video', clips: [] },
    { id: 'track2', name: 'Audio Track', type: 'audio', clips: [] }
  ]);
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
        const response = await axios.get(`${BACKEND_URL}/api/assets`);
        if (response.data) {
          setVideos(response.data.videos || []);
          setAudios(response.data.audios || []);
        }
      } catch (err) {
        console.error("Medyalar sunucudan yüklenemedi:", err);
        // Hata durumunda boş array ile devam et
        setVideos([]);
        setAudios([]);
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
      const tracksToExport = timelineTracks || tracks;
      const response = await axios.post(`${BACKEND_URL}/api/export`, {
        tracks: tracksToExport
      });
      if (response.data && response.data.downloadUrl) {
        alert("Video başarıyla oluşturuldu! İndirme linki hazır.");
        return response.data;
      }
    } catch (err) {
      console.error("Render hatası:", err);
      alert(`Video işlenirken hata oluştu: ${err.message}`);
      throw err;
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
