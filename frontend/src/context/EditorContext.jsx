import React, { createContext, useState, useCallback } from 'react';

export const EditorContext = createContext();

export function EditorProvider({ children }) {
  const [timeline, setTimeline] = useState([]);
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedClip, setSelectedClip] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(180);
  const [selectedEffect, setSelectedEffect] = useState(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [projectSettings, setProjectSettings] = useState({
    projectName: 'Untitled Project',
    fps: 30,
    resolution: '1080p',
    bitrate: 'high',
    audioFormat: 'aac',
    theme: 'dark',
  });

  // UNDO/REDO
  const updateTimeline = useCallback((newTimeline) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTimeline);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setTimeline(newTimeline);
  }, [history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTimeline(history[newIndex]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTimeline(history[newIndex]);
    }
  }, [historyIndex, history]);

  // CLIP OPERATIONS
  const deleteClip = useCallback((clipId) => {
    const newTimeline = timeline.filter(c => c.id !== clipId);
    updateTimeline(newTimeline);
    if (selectedClip?.id === clipId) setSelectedClip(null);
  }, [timeline, selectedClip, updateTimeline]);

  const addClip = useCallback((clip) => {
    updateTimeline([...timeline, clip]);
  }, [timeline, updateTimeline]);

  const applyEffect = useCallback((clipId, effect) => {
    const updatedTimeline = timeline.map(c =>
      c.id === clipId ? { ...c, effects: [...c.effects, effect] } : c
    );
    updateTimeline(updatedTimeline);
  }, [timeline, updateTimeline]);

  const resizeClip = useCallback((clipId, startTime, duration) => {
    const updatedTimeline = timeline.map(c =>
      c.id === clipId ? { ...c, startTime, duration } : c
    );
    setTimeline(updatedTimeline);
  }, [timeline]);

  const saveResizeClip = useCallback(() => {
    updateTimeline(timeline);
  }, [timeline, updateTimeline]);

  const value = {
    // State
    timeline,
    setTimeline,
    history,
    historyIndex,
    selectedClip,
    setSelectedClip,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    duration,
    setDuration,
    selectedEffect,
    setSelectedEffect,
    showExportDialog,
    setShowExportDialog,
    showSettingsModal,
    setShowSettingsModal,
    projectSettings,
    setProjectSettings,

    // Methods
    updateTimeline,
    handleUndo,
    handleRedo,
    deleteClip,
    addClip,
    applyEffect,
    resizeClip,
    saveResizeClip,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = React.useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
}
