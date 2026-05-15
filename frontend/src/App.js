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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+S - Save project
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        // Save handled by EditorContext auto-save
      }

      // Ctrl+O - Open project
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        setShowProjectModal(true);
      }

      // Ctrl+E - Export
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        setShowExportDialog(true);
      }

      // Ctrl+, - Settings
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setShowSettingsModal(true);
      }

      // Space - Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }

      // Delete - Delete selected clip
      if (e.key === 'Delete') {
        e.preventDefault();
        // Delete handled by context
      }

      // Arrow keys - Seek
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

  // Loading screen
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Atmosfer Studio yükleniyor...</p>
      </div>
    );
  }

  // API Error screen
  if (apiError) {
    return (
      <div className="error-screen">
        <div className="error-box">
          <h2>⚠️ Bağlantı Hatası</h2>
          <p>{apiError}</p>
          <p>Backend servisi çalışmıyor veya erişilemez.</p>
          <button onClick={() => window.location.reload()}>
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Saving indicator */}
      {isSaving && (
        <div className="saving-indicator">
          💾 Kaydediliyor...
        </div>
      )}

      {/* API Ready indicator */}
      {!apiReady && (
        <div className="api-warning">
          ⚠️ API hazırlanıyor...
        </div>
      )}

      {/* Header */}
      <Header
        showProjectModal={showProjectModal}
        setShowProjectModal={setShowProjectModal}
      />

      {/* Main content */}
      <div className="main-content">
        {/* Left sidebar - Assets */}
        <AssetPanel />

        {/* Center - Canvas & Timeline */}
        <div className="center-panel">
          {/* Video preview */}
          <Canvas />

          {/* Timeline */}
          <Timeline />
        </div>

        {/* Right sidebar - Inspector */}
        <Inspector
          setShowExportDialog={setShowExportDialog}
          setShowSettingsModal={setShowSettingsModal}
        />
      </div>

      {/* Footer - Playback controls */}
      <Footer
        setShowExportDialog={setShowExportDialog}
        setShowProjectModal={setShowProjectModal}
      />

      {/* Modals */}
      {showExportDialog && (
        <ExportDialog onClose={() => setShowExportDialog(false)} />
      )}

      {showProjectModal && (
        <ProjectModal onClose={() => setShowProjectModal(false)} />
      )}

      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}
    </div>
  );
}

export default App;
