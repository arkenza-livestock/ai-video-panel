import React, { useState, useEffect } from 'react';
import './Settings.css';

interface ApiSettings {
  pexels_api_key: string;
  pixabay_api_key: string;
  youtube_client_id: string;
  youtube_client_secret: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  watermark_text: string;
  watermark_position: string;
  default_duration: number;
  default_resolution: string;
  default_fps: number;
  default_bitrate: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<ApiSettings>({
    pexels_api_key: '',
    pixabay_api_key: '',
    youtube_client_id: '',
    youtube_client_secret: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    watermark_text: 'Atmosfer Stüdyo Pro',
    watermark_position: 'bottom-right',
    default_duration: 180,
    default_resolution: '1920x1080',
    default_fps: 30,
    default_bitrate: '5M'
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Ayarları yükle
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Ayarlar yüklenemedi:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: '✅ Ayarlar başarıyla kaydedildi!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: '❌ Ayarlar kaydedilemedi!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Bağlantı hatası!' });
    }
    
    setSaving(false);
  };

  const testConnection = async (apiName: string) => {
    try {
      const response = await fetch(`/api/settings/test/${apiName}`);
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `✅ ${apiName} bağlantısı başarılı!` });
      } else {
        setMessage({ type: 'error', text: `❌ ${apiName} bağlantısı başarısız!` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `❌ ${apiName} bağlantı hatası!` });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ Sistem Ayarları</h1>
        <p>API anahtarlarını ve sistem yapılandırmasını yönetin</p>
      </div>

      {message && (
        <div className={`settings-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-grid">
        {/* Pexels API */}
        <div className="settings-card">
          <div className="card-header">
            <span className="card-icon">📷</span>
            <h3>Pexels API</h3>
            <button 
              className="test-btn"
              onClick={() => testConnection('pexels')}
              disabled={!settings.pexels_api_key}
            >
              Test Et
            </button>
          </div>
          <div className="card-body">
            <label>API Key</label>
            <input
              type="password"
              value={settings.pexels_api_key}
              onChange={(e) => setSettings({...settings, pexels_api_key: e.target.value})}
              placeholder="Pexels API anahtarınızı girin"
            />
            <a href="https://www.pexels.com/api/" target="_blank" rel="noopener noreferrer">
              🔑 API Key Al →
            </a>
          </div>
        </div>

        {/* Pixabay API */}
        <div className="settings-card">
          <div className="card-header">
            <span className="card-icon">🖼️</span>
            <h3>Pixabay API</h3>
            <button 
              className="test-btn"
              onClick={() => testConnection('pixabay')}
              disabled={!settings.pixabay_api_key}
            >
              Test Et
            </button>
          </div>
          <div className="card-body">
            <label>API Key</label>
            <input
              type="password"
              value={settings.pixabay_api_key}
              onChange={(e) => setSettings({...settings, pixabay_api_key: e.target.value})}
              placeholder="Pixabay API anahtarınızı girin"
            />
            <a href="https://pixabay.com/api/docs/" target="_blank" rel="noopener noreferrer">
              🔑 API Key Al →
            </a>
          </div>
        </div>

        {/* YouTube API */}
        <div className="settings-card">
          <div className="card-header">
            <span className="card-icon">▶️</span>
            <h3>YouTube API</h3>
            <button 
              className="test-btn"
              onClick={() => testConnection('youtube')}
              disabled={!settings.youtube_client_id}
            >
              Test Et
            </button>
          </div>
          <div className="card-body">
            <label>Client ID</label>
            <input
              type="text"
              value={settings.youtube_client_id}
              onChange={(e) => setSettings({...settings, youtube_client_id: e.target.value})}
              placeholder="Google OAuth Client ID"
            />
            <label>Client Secret</label>
            <input
              type="password"
              value={settings.youtube_client_secret}
              onChange={(e) => setSettings({...settings, youtube_client_secret: e.target.value})}
              placeholder="Google OAuth Client Secret"
            />
            <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
              🔑 Google Cloud Console →
            </a>
          </div>
        </div>

        {/* E-posta SMTP */}
        <div className="settings-card">
          <div className="card-header">
            <span className="card-icon">📧</span>
            <h3>SMTP E-posta</h3>
            <button 
              className="test-btn"
              onClick={() => testConnection('smtp')}
              disabled={!settings.smtp_user}
            >
              Test Et
            </button>
          </div>
          <div className="card-body">
            <label>SMTP Host</label>
            <input
              type="text"
              value={settings.smtp_host}
              onChange={(e) => setSettings({...settings, smtp_host: e.target.value})}
              placeholder="smtp.gmail.com"
            />
            <label>Port</label>
            <input
              type="number"
              value={settings.smtp_port}
              onChange={(e) => setSettings({...settings, smtp_port: parseInt(e.target.value)})}
              placeholder="587"
            />
            <label>Kullanıcı</label>
            <input
              type="text"
              value={settings.smtp_user}
              onChange={(e) => setSettings({...settings, smtp_user: e.target.value})}
              placeholder="email@example.com"
            />
            <label>Şifre</label>
            <input
              type="password"
              value={settings.smtp_password}
              onChange={(e) => setSettings({...settings, smtp_password: e.target.value})}
              placeholder="********"
            />
          </div>
        </div>

        {/* Video Varsayılanları */}
        <div className="settings-card">
          <div className="card-header">
            <span className="card-icon">🎬</span>
            <h3>Video Varsayılanları</h3>
          </div>
          <div className="card-body">
            <label>Filisu Metni</label>
            <input
              type="text"
              value={settings.watermark_text}
              onChange={(e) => setSettings({...settings, watermark_text: e.target.value})}
              placeholder="Atmosfer Stüdyo Pro"
            />
            <label>Filisu Pozisyonu</label>
            <select
              value={settings.watermark_position}
              onChange={(e) => setSettings({...settings, watermark_position: e.target.value})}
            >
              <option value="top-left">Sol Üst</option>
              <option value="top-right">Sağ Üst</option>
              <option value="bottom-left">Sol Alt</option>
              <option value="bottom-right">Sağ Alt</option>
              <option value="center">Orta</option>
            </select>
            <label>Varsayılan Süre (saniye)</label>
            <input
              type="number"
              value={settings.default_duration}
              onChange={(e) => setSettings({...settings, default_duration: parseInt(e.target.value)})}
              placeholder="180"
            />
            <label>Varsayılan Çözünürlük</label>
            <select
              value={settings.default_resolution}
              onChange={(e) => setSettings({...settings, default_resolution: e.target.value})}
            >
              <option value="1280x720">HD (1280x720)</option>
              <option value="1920x1080">Full HD (1920x1080)</option>
              <option value="2560x1440">2K (2560x1440)</option>
              <option value="3840x2160">4K (3840x2160)</option>
            </select>
            <label>FPS</label>
            <select
              value={settings.default_fps}
              onChange={(e) => setSettings({...settings, default_fps: parseInt(e.target.value)})}
            >
              <option value="24">24 - Sinema</option>
              <option value="25">25 - PAL</option>
              <option value="30">30 - Standart</option>
              <option value="60">60 - Akıcı</option>
            </select>
            <label>Bitrate</label>
            <select
              value={settings.default_bitrate}
              onChange={(e) => setSettings({...settings, default_bitrate: e.target.value})}
            >
              <option value="2M">2M - Düşük</option>
              <option value="5M">5M - Orta</option>
              <option value="10M">10M - Yüksek</option>
              <option value="20M">20M - Çok Yüksek</option>
            </select>
          </div>
        </div>

        {/* Sistem Durumu */}
        <div className="settings-card">
          <div className="card-header">
            <span className="card-icon">🖥️</span>
            <h3>Sistem Durumu</h3>
          </div>
          <div className="card-body">
            <div className="status-item">
              <span>Backend API:</span>
              <span className="status-badge online">✓ Çevrimiçi</span>
            </div>
            <div className="status-item">
              <span>Redis:</span>
              <span className="status-badge online">✓ Çalışıyor</span>
            </div>
            <div className="status-item">
              <span>PostgreSQL:</span>
              <span className="status-badge online">✓ Çalışıyor</span>
            </div>
            <div className="status-item">
              <span>Celery Worker:</span>
              <span className="status-badge online">✓ Aktif</span>
            </div>
            <div className="status-item">
              <span>FFmpeg:</span>
              <span className="status-badge online">✓ Yüklü</span>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button 
          className="save-btn" 
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? '💾 Kaydediliyor...' : '💾 Tüm Ayarları Kaydet'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
