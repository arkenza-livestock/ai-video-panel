import React, { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import AudioMixer from '../AudioMixer'; // Dosya yolu bir üst klasöre çıkacak şekilde güncellendi
import '../styles/Inspector.css';

function Inspector() {
  const {
    timeline,
    selectedClip,
    setSelectedClip,
    selectedEffect,
    setSelectedEffect,
    projectSettings,
    setProjectSettings,
    applyEffect,
    duration,
    setDuration,
  } = useEditor();

  const effects = [
    { id: 1, name: 'Fade In', icon: '✨' },
    { id: 2, name: 'Fade Out', icon: '✨' },
    { id: 3, name: 'Zoom', icon: '🔍' },
    { id: 4, name: 'Blur', icon: '🌫️' },
    { id: 5, name: 'Speed Up', icon: '⚡' },
    { id: 6, name: 'Color Grade', icon: '🎨' },
  ];

  const handleApplyEffect = () => {
    if (!selectedClip || !selectedEffect) return;
    applyEffect(selectedClip.id, selectedEffect);
    setSelectedClip({ ...selectedClip, effects: [...selectedClip.effects, selectedEffect] });
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSettingChange = (key, value) => {
    setProjectSettings({ ...projectSettings, [key]: value });
  };

  return (
    <aside className="sidebar sidebar-right">
      
      {selectedClip ? (
        <>
          {/* CLIP INFO */}
          <div className="panel">
            <h3>📋 Clip Info</h3>
            <div className="clip-info-grid">
              <div className="info-item">
                <label>Name</label>
                <p>{selectedClip.name}</p>
              </div>
              <div className="info-item">
                <label>Type</label>
                <p>{selectedClip.type === 'video' ? '🎬 Video' : '🎵 Audio'}</p>
              </div>
              <div className="info-item">
                <label>Duration</label>
                <p>{formatTime(selectedClip.duration)}</p>
              </div>
              <div className="info-item">
                <label>Start Time</label>
                <p>{formatTime(selectedClip.startTime)}</p>
              </div>
              <div className="info-item full-width">
                <label>Volume</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  defaultValue={selectedClip.volume}
                  className="volume-slider"
                />
                <span className="volume-label">{selectedClip.volume}%</span>
              </div>
            </div>
          </div>

          {/* EFFECTS PANEL */}
          <div className="panel">
            <h3>✨ Add Effects</h3>
            <div className="effects-grid">
              {effects.map(effect => (
                <button
                  key={effect.id}
                  className={`effect-btn ${selectedEffect?.id === effect.id ? 'active' : ''}`}
                  onClick={() => setSelectedEffect(effect)}
                  title={effect.name}
                >
                  <span>{effect.icon}</span>
                  <span className="effect-name">{effect.name}</span>
                </button>
              ))}
            </div>
            <button className="apply-effect-btn" onClick={handleApplyEffect}>
              ➕ Apply Effect
            </button>
          </div>

          {/* APPLIED EFFECTS */}
          <div className="panel">
            <h3>📊 Applied Effects</h3>
            {selectedClip.effects && selectedClip.effects.length > 0 ? (
              <div className="effects-list">
                {selectedClip.effects.map((eff, i) => (
                  <div key={i} className="effect-badge">
                    <span>{eff.icon} {eff.name}</span>
                    <button 
                      className="remove-effect"
                      onClick={() => {
                        const newEffects = selectedClip.effects.filter((_, idx) => idx !== i);
                        setSelectedClip({ ...selectedClip, effects: newEffects });
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No effects applied</p>
            )}
          </div>
        </>
      ) : (
        <>
          {/* AUDIO MIXER */}
          <AudioMixer clips={timeline} />

          {/* SHORTCUTS */}
          <div className="panel">
            <h3>⌨️ Keyboard Shortcuts</h3>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <kbd>Space</kbd>
                <span>Play/Pause</span>
              </div>
              <div className="shortcut-item">
                <kbd>Del</kbd>
                <span>Delete clip</span>
              </div>
              <div className="shortcut-item">
                <kbd>←/→</kbd>
                <span>Seek</span>
              </div>
              <div className="shortcut-item">
                <kbd>D</kbd>
                <span>Deselect</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+Z</kbd>
                <span>Undo</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+Y</kbd>
                <span>Redo</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+E</kbd>
                <span>Export</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+,</kbd>
                <span>Settings</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* PROJECT SETTINGS */}
      <div className="panel">
        <h3>⚙️ Project Settings</h3>
        <div className="settings-group">
          <label>Project Name</label>
          <input 
            type="text"
            value={projectSettings.projectName}
            onChange={(e) => handleSettingChange('projectName', e.target.value)}
            className="setting-input"
          />
        </div>

        <div className="settings-group">
          <label>Duration (seconds)</label>
          <input 
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="setting-input"
            min="10"
            max="3600"
          />
        </div>
        
        <div className="settings-group">
          <label>FPS</label>
          <select 
            value={projectSettings.fps}
            onChange={(e) => handleSettingChange('fps', parseInt(e.target.value))}
            className="setting-select"
          >
            <option value={24}>24 FPS</option>
            <option value={30}>30 FPS</option>
            <option value={60}>60 FPS</option>
          </select>
        </div>

        <div className="settings-group">
          <label>Resolution</label>
          <select 
            value={projectSettings.resolution}
            onChange={(e) => handleSettingChange('resolution', e.target.value)}
            className="setting-select"
          >
            <option value="480p">480p</option>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
            <option value="4K">4K</option>
          </select>
        </div>

        <div className="settings-group">
          <label>Bitrate</label>
          <select 
            value={projectSettings.bitrate}
            onChange={(e) => handleSettingChange('bitrate', e.target.value)}
            className="setting-select"
          >
            <option value="low">Low (2 Mbps)</option>
            <option value="medium">Medium (6 Mbps)</option>
            <option value="high">High (12 Mbps)</option>
          </select>
        </div>

        <div className="settings-group">
          <label>Audio Format</label>
          <select 
            value={projectSettings.audioFormat}
            onChange={(e) => handleSettingChange('audioFormat', e.target.value)}
            className="setting-select"
          >
            <option value="aac">AAC</option>
            <option value="mp3">MP3</option>
            <option value="flac">FLAC</option>
          </select>
        </div>
      </div>
    </aside>
  );
}

export default Inspector;
