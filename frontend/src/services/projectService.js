import apiClient from './apiClient';

const projectService = {
  // Tüm projeleri getirir
  getAllProjects: () => apiClient.get('/projects'),

  // Tek bir projeyi detaylarıyla getirir
  getProject: (id) => apiClient.get(`/projects/${id}`),

  // Yeni bir video projesi oluşturur
  createProject: (projectData) => apiClient.post('/projects', projectData),

  // Mevcut projeyi günceller
  updateProject: (id, projectData) => apiClient.put(`/projects/${id}`, projectData),

  // Projeyi tamamen siler
  deleteProject: (id) => apiClient.delete(`/projects/${id}`),

  // Backend tarafında video birleştirme ve render (export) işlemini tetikler
  exportVideo: (projectId, exportSettings) => 
    apiClient.post(`/projects/${projectId}/export`, exportSettings || {}),

  // Projeye ait ham video/ses dosyalarını yükler
  uploadAsset: (projectId, file) => apiClient.upload(`/projects/${projectId}/upload`, file)
};

// Hem default olarak hem de parçalı olarak dışa aktarıyoruz ki EditorContext hata vermesin
export const { createProject, getProject, updateProject, deleteProject, exportVideo, uploadAsset } = projectService;
export default projectService;
