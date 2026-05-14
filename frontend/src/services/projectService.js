import apiClient from './apiClient';

// PROJECT ENDPOINTS
export const projectService = {
  // Get all projects
  getProjects: () => apiClient.get('/api/projects'),

  // Create new project
  createProject: (settings) => apiClient.post('/api/projects', settings),

  // Get project by ID
  getProject: (projectId) => apiClient.get(`/api/projects/${projectId}`),

  // Update project
  updateProject: (projectId, data) => apiClient.put(`/api/projects/${projectId}`, data),

  // Delete project
  deleteProject: (projectId) => apiClient.delete(`/api/projects/${projectId}`),

  // Save timeline
  saveTimeline: (projectId, timeline) =>
    apiClient.post(`/api/projects/${projectId}/timeline`, timeline),

  // Get assets
  getAssets: () => apiClient.get('/api/assets'),

  // Get effects
  getEffects: () => apiClient.get('/api/effects'),

  // Upload file
  uploadFile: (file) => apiClient.upload('/api/upload', file),
};

export default projectService;
