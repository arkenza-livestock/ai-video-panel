import React, { createContext, useState, useCallback, useEffect } from 'react';
import projectService from '../services/projectService';
import healthService from '../services/healthService';

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

  // API State
  const [apiReady, setApiReady] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check API health on mount
  useEffect(() => {
    const checkAPI = async () => {
      setIsLoading(true);
      const isReady = await healthService.waitForAPI();
      setApiReady(isReady);
      if (!isReady) {
        setApiError('Backend API is not available');
      }
      setIsLoading(false);
    };

    checkAPI();
  }, []);

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
  }, []);

  const saveResizeClip = useCallback(() => {
    updateTimeline(timeline);
  }, [timeline, updateTimeline]);

  // PROJECT OPERATIONS
  const createNewProject = useCallback(async () => {
    if (!apiReady) {
      setApiError('API not ready');
      return null;
    }

    try {
      setIsLoading(true);
      const result = await projectService.createProject(projectSettings);
      setCurrentProjectId(result.id);
      setApiError(null);
      return result.id;
    } catch (error) {
      setApiError(error.message);
      console.error('Error creating project:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [projectSettings, apiReady]);

  const loadProject = useCallback(async (projectId) => {
    if (!apiReady) {
      setApiError('API not ready');
      return false;
    }

    try {
      setIsLoading(true);
      const project = await projectService.getProject(projectId);
      
      setCurrentProjectId(projectId);
      setProjectSettings(project.settings);
      setTimeline(project.timeline || []);
      setHistory([project.timeline || []]);
      setHistoryIndex(0);
      setApiError(null);
      
      return true;
    } catch (error) {
      setApiError(error.message);
      console.error('Error loading project:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [apiReady]);

  const saveProject = useCallback(async () => {
    if (!apiReady || !currentProjectId) {
      setApiError('Cannot save: API not ready or no project loaded');
      return false;
    }

    try {
      setIsSaving(true);
      await projectService.saveTimeline(currentProjectId, {
        clips: timeline,
        duration,
        fps: projectSettings.fps,
        resolution: projectSettings.resolution,
      });
      
      setApiError(null);
      return true;
    } catch (error) {
      setApiError(error.message);
      console.error('Error saving project:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [currentProjectId, timeline, duration, projectSettings, apiReady]);

  const deleteProject = useCallback(async (projectId) => {
    if (!apiReady) {
      setApiError('API not ready');
      return false;
    }

    try {
      setIsLoading(true);
      await projectService.deleteProject(projectId);
      
      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
        setTimeline([]);
        setHistory([[]]);
        setHistoryIndex(0);
      }
      
      setApiError(null);
      return true;
    } catch (error) {
      setApiError(error.message);
      console.error('Error deleting project:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentProjectId, apiReady]);

  // AUTO-SAVE (every 30 seconds)
  useEffect(() => {
    if (!apiReady || !currentProjectId) return;

    const autoSaveInterval = setInterval(() => {
      saveProject();
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [apiReady, currentProjectId, saveProject]);

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

    // API State
    apiReady,
    apiError,
    setApiError,
    currentProjectId,
    isSaving,
    isLoading,

    // Methods - Undo/Redo
    updateTimeline,
    handleUndo,
    handleRedo,

    // Methods - Clip Operations
    deleteClip,
    addClip,
    applyEffect,
    resizeClip,
    saveResizeClip,

    // Methods - Project Operations
    createNewProject,
    loadProject,
    saveProject,
    deleteProject,
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
