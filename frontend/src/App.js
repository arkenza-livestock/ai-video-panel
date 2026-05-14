import React, { useEffect } from 'react';
import { useEditor } from './context/EditorContext';
import ExportDialog from './ExportDialog';
import SettingsModal from './SettingsModal';
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
    historyIndex,
    history,
  } = useEditor();

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        setShowExportDialog(true);
      }
      
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setShowSettingsModal(true);
      }
      
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }

      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
      
      if (e.key === 'Delete' && selectedClip) {
        e.preventDefault();
        deleteClip(selectedClip.id);
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentTime(Math.max(0, currentTime - 1));
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentTime(Math.min(duration, currentTime + 1));
      }

      if (e.key === 'd') {
        setSelectedClip(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, selectedClip, currentTime, duration, handleUndo, handleRedo, deleteClip]);

  const handleSaveSettings = (newSettings) => {
    setProjectSettings(newSettings);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🌙 {projectSettings.projectName}</h1>
        <div className="header-menu">
          <button 
            onClick={handleUndo} 
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button 
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
          <button title="File">File</button>
          <button title="Edit">Edit</button>
          <button title="View">View</button>
          <button onClick={() => setShowSettingsModal(true)} title="Settings (Ctrl+,)">⚙️ Settings</button>
        </div>
      </header>

      <div className="editor-container">
        <AssetPanel />
        <main className="editor-main">
          <Canvas />
          <Timeline />
        </main>
        <Inspector />
      </div>

      <Footer />

      {/* DIALOGS */}
      <ExportDialog 
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        duration={duration}
      />

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
