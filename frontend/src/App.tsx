import React, { useState, useEffect } from 'react';
import './App.css';

// TypeScript Interfaces
interface Project {
  id: string;
  name: string;
  category: string;
  template: string | null;
  created_at: string;
  status: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface Template {
  id: string;
  name: string;
  duration: number;
  preview: string;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [activeTab, setActiveTab] = useState<'categoria' | 'projeto' | 'editar' | 'exportar'>('categoria');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);

  const categories: Category[] = [
    { id: 'sleep', name: 'Uyku Ambiyansı', icon: '🌙', description: 'Huzurlu uyku için 3 saatlik atmosfer' },
    { id: 'book', name: 'Kitap Okuma', icon: '📖', description: 'Sayfa sesi ve hafif klasik müzik' },
    { id: 'journey', name: 'Yolculuk', icon: '🚂', description: 'Tren, vapur ve gece yolculukları' },
    { id: 'war', name: 'Savaş', icon: '⚔️', description: 'Epik savaş atmosferi ve müzikler' },
    { id: 'meditation', name: 'Meditasyon', icon: '🧘', description: 'Doğa sesleri ile derin meditasyon' },
    { id: 'study', name: 'Ders Çalışma', icon: '📚', description: 'Odaklanma için lo-fi ve beyaz gürültü' }
  ];

  // Kategori seçildiğinde şablonları getir
  useEffect(() => {
    if (selectedCategory) {
      fetch(`${API_URL}/api/templates?category=${selectedCategory}`)
        .then(res => res.json())
        .then(data => setTemplates(data.templates || []))
        .catch(err => console.error('Şablon yüklenemedi:', err));
    }
  }, [selectedCategory]);

  // Proje oluştur
  const createProject = async () => {
    if (!selectedCategory) {
      alert('Lütfen bir kategori seçin');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', projectName || `${selectedCategory}_projesi`);
      formData.append('category', selectedCategory);
      if (selectedTemplate) formData.append('template', selectedTemplate);

      const response = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setProject(data.project);
      setActiveTab('editar');
    } catch (error) {
      console.error('Proje oluşturulamadı:', error);
      alert('Proje oluşturulurken hata oluştu');
    }
    setLoading(false);
  };

