import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
  // Ortam değişkenlerini veya mevcut tarayıcı IP/Domain bilgisini dinamik olarak seçer
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

  useEffect(() => {
    const initEditor = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BACKEND_URL}/api/assets`).catch(() => ({ data: { videos: [], audios: [] } }));
        if (response.data) {
          setVideos(response.data.videos || []);
          setAudios(response.data.audios || []);
        }
      } catch (err) {
        console.error("Editor başlatılamadı:", err);
      } finally {
        setLoading(false);
      }
    };

    initEditor();
  }, [BACKEND_URL]);

  const exportVideo = async (timelineData) => {
    if (exporting) return;
    try {
      setExporting(true);
      const response = await axios.post(`${BACKEND_URL}/api/export`, {
        tracks: timelineData || tracks
      });
      
      if (response.data && response.data.downloadUrl) {
        alert("Video başarıyla oluşturuldu!");
      } else {
        throw new Error("Geçersiz yanıt yapısı");
      }
    } catch (error) {
      console.error("Dışa Aktarma Hatası:", error);
      alert("Video oluşturma esnasında bir hata meydana geldi.");
    } finally {
      setExporting(false);
    }
  };

  const value = {
    videos, setVideos,
    audios, setAudios,
    tracks, setTracks,
    selectedTrack, setSelectedTrack,
    isPlaying, setIsPlaying,
    currentTime, setCurrentTime,
    duration, setDuration,
    loading, exporting, exportVideo,
    BACKEND_URL
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor bir EditorProvider bloğu içinde çağrılmalıdır.');
  }
  return context;
};
