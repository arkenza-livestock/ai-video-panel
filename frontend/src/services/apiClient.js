// API Base URL - Localhost yerine canlı sunucu IP adresi ve portu tanımlandı
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://72.62.186.96:8000';

// API CLIENT CLASS
class APIClient {
  constructor(baseURL = API_BASE_URL) {
    // URL sonundaki '/' işaretini temizleyerek çift slash hatasını önlüyoruz
    this.baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    this.timeout = 30000;
  }

  // Generic fetch method
  async request(endpoint, options = {}) {
    // Endpoint'in başında '/' işareti olduğundan emin oluyoruz
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseURL}${formattedEndpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: this.timeout,
    };

    // Mevcut header'ları korumak için derin birleştirme (merge) yapıyoruz
    const config = { 
      ...defaultOptions, 
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `HTTP ${response.status}`,
        }));
        throw new Error(error.error || error.detail || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${formattedEndpoint}]:`, error);
      throw error;
    }
  }

  // GET
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // File Upload
  async upload(endpoint, file) {
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.baseURL}${formattedEndpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Upload Error [${formattedEndpoint}]:`, error);
      throw error;
    }
  }
}

export default new APIClient();
