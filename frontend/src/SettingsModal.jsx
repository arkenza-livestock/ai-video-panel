import React, { useState } from 'react';
import './SettingsModal.css';

function SettingsModal({ isOpen, onClose, onSave, projectSettings }) {
  const [settings, setSettings] = useState(projectSettings || {
    projectName: 'Untitled Project',
    fps: 30,
    resolution: '1080p',
    bitrate: 'high',
    audioFormat: 'aac',
    theme: 'dark',
  });

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Project Settings</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          
          {/* PROJECT INFO */}
          <div className="settings-section">
            <h3>📋 Project Info</h3>
            <div className="setting-item">
              <label>Project Name</label>
              <input 
                type="text" 
                value={settings.projectName}
                onChange={(e) => handleChange('projectName', e.target.value)}
                placeholder="Enter project name"
              />
            </div>
          </div>

          {/* VIDEO SETTINGS */}
          <div className="settings-section">
            <h3>🎬 Video Settings</h3>
            
            <div className="setting-item">
              <label>Resolution</label>
              <div className="option-group">
                {['480p', '720p', '1080p', '4K'].map(res => (
                  <button
                    key={res}
                    className={`option-btn ${settings.resolution === res ? 'active' : ''}`}
                    onClick={() => handleChange('resolution', res)}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-item">
              <label>Frame Rate (FPS)</label>
              <div className="option-group">
                {[24, 30, 60].map(fps => (
                  <button
                    key={fps}
                    className={`option-btn ${settings.fps === fps ? 'active' : ''}`}
                    onClick={() => handleChange('fps', fps)}
                  >
                    {fps}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-item">
              <label>Bitrate</label>
              <select 
                value={settings.bitrate}
                onChange={(e) => handleChange('bitrate', e.target.value)}
              >
                <option value="low">Low (Smaller file)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Best quality)</option>
              </select>
            </div>
          </div>

          {/* AUDIO SETTINGS */}
          <div className="settings-section">
            <h3>🎵 Audio Settings</h3>
            
            <div className="setting-item">
              <label>Audio Format</label>
              <select 
                value={settings.audioFormat}
                onChange={(e) => handleChange('audioFormat', e.target.value)}
              >
                <option value="aac">AAC (Better compression)</option>
                <option value="mp3">MP3 (Universal)</option>
                <option value="flac">FLAC (Lossless)</option>
              </select>
            </div>

            <div className="setting-item">
              <label>Default Volume</label>
              <div className="volume-slider">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  defaultValue="80"
                  className="slider"
                />
                <span>80%</span>
              </div>
            </div>
          </div>

          {/* UI SETTINGS */}
          <div className="settings-section">
            <h3>🎨 Appearance</h3>
            
            <div className="setting-item">
              <label>Theme</label>
              <div className="option-group">
                {['dark', 'light'].map(theme => (
                  <button
                    key={theme}
                    className={`option-btn ${settings.theme === theme ? 'active' : ''}`}
                    onClick={() => handleChange('theme', theme)}
                  >
                    {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* KEYBOARD SHORTCUTS */}
          <div className="settings-section">
            <h3>⌨️ Keyboard Shortcuts</h3>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span>Play/Pause</span>
                <code>Space</code>
              </div>
              <div className="shortcut-item">
                <span>Delete Clip</span>
                <code>Del</code>
              </div>
              <div className="shortcut-item">
                <span>Undo</span>
                <code>Ctrl+Z</code>
              </div>
              <div className="shortcut-item">
                <span>Redo</span>
                <code>Ctrl+Y</code>
              </div>
              <div className="shortcut-item">
                <span>Export</span>
                <code>Ctrl+E</code>
              </div>
              <div className="shortcut-item">
                <span>Settings</span>
                <code>Ctrl+,</code>
              </div>
            </div>
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn-reset" onClick={() => setSettings(projectSettings)}>
            ↺ Reset
          </button>
          <div>
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-save" onClick={handleSave}>
              ✓ Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
