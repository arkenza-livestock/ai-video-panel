import React, { useEffect, useState } from 'react';
import { useEditor } from './context/EditorContext';
import ExportDialog from './ExportDialog';
import SettingsModal from './SettingsModal';
import ProjectModal from './ProjectModal';
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
    saveProject,
    apiReady,
    apiError,
    isLoading,
    isSaving,
  } = useEditor();

  const [showProjectModal, setShowProjectModal] = useState(false);

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

      // Ctrl+S → Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveProject();
      }

      // Ctrl+O → Open Project
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        setShowProjectModal(true);
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
  }, [
    isPlaying,
    selectedClip,
    currentTime,
    duration,
    handleUndo,
    handleRedo,
    deleteClip,
    setSelectedClip,
    setCurrentTime,
    setIsPlaying,
    setShowExportDialog,
    setShowSettingsModal,
    saveProject,
  ]);

  const handleSaveSettings = (newSettings) => {
    setProjectSettings(newSettings);
  };

  // Show loading screen
  if (isLoading) {
    return (
      <div className="app loading-screen">
        <div className="loading-content">
          <p>🚀 Initializing Atmosfer Studio...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Show error screen if API is not available
  if (apiError && !apiReady) {
    return (
      <div className="app error-screen">
        <div className="error-content">
          <p>⚠️ Backend Connection Error</p>
          <p className="error-message">{apiError}</p>
          <p className="error-hint">
            Make sure the backend is running on http://localhost:8000
          </p>
          <button 
            className="retry-btn"
            onClick={() => window.location.reload()}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* HEADER */}
      <Header showProjectModal={showProjectModal} setShowProjectModal={setShowProjectModal} />

      {/* MAIN EDITOR */}
      <div className="editor-container">
        <AssetPanel />
        <main className="editor-main">
          <Canvas />
          <Timeline />
        </main>
        <Inspector />
      </div>

      {/* FOOTER */}
      <Footer />

      {/* MODALS & DIALOGS */}
      
      {/* PROJECT MODAL */}
      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onProjectSelect={() => setShowProjectModal(false)}
      />

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

      {/* SAVE STATUS */}
      {isSaving && (
        <div className="save-indicator">
          <span>💾 Saving...</span>
        </div>
      )}

      {/* API ERROR NOTIFICATION */}
      {apiError && apiReady && (
        <div className="api-error-notification">
          <span>⚠️ {apiError}</span>
        </div>
      )}
    </div>
  );
}

export default App;
