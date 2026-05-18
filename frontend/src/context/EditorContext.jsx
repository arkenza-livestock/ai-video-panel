import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Arayüzün kilitlenmemesi için varsayılan bir geçici proje ID'si atıyoruz
  const [currentProjectId, setCurrentProjectId] = useState('default-session');
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
  
  // Arayüzün donup kalmasını engellemek için isLoading başlangıcını false yapıyoruz
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAPI = async () => {
      try {
        if (healthService && typeof healthService.waitForAPI === 'function') {
          await healthService.waitForAPI();
          setApiReady(true);
        }
      } catch (err) {
        console.warn('API servisine şu an erişilemiyor, lokal modda çalışıyor.');
        setApiError('API servisi erişilemez');
      } finally {
        setIsLoading(false);
      }
    };
    checkAPI();
  }, []);

  useEffect(() => {
    if (!apiReady || currentProjectId === 'default-session') return;
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
    const fallbackName = name || 'Yeni Proje';
    setProjectSettings({
      projectName: fallbackName,
      fps: 30,
      resolution: '1920x1080',
      bitrate: '5000k',
      audioFormat: 'aac',
    });
    setTimeline([]);
    setHistory([[]]);
    setHistoryIndex(0);

    try {
      setIsSaving(true);
      if (projectService && typeof projectService.createProject === 'function') {
        const project = await projectService.createProject(fallbackName);
        if (project && project.id) setCurrentProjectId(project.id);
        return project;
      }
    } catch (err) {
      console.error('Proje backend üzerinde oluşturulamadı, lokal çalışılıyor:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const loadProject = async (projectId) => {
    try {
      setIsLoading(true);
      if (projectService && typeof projectService.getProject === 'function') {
        const project = await projectService.getProject(projectId);
        setCurrentProjectId(projectId);
        setTimeline(project.timeline || []);
        setProjectSettings(project.settings || projectSettings);
        setHistory([project.timeline || []]);
        setHistoryIndex(0);
        return project;
      }
    } catch (err) {
      setApiError('Proje yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const saveProject = async () => {
    if (!currentProjectId || currentProjectId === 'default-session') return;
    try {
      setIsSaving(true);
      if (projectService && typeof projectService.updateProject === 'function') {
        await projectService.updateProject(currentProjectId, {
          timeline,
          settings: projectSettings,
        });
      }
    } catch (err) {
      setApiError('Proje kaydedilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProject = async (projectId) => {
    try {
      if (projectService && typeof projectService.deleteProject === 'function') {
        await projectService.deleteProject(projectId);
      }
      if (currentProjectId === projectId) {
        setCurrentProjectId('default-session');
        setTimeline([]);
      }
    } catch (err) {
      setApiError('Proje silinemedi');
    }
  };

  const exportVideo = async () => {
    try {
      setIsSaving(true);
      alert("Video oluşturma talebi backend'e iletiliyor...");
      if (projectService && typeof projectService.exportVideo === 'function') {
        await projectService.exportVideo(currentProjectId, timeline);
        alert("Export işlemi başarıyla başlatıldı!");
      } else {
        alert("Export endpoint servisi henüz backend API dosyasında tanımlı değil.");
      }
    } catch (err) {
      alert("Video dönüştürme (Export) sırasında bir hata oluştu.");
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
    exportVideo,
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
