import apiClient from './apiClient';

// HEALTH CHECK
export const healthService = {
  // Check API health
  checkHealth: async () => {
    try {
      const response = await apiClient.get('/health');
      return {
        isHealthy: response.status === 'ok',
        response,
      };
    } catch (error) {
      return {
        isHealthy: false,
        error: error.message,
      };
    }
  },

  // Wait for API to be ready
  waitForAPI: async (maxAttempts = 30, interval = 1000) => {
    for (let i = 0; i < maxAttempts; i++) {
      const { isHealthy } = await healthService.checkHealth();
      if (isHealthy) return true;
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    return false;
  },
};

export default healthService;
