import apiClient from './apiClient';

// EXPORT ENDPOINTS
export const exportService = {
  // Start export - HATA DÜZELTİLDİ: /api/export yerine doğrudan backend'deki /export endpoint'ine yönlendirildi
  startExport: (exportRequest) => apiClient.post('/export', exportRequest),

  // Get export status
  getExportStatus: (exportId) => apiClient.get(`/export/${exportId}`),

  // Poll export status (for progress tracking)
  pollExportStatus: (exportId, interval = 1000, maxAttempts = 300) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const poll = async () => {
        try {
          const status = await exportService.getExportStatus(exportId);

          // Backend'den gelen 'success' durumuyla uyumlu hale getirildi
          if (status.status === 'success' || status.status === 'completed') {
            resolve(status);
          } else if (status.status === 'failed' || status.status === 'error') {
            reject(new Error(status.error || status.message || 'Export failed'));
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
