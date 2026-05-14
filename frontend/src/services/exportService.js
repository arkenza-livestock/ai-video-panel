import apiClient from './apiClient';

// EXPORT ENDPOINTS
export const exportService = {
  // Start export
  startExport: (exportRequest) => apiClient.post('/api/export', exportRequest),

  // Get export status
  getExportStatus: (exportId) => apiClient.get(`/api/export/${exportId}`),

  // Poll export status (for progress tracking)
  pollExportStatus: (exportId, interval = 1000, maxAttempts = 300) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const poll = async () => {
        try {
          const status = await exportService.getExportStatus(exportId);

          if (status.status === 'completed') {
            resolve(status);
          } else if (status.status === 'failed') {
            reject(new Error(status.error || 'Export failed'));
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, interval);
          } else {
            reject(new Error('Export timeout'));
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  },
};

export default exportService;
