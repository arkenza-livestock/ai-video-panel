import apiClient from './apiClient';

// Fonksiyonları tek tek (Named Export) dışa aktarıyoruz ki EditorContext doğrudan okuyabilsin
export const getProjects = () => apiClient.get('/api/projects');

export const createProject = (settings) => apiClient.post('/api/projects', settings);

export const getProject = (projectId) => apiClient.get(`/api/projects/${projectId}`);

export const updateProject = (projectId, data) => apiClient.put(`/api/projects/${projectId}`, data);

export const deleteProject = (projectId) => apiClient.delete(`/api/projects/${projectId}`);

export const saveTimeline = (projectId, timeline) =>
  apiClient.post(`/api/projects/${projectId}/timeline`, timeline);

export const getAssets = () => apiClient.get('/api/assets');

export const getEffects = () => apiClient.get('/api/effects');

export const uploadFile = (file) => apiClient.upload('/api/upload', file);

// Eski yapıyla uyumluluk için toplu nesne (Default Export) olarak da dışa aktarıyoruz
const projectService = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  saveTimeline,
  getAssets,
  getEffects,
  uploadFile,
};

export default projectService;
