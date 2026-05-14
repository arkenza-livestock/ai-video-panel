import React, { useState, useRef } from 'react';
import ExportDialog from './ExportDialog';
import './App.css';

function App() {
  const [timeline, setTimeline] = useState([]);
  const [selectedClip, setSelectedClip] = useState(null);
  const [draggedAsset, setDraggedAsset] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState(null);
  const [duration, setDuration] = useState(180);
  const [resizingClip, setResizingClip] = useState(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const timelineRef = useRef(null);

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
      duration: draggedAsset.duration,
      effects: [],
      volume: 100,
    };
    setTimeline([...timeline, newClip]);
    setDraggedAsset(null);
  };

  const handleDeleteClip = (clipId) => {
    setTimeline(timeline.filter(c => c.id !== clipId));
    if (selectedClip?.id === clipId) setSelectedClip(null);
  };

  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    setCurrentTime(Math.floor(percent * duration));
  };

  const handleResizeStart = (e, clipId, edge) => {
    e.stopPropagation();
    setResizingClip({ clipId, edge, startX: e.clientX });
  };

  const handleMouseMove = (e) => {
    if (!resizingClip) return;
    
    const clip = timeline.find(c => c.id === resizingClip.clipId);
    if (!clip) return;

    const deltaPixels = e.clientX - resizingClip.startX;
    const deltaSeconds = deltaPixels / 2;

    const updatedTimeline = timeline.map(c => {
      if (c.id !== resizingClip.clipId) return c;
      
      if (resizingClip.edge === 'left') {
        return {
          ...c,
          startTime: Math.max(0, c.startTime + deltaSeconds),
          duration: Math.max(1, c.duration - deltaSeconds)
        };
      } else {
        return {
          ...c,
          duration: Math.max(1, c.duration + deltaSeconds)
        };
      }
    });
    
    setTimeline(updatedTimeline);
    setResizingClip({ ...resizingClip, startX: e.clientX });
  };

  const handleMouseUp = () => {
    setResizingClip(null);
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

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const generateWaveform = (type) => {
    return Array.from({ length: 30 }, () => Math.random() * 100);
  };

  const videoClips = timeline.filter(c => c.type === 'video');
  const audioClips1 = timeline.filter((c, i) => c.type === 'audio' && i % 2 === 0);
  const audioClips2 = timeline.filter((c, i) => c.type === 'audio' && i % 2 === 1);

  return (
    <div className="app" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
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
            <button className="export-btn" onClick={() => setShowExportDialog(true)}>
              🚀 Export Video
            </button>
          </div>
        </aside>

        {/* CENTER */}
        <main className="editor-main">
          <div className="canvas-container">
            <div className="canvas">
              <p>▶ Video Preview</p>
              {selectedClip ? (
                <div className="clip-inspector-preview">
                  <p className="clip-name">📌 {selectedClip.name}</p>
                  <p className="clip-info">Duration: {formatTime(selectedClip.duration)}</p>
                  <p className="clip-info">Start: {formatTime(selectedClip.startTime)}</p>
                </div>
              ) : (
                <p className="placeholder-text">Select a clip or drag asset here</p>
              )}
            </div>
          </div>

          <div className="timeline-container">
            <div className="timeline-header">
              <h3>🎬 Timeline</h3>
              <span className="timeline-duration">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            
            {/* TIMELINE SCRUBBER */}
            <div className="timeline-scrubber-container" ref={timelineRef} onClick={handleTimelineClick}>
              <div className="timeline-scrubber" style={{ left: `${(currentTime / duration) * 100}%` }} />
              <div className="timeline-ruler">
                {Array.from({ length: Math.ceil(duration / 10) }).map((_, i) => (
                  <span key={i} className="ruler-mark">{i * 10}s</span>
                ))}
              </div>
            </div>

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
                      style={{ 
                        marginLeft: `${(clip.startTime / duration) * 100}%`,
                        width: `${(clip.duration / duration) * 100}%`
                      }}
                    >
                      <div className="clip-left-handle" onMouseDown={(e) => handleResizeStart(e, clip.id, 'left')} />
                      <span className="clip-label">{clip.name}</span>
                      <button 
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClip(clip.id);
                        }}
                      >×</button>
                      <div className="clip-right-handle" onMouseDown={(e) => handleResizeStart(e, clip.id, 'right')} />
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
                      style={{ 
                        marginLeft: `${(clip.startTime / duration) * 100}%`,
                        width: `${(clip.duration / duration) * 100}%`
                      }}
                    >
                      <div className="waveform">
                        {generateWaveform('audio').map((h, i) => (
                          <div key={i} className="waveform-bar" style={{ height: `${h}%` }} />
                        ))}
                      </div>
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
                      style={{ 
                        marginLeft: `${(clip.startTime / duration) * 100}%`,
                        width: `${(clip.duration / duration) * 100}%`
                      }}
                    >
                      <div className="waveform">
                        {generateWaveform('audio').map((h, i) => (
                          <div key={i} className="waveform-bar" style={{ height: `${h}%` }} />
                        ))}
                      </div>
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
                <h3>📋 Clip Info</h3>
                <div className="clip-info-grid">
                  <div>
                    <label>Name</label>
                    <p>{selectedClip.name}</p>
                  </div>
                  <div>
                    <label>Duration</label>
                    <p>{formatTime(selectedClip.duration)}</p>
                  </div>
                  <div>
                    <label>Start Time</label>
                    <p>{formatTime(selectedClip.startTime)}</p>
                  </div>
                  <div>
                    <label>Volume</label>
                    <input type="range" min="0" max="100" defaultValue={selectedClip.volume} />
                  </div>
                </div>
              </div>

              <div className="panel">
                <h3>✨ Add Effects</h3>
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
                  ➕ Apply
                </button>
              </div>

              <div className="panel">
                <h3>📊 Applied Effects</h3>
                {selectedClip.effects && selectedClip.effects.length > 0 ? (
                  <div className="effects-list">
                    {selectedClip.effects.map((eff, i) => (
                      <div key={i} className="effect-badge">
                        {eff.icon} {eff.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No effects</p>
                )}
              </div>
            </>
          ) : (
            <div className="panel">
              <h3>ℹ️ Help</h3>
              <p className="help-text">
                1. Drag assets to timeline<br/>
                2. Click clip to select<br/>
                3. Drag edges to resize<br/>
                4. Apply effects
              </p>
            </div>
          )}

          <div className="panel">
            <h3>⚙️ Project Settings</h3>
            <label>Duration</label>
            <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} />
            
            <label>FPS</label>
            <select>
              <option>24 FPS</option>
              <option selected>30 FPS</option>
              <option>60 FPS</option>
            </select>

            <label>Resolution</label>
            <select>
              <option selected>1080p</option>
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
        <span className="time-display">{formatTime(currentTime)} / {formatTime(duration)}</span>
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
        <button className="export-final" onClick={() => setShowExportDialog(true)}>
          🚀 Export
        </button>
      </footer>

      {/* EXPORT DIALOG */}
      <ExportDialog 
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        duration={duration}
      />
    </div>
  );
}

export default App;
