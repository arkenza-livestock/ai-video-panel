import apiClient from './apiClient';

/**
 * Atmosfer Studio - Proje Yönetim Servisi
 * Tüm endpoint'ler 'network_mode: host' mimarisine uygun olarak
 * apiClient üzerinden doğrudan merkez sunucuya yönlendirilir.
 */

// Yeni bir proje oluşturur
export const createProject = async (projectData) => {
  return await apiClient.post('/api/projects', projectData);
};

// Mevcut tüm projeleri listeler
export const getProjects = async () => {
  return await apiClient.get('/api/projects');
};

// ID değerine göre tek bir projenin detaylarını getirir
export const getProject = async (projectId) => {
  return await apiClient.get(`/api/projects/${projectId}`);
};

// Proje verilerini (timeline, assetler vb.) günceller ve kaydeder
export const updateProject = async (projectId, projectData) => {
  return await apiClient.put(`/api/projects/${projectId}`, projectData);
};

// Projeyi sunucudan ve veritabanından tamamen siler
export const deleteProject = async (projectId) => {
  return await apiClient.delete(`/api/projects/${projectId}`);
};

// Projenin render/export sürecini başlatır
export const exportVideo = async (projectId, exportSettings) => {
  return await apiClient.post(`/api/projects/${projectId}/export`, exportSettings);
};

// EditorContext veya eski bileşenlerde bu isimle çağrıldıysa çökmesin diye alias (takma ad) ekliyoruz
export const exportProjectVideo = exportVideo;

// Hem isimlendirilmiş (named) hem de obje (default) olarak export ediyoruz
const projectService = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  exportVideo,
  exportProjectVideo
};

export default projectService;
