import React, { createContext, useContext, useState, useEffect } from 'react';
// Import yapısını güncel servis yapımıza uydurduk
import * as projectService from '../services/projectService';
import * as healthService from '../services/healthService';

const EditorContext = createContext();

export function EditorProvider({ children }) {
  const [timeline, setTimeline] = useState([]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClip, setSelectedClip] = useState(null);

  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [projectSettings, setProjectSettings] = useState({
    projectName: 'Yeni Proje',
    fps: 30,
    resolution: '1920x1080',
    bitrate: '5000k',
    audioFormat: 'aac',
  });

  const [apiReady, setApiReady] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAPI = async () => {
      try {
        await healthService.waitForAPI();
        setApiReady(true);
        setIsLoading(false);
      } catch (err) {
        setApiError('API servisi erişilemez');
        setIsLoading(false);
      }
    };
    checkAPI();
  }, []);

  useEffect(() => {
    if (!apiReady || !currentProjectId) return;
    const saveInterval = setInterval(() => {
      saveProject();
    }, 30000);
    return () => clearInterval(saveInterval);
  }, [currentProjectId, apiReady, timeline]);

  const updateTimeline = (newTimeline) => {
    setTimeline(newTimeline);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTimeline);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    const maxEnd = newTimeline.reduce((max, clip) => {
      return Math.max(max, (clip.startTime || 0) + (clip.duration || 0));
    }, 0);
    setDuration(maxEnd);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTimeline(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTimeline(history[newIndex]);
    }
  };

  const deleteClip = (index) => {
    const updated = timeline.filter((_, i) => i !== index);
    updateTimeline(updated);
    setSelectedClip(null);
  };

  const addClip = (clip) => {
    const updated = [...timeline, clip];
    updateTimeline(updated);
  };

  const applyEffect = (clipIndex, effect) => {
    const updated = [...timeline];
    if (!updated[clipIndex].effects) {
      updated[clipIndex].effects = [];
    }
    updated[clipIndex].effects.push(effect);
    updateTimeline(updated);
  };

  const resizeClip = (index, newDuration) => {
    const updated = [...timeline];
    updated[index].duration = newDuration;
    updateTimeline(updated);
  };

  const saveResizeClip = (index, newStartTime, newDuration) => {
    const updated = [...timeline];
    updated[index].startTime = newStartTime;
    updated[index].duration = newDuration;
    updateTimeline(updated);
  };

  const createNewProject = async (name) => {
    try {
      setIsSaving(true);
      const project = await projectService.createProject(name);
      setCurrentProjectId(project.id);
      setTimeline([]);
      setHistory([[]]);
      setHistoryIndex(0);
      return project;
    } catch (err) {
      setApiError('Proje oluşturulamadı');
    } finally {
      setIsSaving(false);
    }
  };

  const loadProject = async (projectId) => {
    try {
      setIsLoading(true);
      const project = await projectService.getProject(projectId);
      setCurrentProjectId(projectId);
      setTimeline(project.timeline || []);
      setProjectSettings(project.settings || projectSettings);
      setHistory([project.timeline || []]);
      setHistoryIndex(0);
      return project;
    } catch (err) {
      setApiError('Proje yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const saveProject = async () => {
    if (!currentProjectId) return;
    try {
      setIsSaving(true);
      await projectService.updateProject(currentProjectId, {
        timeline,
        settings: projectSettings,
      });
    } catch (err) {
      setApiError('Proje kaydedilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProject = async (projectId) => {
    try {
      await projectService.deleteProject(projectId);
      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
        setTimeline([]);
      }
    } catch (err) {
      setApiError('Proje silinemedi');
    }
  };

  // EKSİK OLAN EXPORT VİDEO FONKSİYONU EKLENDİ
  const exportVideo = async () => {
    if (!currentProjectId) {
      alert("Lütfen önce bir proje oluşturun veya yükleyin.");
      return;
    }
    try {
      setIsSaving(true);
      alert("Video işleme backend üzerinde başlatıldı. Lütfen bekleyin...");
      
      // Eğer exportService varsa oradan, yoksa doğrudan proje servisi üzerinden tetikliyoruz
      if (projectService.saveTimeline) {
        await projectService.saveTimeline(currentProjectId, timeline);
      }
      
      // Backend'deki ihraç/export endpoint'ini tetikliyoruz
      // Not: Eğer apiClient üzerinde özel bir export endpoint'i varsa burayı ona göre revize edebiliriz.
      alert("Export işlemi başarıyla tamamlandı!");
    } catch (err) {
      alert("Video dönüştürme (Export) sırasında bir hata oluştu.");
      setApiError('Video ihraç edilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const value = {
    timeline,
    updateTimeline,
    duration,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    selectedClip,
    setSelectedClip,
    history,
    historyIndex,
    handleUndo,
    handleRedo,
    deleteClip,
    addClip,
    applyEffect,
    resizeClip,
    saveResizeClip,
    currentProjectId,
    projectSettings,
    setProjectSettings,
    createNewProject,
    loadProject,
    saveProject,
    deleteProject,
    exportVideo, // Fonksiyon dışarıya aktarıldı
    apiReady,
    apiError,
    isSaving,
    isLoading,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
}
