import apiClient from './apiClient';

// Projenizdeki mevcut export fonksiyonunu bununla güncelleyin:
export const exportProjectVideo = async (projectId, settings = {}) => {
  try {
    // HATA DÜZELTİLDİ: Ayrı bir fetch ve yanlış port/endpoint kullanmak yerine,
    // doğrudan bizim tanımladığımız /export endpoint'ine apiClient ile güvenli istek atıyoruz.
    const response = await apiClient.post('/export', {
      projectId: projectId || "yeni_proje",
      fps: settings.fps || 30,
      assets: settings.assets || [] // Eğer ayarlar içinde elementler varsa gönderir
    });

    return response; // Backend'den dönen başarılı sonucu teslim et
  } catch (error) {
    console.error("Export API Error:", error);
    throw error;
  }
};

// Dosyanın altındaki export default listesine eklemeyi unutmayın:
const projectService = {
  // ... diğer mevcut fonksiyonlarınız (getProjects, loadProject vb. buraya gelecek)
  exportProjectVideo,
};

export default projectService;
