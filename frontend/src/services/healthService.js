import apiClient from './apiClient';

// Check API health
export const checkHealth = async () => {
  try {
    // HATA DÜZELTİLDİ: Tanımlı olmayan /health yerine backend'in ana dizinine (/) istek atıyoruz
    const response = await apiClient.get('/');
    
    // Backend ana dizinden {"Hello": "World"} döndüğü için response veya response.Hello kontrolü yeterlidir
    return {
      isHealthy: !!response, 
      response,
    };
  } catch (error) {
    return {
      isHealthy: false,
      error: error.message,
    };
  }
};

// Wait for API to be ready
export const waitForAPI = async (maxAttempts = 30, interval = 1000) => {
  for (let i = 0; i < maxAttempts; i++) {
    const { isHealthy } = await checkHealth();
    if (isHealthy) return true;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return false;
};

// Hem tek tek fonksiyon olarak (named export) hem de toplu nesne (default export) olarak dışa aktarıyoruz
const healthService = {
  checkHealth,
  waitForAPI,
};

export default healthService;
