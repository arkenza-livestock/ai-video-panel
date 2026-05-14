import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState('sleep');
  const [formData, setFormData] = useState({
    title: '',
    story_text: '',
    duration_hours: 3,
    music_type: 'piano',
    rain_intensity: 'medium'
  });
  const [jobId, setJobId] = useState(null);
  const [loading, setLoading] = useState(false);

  const formats = [
    { id: 'sleep', name: '🌙 Uyku Ambiyansı', duration: 3, icon: '🌙' },
    { id: 'book', name: '📖 Kitap Okuma', duration: 1, icon: '📖' },
    { id: 'journey', name: '🚂 Yolculuk', duration: 3, icon: '🚂' }
  ];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/create-job`, {
        format: selectedFormat,
        ...formData
      });
      setJobId(response.data.job_id);
      alert(`Video oluşturma başladı! İş ID: ${response.data.job_id}`);
    } catch (error) {
      console.error('Hata:', error);
      alert('Bir hata oluştu!');
    }
    setLoading(false);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🌙 Atmosfer Stüdyo</h1>
        <p>Uyku, kitap ve yolculuk için otomatik video üretici</p>
      </header>

      <div className="format-selector">
        {formats.map(format => (
          <button
            key={format.id}
            className={`format-btn ${selectedFormat === format.id ? 'active' : ''}`}
            onClick={() => {
              setSelectedFormat(format.id);
              setFormData({ ...formData, duration_hours: format.duration });
            }}
          >
            <span className="format-icon">{format.icon}</span>
            <span className="format-name">{format.name}</span>
          </button>
        ))}
      </div>

      <div className="tabs">
        <button className={activeTab === 0 ? 'active' : ''} onClick={() => setActiveTab(0)}>
          ✍️ Hikaye
        </button>
        <button className={activeTab === 1 ? 'active' : ''} onClick={() => setActiveTab(1)}>
          🎵 Ses/Müzik
        </button>
        <button className={activeTab === 2 ? 'active' : ''} onClick={() => setActiveTab(2)}>
          ⏰ Zamanlama
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 0 && (
          <div className="story-tab">
            <input
              type="text"
              placeholder="Video Başlığı"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
            />
            <textarea
              placeholder="Hikaye metni (ilk 20 saniyede görünecek)"
              rows="5"
              value={formData.story_text}
              onChange={(e) => setFormData({ ...formData, story_text: e.target.value })}
              className="textarea"
            />
          </div>
        )}

        {activeTab === 1 && (
          <div className="audio-tab">
            <label>Müzik Tipi</label>
            <select
              value={formData.music_type}
              onChange={(e) => setFormData({ ...formData, music_type: e.target.value })}
              className="select"
            >
              <option value="piano">🎹 Lo-fi Piyano</option>
              <option value="drone">🌊 Ambient Drone</option>
              <option value="classical">🎻 Klasik</option>
              <option value="silent">🔇 Sessiz</option>
            </select>

            <label>Yağmur Şiddeti</label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.rain_intensity === 'light' ? 30 : formData.rain_intensity === 'medium' ? 60 : 90}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                const intensity = val < 45 ? 'light' : val < 75 ? 'medium' : 'heavy';
                setFormData({ ...formData, rain_intensity: intensity });
              }}
              className="slider"
            />
          </div>
        )}

        {activeTab === 2 && (
          <div className="schedule-tab">
            <label>Süre (saat)</label>
            <input
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={formData.duration_hours}
              onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) })}
              className="input"
            />
            
            <button 
              onClick={handleSubmit} 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? '🎬 Oluşturuluyor...' : '🎥 Video Oluştur'}
            </button>

            {jobId && (
              <div className="job-info">
                <p>✅ İş ID: {jobId}</p>
                <a href={`${API_URL}/job-status/${jobId}`}>Durumu kontrol et</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
