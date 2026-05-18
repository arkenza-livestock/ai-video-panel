// Projenizdeki mevcut export fonksiyonunu bununla güncelleyin:
export const exportProjectVideo = async (projectId, settings = {}) => {
  // Docker compose dosyasında backend'i 8002 portuna bağladığımız için istekleri oraya yönlendiriyoruz
  const API_BASE_URL = "http://72.62.186.96:8002"; 
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings }),
    });

    if (!response.ok) {
      throw new Error(`Export işlemi başarısız oldu: ${response.statusText}`);
    }

    return await response.json(); // Backend'den dönen başarılı sonucu teslim et
  } catch (error) {
    console.error("Export API Error:", error);
    throw error;
  }
};

// Dosyanın altındaki export default listesine eklemeyi unutmayın:
const projectService = {
  // ... diğer mevcut fonksiyonlarınız (getProjects, loadProject vb.)
  exportProjectVideo,
};
export default projectService;
