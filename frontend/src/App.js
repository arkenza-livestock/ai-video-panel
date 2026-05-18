import React, { useState, useEffect } from 'react';
import { useEditor } from './context/EditorContext';
import Header from './components/Header';
import Canvas from './components/Canvas';
import Timeline from './components/Timeline';
import AssetPanel from './components/AssetPanel';
import Inspector from './components/Inspector';
import Footer from './components/Footer';
import AudioMixer from './AudioMixer.jsx';
import ExportDialog from './ExportDialog';
import ProjectModal from './ProjectModal';
import SettingsModal from './SettingsModal';
import './App.css';

function App() {
  const {
    apiReady,
    apiError,
    isSaving,
    isLoading,
    timeline,
    duration,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
  } = useEditor();

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 's') e.preventDefault();
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        setShowProjectModal(true);
      }
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        setShowExportDialog(true);
      }
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setShowSettingsModal(true);
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentTime(Math.max(0, currentTime - 1));
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentTime(Math.min(duration, currentTime + 1));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, currentTime, duration, setCurrentTime, setIsPlaying]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Atmosfer Studio yükleniyor...</p>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="error-screen">
        <div className="error-box">
          <h2>⚠️ Bağlantı Hatası</h2>
          <p>{apiError}</p>
          <button onClick={() => window.location.reload()}>Yeniden Dene</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {isSaving && <div className="saving-indicator">💾 Kaydediliyor...</div>}
      {!apiReady && <div className="api-warning">⚠️ API hazırlanıyor...</div>}

      <Header
        showProjectModal={showProjectModal}
        setShowProjectModal={setShowProjectModal}
      />

      <div className="main-content">
        <AssetPanel />
        <div className="center-panel">
          <Canvas />
          <Timeline />
        </div>
        <Inspector
          setShowExportDialog={setShowExportDialog}
          setShowSettingsModal={setShowSettingsModal}
        />
      </div>

      <Footer
        setShowExportDialog={setShowExportDialog}
        setShowProjectModal={setShowProjectModal}
      />

      {showExportDialog && <ExportDialog onClose={() => setShowExportDialog(false)} />}
      {showProjectModal && <ProjectModal onClose={() => setShowProjectModal(false)} />}
      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
    </div>
  );
}

export default App;
