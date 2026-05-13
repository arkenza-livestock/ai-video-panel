import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ============================================================================
// TIMELINE EDITOR COMPONENT
// ============================================================================

const TimelineEditor = ({ projectId, onLayersUpdate }) => {
  const [layers, setLayers] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timelineRef = useRef(null);

  // Fetch layers
  useEffect(() => {
    if (projectId) {
      fetchLayers();
    }
  }, [projectId]);

  const fetchLayers = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/layers`);
      setLayers(response.data.layers);
    } catch (error) {
      console.error('Error fetching layers:', error);
    }
  };

  const handleTimelineClick = (e) => {
    const rect = timelineRef.current.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    setPlayheadPosition(percentage * 100);
  };

  const deleteLayer = async (layerId) => {
    try {
      await axios.delete(`${API_URL}/projects/${projectId}/layers/${layerId}`);
      setLayers(layers.filter(l => l.id !== layerId));
    } catch (error) {
      console.error('Error deleting layer:', error);
    }
  };

  return (
    <div className="timeline-editor">
      <div className="timeline-header">
        <h3>📍 Timeline Editor</h3>
        <div className="timeline-controls">
          <button onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          <span className="playhead-time">{playheadPosition.toFixed(1)}%</span>
        </div>
      </div>

      <div className="timeline-canvas" ref={timelineRef} onClick={handleTimelineClick}>
        <div className="playhead" style={{ left: `${playheadPosition}%` }} />

        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className={`timeline-layer ${selectedLayer?.id === layer.id ? 'selected' : ''}`}
            onClick={() => setSelectedLayer(layer)}
            style={{
              left: `${(layer.start_time / 300) * 100}%`,
              width: `${((layer.end_time - layer.start_time) / 300) * 100}%`
            }}
          >
            <div className="layer-content">
              <span className="layer-icon">
                {layer.type === 'video' && '🎬'}
                {layer.type === 'audio' && '🎵'}
                {layer.type === 'image' && '🖼️'}
                {layer.type === 'text' && '📝'}
                {layer.type === 'effect' && '✨'}
              </span>
              <span className="layer-label">
                {layer.asset_id ? layer.asset_id.substring(0, 15) : layer.type}
              </span>
            </div>
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                deleteLayer(layer.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {selectedLayer && (
        <div className="layer-properties">
          <h4>Layer Properties</h4>
          <div className="property-group">
            <label>Start Time (s)</label>
            <input
              type="number"
              value={selectedLayer.start_time}
              onChange={(e) => {
                const updated = {
                  ...selectedLayer,
                  start_time: parseFloat(e.target.value)
                };
                setSelectedLayer(updated);
              }}
            />
          </div>
          <div className="property-group">
            <label>End Time (s)</label>
            <input
              type="number"
              value={selectedLayer.end_time}
              onChange={(e) => {
                const updated = {
                  ...selectedLayer,
                  end_time: parseFloat(e.target.value)
                };
                setSelectedLayer(updated);
              }}
            />
          </div>
          {selectedLayer.type === 'audio' && (
            <div className="property-group">
              <label>Volume</label>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedLayer.properties?.volume || 100}
                onChange={(e) => {
                  const updated = {
                    ...selectedLayer,
                    properties: {
                      ...selectedLayer.properties,
                      volume: parseInt(e.target.value)
                    }
                  };
                  setSelectedLayer(updated);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ASSET BROWSER COMPONENT
// ============================================================================

const AssetBrowser = ({ onAssetSelect }) => {
  const [assets, setAssets] = useState([]);
  const [activeTab, setActiveTab] = useState('uploads');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await axios.get(`${API_URL}/assets`);
      setAssets(response.data.assets);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API_URL}/assets/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setAssets([...assets, response.data]);
        onAssetSelect(response.data);
      }
    } catch (error) {
      console.error('Error uploading asset:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="asset-browser">
      <div className="asset-tabs">
        <button
          className={activeTab === 'uploads' ? 'active' : ''}
          onClick={() => setActiveTab('uploads')}
        >
          📤 Your Files
        </button>
        <button
          className={activeTab === 'free' ? 'active' : ''}
          onClick={() => setActiveTab('free')}
        >
          🌐 Free Libraries
        </button>
      </div>

      {activeTab === 'uploads' && (
        <div className="upload-section">
          <label className="upload-area">
            <input
              type="file"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              accept="image/*,audio/*,video/*"
            />
            <span>{uploading ? '⏳ Uploading...' : '📁 Click to upload files'}</span>
          </label>

          <div className="assets-grid">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="asset-card"
                onClick={() => onAssetSelect(asset)}
              >
                <div className="asset-preview">
                  {asset.type === 'image' && <img src={asset.url} alt={asset.filename} />}
                  {asset.type === 'audio' && <div>🎵 {asset.filename}</div>}
                  {asset.type === 'video' && <div>🎬 {asset.filename}</div>}
                </div>
                <div className="asset-info">
                  <span>{asset.filename}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'free' && (
        <div className="free-libraries">
          <h3>Telif-Free Kütüphaneler</h3>
          <div className="libraries-grid">
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="library-card">
              <span>📸 Unsplash</span>
              <small>Free High-Quality Images</small>
            </a>
            <a href="https://pexels.com" target="_blank" rel="noopener noreferrer" className="library-card">
              <span>📷 Pexels</span>
              <small>Free Stock Photos</small>
            </a>
            <a href="https://pixabay.com/music" target="_blank" rel="noopener noreferrer" className="library-card">
              <span>🎵 Pixabay Music</span>
              <small>Free Background Music</small>
            </a>
            <a href="https://bensound.com" target="_blank" rel="noopener noreferrer" className="library-card">
              <span>🎼 Bensound</span>
              <small>Royalty-Free Music</small>
            </a>
            <a href="https://freesound.org" target="_blank" rel="noopener noreferrer" className="library-card">
              <span>🔊 Freesound</span>
              <small>Sound Effects</small>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EFFECTS PANEL
// ============================================================================

const EffectsPanel = ({ selectedLayer, onEffectAdd }) => {
  const effects = [
    { id: 'zoom', name: 'Zoom', icon: '🔍' },
    { id: 'fade', name: 'Fade', icon: '⚫' },
    { id: 'blur', name: 'Blur', icon: '👁️' },
    { id: 'color_grade', name: 'Color Grade', icon: '🎨' },
    { id: 'slow_motion', name: 'Slow Motion', icon: '🐌' },
    { id: 'speed_up', name: 'Speed Up', icon: '⚡' },
    { id: 'glow', name: 'Glow', icon: '✨' },
    { id: 'sepia', name: 'Sepia', icon: '🟤' }
  ];

  if (!selectedLayer) {
    return <div className="effects-panel empty">Select a layer to add effects</div>;
  }

  return (
    <div className="effects-panel">
      <h3>✨ Effects</h3>
      <div className="effects-grid">
        {effects.map((effect) => (
          <button
            key={effect.id}
            className="effect-btn"
            onClick={() => onEffectAdd(effect.id)}
            title={effect.name}
          >
            <span className="effect-icon">{effect.icon}</span>
            <span className="effect-name">{effect.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// EXPORT DIALOG
// ============================================================================

const ExportDialog = ({ projectId, onClose }) => {
  const [settings, setSettings] = useState({
    quality: 'high',
    format: 'mp4',
    youtube_optimize: false,
    watermark: false
  });
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await axios.post(`${API_URL}/projects/${projectId}/export`, settings);
      alert(`✅ Video rendering started!\nJob ID: ${response.data.job_id}`);
      onClose();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>🎬 Export Video</h2>

        <div className="export-options">
          <div className="option-group">
            <label>📊 Quality</label>
            <select
              value={settings.quality}
              onChange={(e) => setSettings({ ...settings, quality: e.target.value })}
            >
              <option value="low">Low (Web)</option>
              <option value="medium">Medium (Social Media)</option>
              <option value="high">High (YouTube)</option>
              <option value="4k">4K (Cinema)</option>
            </select>
          </div>

          <div className="option-group">
            <label>📁 Format</label>
            <select
              value={settings.format}
              onChange={(e) => setSettings({ ...settings, format: e.target.value })}
            >
              <option value="mp4">MP4 (Universal)</option>
              <option value="webm">WebM (Web)</option>
              <option value="mov">MOV (Mac/Cinema)</option>
            </select>
          </div>

          <div className="option-group checkbox">
            <input
              type="checkbox"
              checked={settings.youtube_optimize}
              onChange={(e) =>
                setSettings({ ...settings, youtube_optimize: e.target.checked })
              }
            />
            <label>Optimize for YouTube</label>
          </div>

          <div className="option-group checkbox">
            <input
              type="checkbox"
              checked={settings.watermark}
              onChange={(e) => setSettings({ ...settings, watermark: e.target.checked })}
            />
            <label>Add Watermark</label>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button onClick={handleExport} className="export-btn" disabled={exporting}>
            {exporting ? '⏳ Exporting...' : '🚀 Export'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APP
// ============================================================================

function App() {
  const [currentPage, setCurrentPage] = useState('projects'); // projects, editor
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('savaş');
  const [showExportDialog, setShowExportDialog] = useState(false);

  useEffect(() => {
    if (currentPage === 'projects') {
      fetchProjects();
    }
  }, [currentPage]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects`);
      setProjects(response.data.projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const createProject = async () => {
    if (!newProjectTitle.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/projects`, {
        title: newProjectTitle,
        category: selectedCategory,
        duration: 300
      });

      setSelectedProject({
        project_id: response.data.project_id,
        title: response.data.title,
        category: response.data.category
      });
      setCurrentPage('editor');
      setNewProjectTitle('');
    } catch (error) {
      alert(`Error creating project: ${error.message}`);
    }
  };

  // Projects Page
  if (currentPage === 'projects') {
    return (
      <div className="app projects-page">
        <header className="app-header">
          <h1>🎬 ATMOSFER STÜDYO PRO</h1>
          <p>Professional Video Editor - Timeline, Effects, Assets & More</p>
        </header>

        <div className="projects-container">
          <div className="new-project-card">
            <h2>✨ Create New Project</h2>

            <input
              type="text"
              placeholder="Project Title (e.g., Samuray vs Şövalye)"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              className="project-title-input"
            />

            <div className="category-selector">
              <label>🎥 Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="savaş">⚔️ Savaş (Samuray, Şövalye)</option>
                <option value="uyku">🌙 Uyku Ambiyansı</option>
                <option value="müzik_klip">🎵 Müzik Klibi</option>
                <option value="podcast">🎙️ Podcast</option>
                <option value="sinematik">🎬 Sinematik</option>
                <option value="doğa">🌿 Doğa & Travel</option>
                <option value="tütöryial">📚 Tütöryial</option>
              </select>
            </div>

            <button onClick={createProject} className="create-btn">
              🚀 Create Project
            </button>
          </div>

          <div className="projects-grid">
            <h2>📂 Recent Projects ({projects.length})</h2>
            {projects.length === 0 ? (
              <p className="empty-state">No projects yet. Create one to get started!</p>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="project-card"
                  onClick={() => {
                    setSelectedProject(project);
                    setCurrentPage('editor');
                  }}
                >
                  <div className="project-icon">
                    {project.category === 'savaş' && '⚔️'}
                    {project.category === 'uyku' && '🌙'}
                    {project.category === 'müzik_klip' && '🎵'}
                    {project.category === 'podcast' && '🎙️'}
                    {project.category === 'sinematik' && '🎬'}
                  </div>
                  <h3>{project.title}</h3>
                  <p>{project.category}</p>
                  <small>{new Date(project.created_at).toLocaleDateString()}</small>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Editor Page
  return (
    <div className="app editor-page">
      <header className="editor-header">
        <button onClick={() => setCurrentPage('projects')} className="back-btn">
          ← Back to Projects
        </button>
        <h1>{selectedProject?.title}</h1>
        <div className="header-actions">
          <button onClick={() => setShowExportDialog(true)} className="export-btn">
            🎬 Export
          </button>
          <button className="save-btn">💾 Save</button>
        </div>
      </header>

      <div className="editor-container">
        <aside className="left-panel">
          <AssetBrowser onAssetSelect={(asset) => console.log('Selected:', asset)} />
        </aside>

        <main className="center-panel">
          <TimelineEditor
            projectId={selectedProject?.project_id}
            onLayersUpdate={() => {}}
          />
          <div className="preview-panel">
            <div className="preview-placeholder">
              <p>👁️ Preview</p>
              <p style={{ fontSize: '12px', color: '#888' }}>
                Video preview will appear here
              </p>
            </div>
          </div>
        </main>

        <aside className="right-panel">
          <EffectsPanel onEffectAdd={(effectId) => console.log('Add:', effectId)} />
        </aside>
      </div>

      {showExportDialog && (
        <ExportDialog
          projectId={selectedProject?.project_id}
          onClose={() => setShowExportDialog(false)}
        />
      )}
    </div>
  );
}

export default App;
