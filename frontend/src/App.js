import React, { useState } from 'react';
import './App.css';

function App() {
  const [timeline, setTimeline] = useState([]);
  const [selectedClip, setSelectedClip] = useState(null);
  const [draggedAsset, setDraggedAsset] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState(null);
  const [duration, setDuration] = useState(180);
  const [trimMode, setTrimMode] = useState(false);

  const assets = [
    { id: 1, name: 'Video 1', type: 'video', icon: '🎬', duration: 30 },
    { id: 2, name: 'Video 2', type: 'video', icon: '🎬', duration: 45 },
    { id: 3, name: 'Background', type: 'audio', icon: '🎵', duration: 180 },
    { id: 4, name: 'Nature', type: 'audio', icon: '🎵', duration: 120 },
    { id: 5, name: 'Ambience', type: 'audio', icon: '🎵', duration: 160 },
  ];

  const effects = [
    { id: 1, name: 'Fade In', icon: '✨' },
    { id: 2, name: 'Fade Out', icon: '✨' },
    { id: 3, name: 'Zoom', icon: '🔍' },
    { id: 4, name: 'Blur', icon: '🌫️' },
    { id: 5, name: 'Speed Up', icon: '⚡' },
    { id: 6, name: 'Color Grade', icon: '🎨' },
  ];

  const handleDragStart = (asset) => {
    setDraggedAsset(asset);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (track) => {
    if (!draggedAsset) return;
    const newClip = {
      id: Math.random(),
      ...draggedAsset,
      track: track,
      startTime: currentTime,
      effects: [],
      trimStart: 0,
      trimEnd: draggedAsset.duration
    };
    setTimeline([...timeline, newClip]);
    setDraggedAsset(null);
  };

  const handleDeleteClip = (clipId) => {
    setTimeline(timeline.filter(c => c.id !== clipId));
    if (selectedClip?.id === clipId) setSelectedClip(null);
  };

  const handleApplyEffect = () => {
    if (!selectedClip || !selectedEffect) return;
    
    const updatedTimeline = timeline.map(c => 
      c.id === selectedClip.id 
        ? { ...c, effects: [...c.effects, selectedEffect] }
        : c
    );
    setTimeline(updatedTimeline);
    setSelectedClip({ ...selectedClip, effects: [...selectedClip.effects, selectedEffect] });
  };

  const handleTrimClip = (clipId, start, end) => {
    const updatedTimeline = timeline.map(c =>
      c.id === clipId
        ? { ...c, trimStart: start, trimEnd: end }
        : c
    );
    setTimeline(updatedTimeline);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const videoClips = timeline.filter(c => c.type === 'video');
  const audioClips1 = timeline.filter((c, i) => c.type === 'audio' && i % 2 === 0);
  const audioClips2 = timeline.filter((c, i) => c.type === 'audio' && i % 2 === 1);

  return (
    <div className="app">
      <header className="header">
        <h1>🌙 Atmosfer Stüdyo</h1>
        <div className="header-menu">
          <button>File</button>
          <button>Edit</button>
          <button>View</button>
          <button>Help</button>
        </div>
      </header>

      <div className="editor-container">
        
        {/* LEFT SIDEBAR */}
        <aside className="sidebar sidebar-left">
          <div className="panel">
            <h3>📁 Assets</h3>
            <div className="assets-list">
              {assets.map(asset => (
                <div 
                  key={asset.id}
                  className="asset-item"
                  draggable
                  onDragStart={() => handleDragStart(asset)}
                  title="Sürükle → Timeline'a"
                >
                  <span>{asset.icon}</span>
                  <div>
                    <p>{asset.name}</p>
                    <p className="time">{formatTime(asset.duration)}</p>
                  </div>
                  <span className="drag-hint">⋮⋮</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3>🎨 Colors</h3>
            <div className="colors">
              <button style={{ backgroundColor: '#FF6B6B' }} />
              <button style={{ backgroundColor: '#4ECDC4' }} />
              <button style={{ backgroundColor: '#45B7D1' }} />
              <button style={{ backgroundColor: '#FFA502' }} />
            </div>
          </div>

          <div className="panel">
            <h3>📤 Export</h3>
            <button className="export-btn">🚀 Export Video</button>
          </div>
        </aside>

        {/* CENTER */}
        <main className="editor-main">
          <div className="canvas-container">
            <div className="canvas">
              <p>▶ Video Preview</p>
              {selectedClip && (
                <div className="clip-preview">
                  <p className="clip-name">{selectedClip.name}</p>
                  <p className="clip-duration">{formatTime(selectedClip.trimEnd - selectedClip.trimStart)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="timeline-container">
            <h3>🎬 Timeline</h3>
            <div className="timeline">
              {/* VIDEO TRACK */}
              <div className="track" onDragOver={handleDragOver} onDrop={() => handleDrop('video')}>
                <div className="track-header">▼ V1</div>
                <div className="track-content">
                  {videoClips.map(clip => (
                    <div 
                      key={clip.id}
                      className={`clip video-clip ${selectedClip?.id === clip.id ? 'selected' : ''}`}
                      onClick={() => setSelectedClip(clip)}
                    >
                      <span>{clip.name}</span>
                      <button 
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClip(clip.id);
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* AUDIO TRACK 1 */}
              <div className="track" onDragOver={handleDragOver} onDrop={() => handleDrop('audio1')}>
                <div className="track-header">▼ A1</div>
                <div className="track-content">
                  {audioClips1.map(clip => (
                    <div 
                      key={clip.id}
                      className={`clip audio-clip ${selectedClip?.id === clip.id ? 'selected' : ''}`}
                      onClick={() => setSelectedClip(clip)}
                    >
                      <span>{clip.name}</span>
                      <button 
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClip(clip.id);
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* AUDIO TRACK 2 */}
              <div className="track" onDragOver={handleDragOver} onDrop={() => handleDrop('audio2')}>
                <div className="track-header">▼ A2</div>
                <div className="track-content">
                  {audioClips2.map(clip => (
                    <div 
                      key={clip.id}
                      className={`clip audio-clip ${selectedClip?.id === clip.id ? 'selected' : ''}`}
                      onClick={() => setSelectedClip(clip)}
                    >
                      <span>{clip.name}</span>
                      <button 
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClip(clip.id);
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="sidebar sidebar-right">
          
          {selectedClip ? (
            <>
              <div className="panel">
                <h3>✂️ Trim Clip</h3>
                <label>Start</label>
                <input 
                  type="number" 
                  value={selectedClip.trimStart}
                  onChange={(e) => handleTrimClip(selectedClip.id, parseInt(e.target.value), selectedClip.trimEnd)}
                />
                <label>End</label>
                <input 
                  type="number" 
                  value={selectedClip.trimEnd}
                  onChange={(e) => handleTrimClip(selectedClip.id, selectedClip.trimStart, parseInt(e.target.value))}
                />
              </div>

              <div className="panel">
                <h3>✨ Effects</h3>
                {effects.map(effect => (
                  <button
                    key={effect.id}
                    className={`effect-btn ${selectedEffect?.id === effect.id ? 'active' : ''}`}
                    onClick={() => setSelectedEffect(effect)}
                  >
                    {effect.icon} {effect.name}
                  </button>
                ))}
                <button className="apply-effect-btn" onClick={handleApplyEffect}>
                  ➕ Apply Effect
                </button>
              </div>

              <div className="panel">
                <h3>📋 Applied Effects</h3>
                {selectedClip.effects.length > 0 ? (
                  <div className="effects-list">
                    {selectedClip.effects.map((eff, i) => (
                      <div key={i} className="applied-effect">
                        {eff.icon} {eff.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-effects">No effects applied</p>
                )}
              </div>
            </>
          ) : (
            <div className="panel">
              <h3>ℹ️ Info</h3>
              <p className="info-text">Select a clip to edit</p>
            </div>
          )}

          <div className="panel">
            <h3>⚙️ Settings</h3>
            <label>Duration</label>
            <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} />
            
            <label>FPS</label>
            <select>
              <option>24 FPS</option>
              <option>30 FPS</option>
              <option>60 FPS</option>
            </select>

            <label>Resolution</label>
            <select>
              <option>1080p</option>
              <option>720p</option>
              <option>4K</option>
            </select>
          </div>
        </aside>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <button className="play-btn" onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button>⏹</button>
        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        <input 
          type="range" 
          min="0" 
          max={duration} 
          value={currentTime} 
          onChange={(e) => setCurrentTime(parseInt(e.target.value))}
          className="slider"
        />
        <button className="volume-btn">🔊</button>
        <button className="mic-btn">🎙️</button>
        <button className="export-final">🚀 Export</button>
      </footer>
    </div>
  );
}

export default App;
