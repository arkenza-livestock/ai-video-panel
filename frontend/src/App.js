import axios from 'axios';

// Canlı sunucu IP'si ve kilitlediğimiz 3012 portu
const BASE_URL = "http://72.62.186.96:3012";

export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 60000, // Video işleme uzun sürebileceği için timeout süresini yüksek tutuyoruz
    headers: {
        'Content-Type': 'application/json'
    }
});

// Durum Kontrol İsteği
export const checkBackendStatus = async () => {
    try {
        const response = await api.get('/api/v1/status');
        return response.data;
    } catch (error) {
        console.error("Backend ulaşılamaz durumda:", error);
        throw error;
    }
};

// Video Export İsteği
export const triggerVideoExport = async (payload) => {
    try {
        const response = await api.post('/api/v1/export', payload);
        return response.data;
    } catch (error) {
        console.error("Video export katmanında hata:", error);
        throw error;
    }
};

export default BASE_URL;
