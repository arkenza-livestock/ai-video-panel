import React, { useEffect } from 'react';
import { useEditor } from './context/EditorContext';
import ExportDialog from './ExportDialog';
import SettingsModal from './SettingsModal';
import Header from './components/Header';
import Timeline from './components/Timeline';
import Canvas from './components/Canvas';
import AssetPanel from './components/AssetPanel';
import Inspector from './components/Inspector';
import Footer from './components/Footer';
import './App.css';

function App() {
  const {
    selectedClip,
    setSelectedClip,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    duration,
    showExportDialog,
    setShowExportDialog,
    showSettingsModal,
    setShowSettingsModal,
    projectSettings,
    setProjectSettings,
    handleUndo,
    handleRedo,
    deleteClip,
  } = useEditor();

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+E → Export
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        setShowExportDialog(true);
      }
      
      // Ctrl+, → Settings
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setShowSettingsModal(true);
      }
      
      // Ctrl+Z → Undo
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }

      // Ctrl+Y → Redo
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      
      // Space → Play/Pause
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
      
      // Delete → Delete selected clip
      if (e.key === 'Delete' && selectedClip) {
        e.preventDefault();
        deleteClip(selectedClip.id);
      }

      // Arrow Left → Rewind 1s
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentTime(Math.max(0, currentTime - 1));
      }

      // Arrow Right → Forward 1s
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentTime(Math.min(duration, currentTime + 1));
      }

      // D → Deselect clip
      if (e.key === 'd' || e.key === 'D') {
        setSelectedClip(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, selectedClip, currentTime, duration, handleUndo, handleRedo, deleteClip, setSelectedClip, setCurrentTime, setIsPlaying, setShowExportDialog, setShowSettingsModal]);

  const handleSaveSettings = (newSettings) => {
    setProjectSettings(newSettings);
  };

  return (
    <div className="app">
      {/* HEADER */}
      <Header />

      {/* MAIN EDITOR CONTAINER */}
      <div className="editor-container">
        {/* LEFT SIDEBAR - ASSETS */}
        <AssetPanel />

        {/* CENTER - CANVAS + TIMELINE */}
        <main className="editor-main">
          <Canvas />
          <Timeline />
        </main>

        {/* RIGHT SIDEBAR - INSPECTOR */}
        <Inspector />
      </div>

      {/* FOOTER - PLAYBACK CONTROLS */}
      <Footer />

      {/* EXPORT DIALOG */}
      <ExportDialog 
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        duration={duration}
      />

      {/* SETTINGS MODAL */}
      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={handleSaveSettings}
        projectSettings={projectSettings}
      />
    </div>
  );
}

export default App;
