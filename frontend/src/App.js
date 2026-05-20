import React, { useState, useEffect } from 'react';
import { EditorProvider } from './context/EditorContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';

function App() {
  const [videos, setVideos] = useState([]);
  const [audios, setAudios] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Backend API bağlantısı ve ilk yükleme logic'i buraya gelecek
  }, []);

  return (
    <EditorProvider>
      <div className="flex flex-col h-screen bg-[#111] text-white overflow-hidden select-none">
        {/* Header Bölümü */}
        <Header 
          tracks={tracks} 
          setIsPlaying={setIsPlaying} 
          isPlaying={isPlaying} 
        />

        {/* Ana İçerik Alanı */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Sol Menü */}
          <Sidebar 
            videos={videos} 
            setVideos={setVideos} 
            audios={audios} 
            setAudios={setAudios} 
            tracks={tracks} 
            setTracks={setTracks} 
          />

          {/* Sağ panel - Video Önizleme */}
          <div className="flex-1 flex flex-col bg-[#161616] overflow-hidden relative">
            <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative">
              <VideoPlayer 
                tracks={tracks}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                setDuration={setDuration}
                selectedTrack={selectedTrack}
                setSelectedTrack={setSelectedTrack}
              />
            </div>
          </div>
        </div>

        {/* Alt Zaman Çizelgesi */}
        <Timeline 
          tracks={tracks}
          setTracks={setTracks}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          duration={duration}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          selectedTrack={selectedTrack}
          setSelectedTrack={setSelectedTrack}
        />
      </div>
    </EditorProvider>
  );
}

export default App;
