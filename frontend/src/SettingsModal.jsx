import React, { useState } from 'react';
import { useEditor } from './context/EditorContext';
import './SettingsModal.css'; // Dosya isminiz farklıysa güncelleyin (örn: ProjectSettings.css)

function SettingsModal({ isOpen, onClose }) {
  const { projectSettings, updateProjectSettings } = useEditor();

  const [projectName, setProjectName] = useState(projectSettings?.projectName || 'Untitled Project');
  const [resolution, setResolution] = useState(projectSettings?.resolution || '1080p');
  const [frameRate, setFrameRate] = useState(projectSettings?.frameRate || 30);
  const [bitrate, setBitrate] = useState(projectSettings?.bitrate || 'High (Best quality)');
  const [audioFormat, setAudioFormat] = useState(projectSettings?.audioFormat || 'AAC (Better compression)');
  const [defaultVolume, setDefaultVolume] = useState(projectSettings?.defaultVolume || 80);
  const [theme, setTheme] = useState(projectSettings?.theme || 'Dark');

  // HATA DÜZELTİLDİ: Artık çöken dış onSave proplarına bağımlı değil!
  const handleSaveClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (updateProjectSettings) {
      updateProjectSettings({
        projectName,
        resolution,
        frameRate,
        bitrate,
        audioFormat,
        defaultVolume,
        theme
      });
    }

    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>⚙️ Project Settings</h3>
          <button className="close-x-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-content">
          {/* Project Info */}
          <div className="settings-section">
            <h4>📄 Project Info</h4>
            <label>Project Name</label>
            <input 
              type="text" 
              value={projectName} 
              onChange={(e) => setProjectName(e.target.value)} 
            />
          </div>

          {/* Video Settings */}
          <div className="settings-section">
            <h4>🎬 Video Settings</h4>
            <label>Resolution</label>
            <div className="btn-group">
              {['480p', '720p', '1080p', '4K'].map(res => (
                <button 
                  key={res} 
                  className={resolution === res ? 'active' : ''} 
                  onClick={() => setResolution(res)}
                >
                  {res}
                </button>
              ))}
            </div>

            <label>Frame Rate (FPS)</label>
            <div className="btn-group">
              {[24, 30, 60].map(fps => (
                <button 
                  key={fps} 
                  className={frameRate === fps ? 'active' : ''} 
                  onClick={() => setFrameRate(fps)}
                >
                  {fps}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Settings */}
          <div className="settings-section">
            <h4>🎵 Audio Settings</h4>
            <label>Default Volume ({defaultVolume}%)</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={defaultVolume} 
              onChange={(e) => setDefaultVolume(Number(e.target.value))} 
            />
          </div>

          {/* Appearance */}
          <div className="settings-section">
            <h4>🎨 Appearance</h4>
            <div className="btn-group">
              <button className={theme === 'Dark' ? 'active' : ''} onClick={() => setTheme('Dark')}>🌙 Dark</button>
              <button className={theme === 'Light' ? 'active' : ''} onClick={() => setTheme('Light')}>☀️ Light</button>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="cancel-settings-btn" onClick={onClose}>Cancel</button>
          <button className="save-settings-btn" onClick={handleSaveClick}>✓ Save</button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
