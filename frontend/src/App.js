import React from 'react';
import { EditorProvider } from './context/EditorContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';

function App() {
  return (
    <EditorProvider>
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        backgroundColor: '#141414', 
        color: '#ffffff', 
        fontFamily: 'sans-serif', 
        margin: 0, 
        padding: 0, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden' 
      }}>
        {/* Üst Menü */}
        <Header />

        {/* Orta Çalışma Alanı */}
        <div style={{ flex: 1, display: 'flex', height: 'calc(100vh - 260px)', backgroundColor: '#181818' }}>
          {/* Sol Menü (Medya Yükleme ve Listeleme) */}
          <Sidebar />
          
          {/* Sağ Alan (Video Önizleme Oynatıcı) */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <VideoPlayer />
          </div>
        </div>

        {/* Alt Alan (Zaman Çizelgesi) */}
        <Timeline />
      </div>
    </EditorProvider>
  );
}

export default App;
