import apiClient from './apiClient';

// Check API health
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return {
      isHealthy: response.status === 'ok' || response.status === 'healthy',
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