  // Videoyu render et
  const renderVideo = async () => {
    if (!project) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/render/${project.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          output_format: 'mp4',
          resolution: '1920x1080',
          fps: 30,
          bitrate: '5M',
          include_watermark: true,
          upload_to_youtube: false
        })
      });
      const data = await response.json();
      setJobId(data.job_id);
      setActiveTab('exportar');
      
      // Durumu takip et
      checkJobStatus(data.job_id);
    } catch (error) {
      console.error('Render başlatılamadı:', error);
      alert('Video oluşturulurken hata oluştu');
    }
    setLoading(false);
  };

  // İş durumunu kontrol et
  const checkJobStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/render/status/${id}`);
        const data = await response.json();
        setJobStatus(data.status);
        if (data.status === 'completed') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Durum kontrol edilemedi:', error);
      }
    }, 2000);
  };

  // Videoyu indir
  const downloadVideo = () => {
    if (jobId) {
      window.open(`${API_URL}/api/render/download/${jobId}`, '_blank');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🎬</span>
          <span className="logo-text">Atmosfer Stüdyo</span>
          <span className="logo-badge">PRO</span>
        </div>
        <nav className="nav">
          <button 
            className={`nav-btn ${activeTab === 'categoria' ? 'active' : ''}`}
            onClick={() => setActiveTab('categoria')}
          >
            📁 Kategoriler
          </button>
          <button 
            className={`nav-btn ${activeTab === 'projeto' ? 'active' : ''}`}
            onClick={() => setActiveTab('projeto')}
            disabled={!selectedCategory}
          >
            🎨 Proje Oluştur
          </button>
          <button 
            className={`nav-btn ${activeTab === 'editar' ? 'active' : ''}`}
            onClick={() => setActiveTab('editar')}
            disabled={!project}
          >
            ✂️ Düzenle
          </button>
          <button 
            className={`nav-btn ${activeTab === 'exportar' ? 'active' : ''}`}
            onClick={() => setActiveTab('exportar')}
            disabled={!jobId}
          >
            📤 Export
          </button>
        </nav>
      </header>

      <main className="main">
        {/* Kategori Seçim Ekranı */}
        {activeTab === 'categoria' && (
          <div className="categories-section">
            <h1>Kategori Seç</h1>
            <p className="subtitle">Hangi tür video oluşturmak istiyorsunuz?</p>
            <div className="categories-grid">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className={`category-card ${selectedCategory === cat.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <div className="category-icon">{cat.icon}</div>
                  <h3>{cat.name}</h3>
                  <p>{cat.description}</p>
                </div>
              ))}
            </div>
            {selectedCategory && (
              <button className="btn-primary" onClick={() => setActiveTab('projeto')}>
                Devam Et →
              </button>
            )}
          </div>
        )}

        {/* Proje Oluşturma Ekranı */}
        {activeTab === 'projeto' && (
          <div className="project-section">
            <h1>Yeni Proje Oluştur</h1>
            <div className="form-group">
              <label>Proje Adı</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Örn: Huzurlu Gece Ambiyansı"
              />
            </div>

            <div className="templates-section">
              <h3>Şablon Seç (Opsiyonel)</h3>
              <div className="templates-grid">
                <div
                  className={`template-card ${selectedTemplate === null ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(null)}
                >
                  <div className="template-icon">✨</div>
                  <h4>Boş Başlat</h4>
                  <p>Sıfırdan kendi videonu oluştur</p>
                </div>
                {templates.map(tpl => (
                  <div
                    key={tpl.id}
                    className={`template-card ${selectedTemplate === tpl.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTemplate(tpl.id)}
                  >
                    <div className="template-icon">🎬</div>
                    <h4>{tpl.name}</h4>
                    <p>{tpl.duration} dakika</p>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={createProject} disabled={loading}>
              {loading ? 'Oluşturuluyor...' : 'Proje Oluştur →'}
            </button>
          </div>
        )}

        {/* Düzenleme Ekranı (Basit) */}
        {activeTab === 'editar' && project && (
          <div className="edit-section">
            <h1>Proje: {project.name}</h1>
            <div className="preview-area">
              <div className="preview-placeholder">
                <span>🎬</span>
                <p>Video Önizleme Alanı</p>
                <small>Burada timeline editör olacak</small>
              </div>
            </div>
            <div className="edit-controls">
              <div className="control-group">
                <label>Süre (saniye)</label>
                <input type="number" defaultValue="180" min="10" max="3600" />
              </div>
              <div className="control-group">
                <label>Müzik Tipi</label>
                <select>
                  <option>Lo-fi Piyano</option>
                  <option>Ambient Drone</option>
                  <option>Klasik Gitar</option>
                  <option>Sessiz</option>
                </select>
              </div>
              <div className="control-group">
                <label>Ses Seviyesi</label>
                <input type="range" min="0" max="100" defaultValue="70" />
              </div>
            </div>
            <button className="btn-primary" onClick={renderVideo} disabled={loading}>
              {loading ? 'Render Ediliyor...' : 'Videoyu Oluştur →'}
            </button>
          </div>
        )}

        {/* Export Ekranı */}
        {activeTab === 'exportar' && (
          <div className="export-section">
            <h1>Video Hazırlanıyor</h1>
            <div className="status-card">
              <div className="status-icon">
                {jobStatus === 'completed' ? '✅' : jobStatus === 'processing' ? '🎬' : '⏳'}
              </div>
              <div className="status-text">
                {jobStatus === 'completed' && 'Video hazır!'}
                {jobStatus === 'processing' && 'Video oluşturuluyor...'}
                {!jobStatus && 'Kuyrukta bekliyor...'}
              </div>
              {jobStatus === 'completed' && (
                <button className="btn-success" onClick={downloadVideo}>
                  📥 Videoyu İndir
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Atmosfer Stüdyo Pro © 2024 - Profesyonel Video Düzenleme</p>
      </footer>
    </div>
  );
}

export default App;
