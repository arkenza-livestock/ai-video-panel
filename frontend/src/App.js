import React, { useRef, useEffect } from 'react';
import { useEditor } from './context/EditorContext';
import ExportDialog from './ExportDialog';
import SettingsModal from './SettingsModal';
import AudioMixer from './AudioMixer';
import './App.css';

function App() {
  const {
    timeline,
    selectedClip,
    setSelectedClip,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    duration,
    setDuration,
    selectedEffect,
    setSelectedEffect,
    showExportDialog,
    setShowExportDialog,
    showSettingsModal,
    setShowSettingsModal,
    projectSettings,
    setProjectSettings,
    handleUndo,
    handleRedo,
    deleteClip,
    addClip,
    applyEffect,
    resizeClip,
    saveResizeClip,
    historyIndex,
    history,
  } = useEditor();

  const [draggedAsset, setDraggedAsset] = React.useState(null);
  const [resizingClip, setResizingClip] = React.useState(null);
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

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        setShowExportDialog(true);
      }
      
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setShowSettingsModal(true);
      }
      
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }

      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
      
      if (e.key === 'Delete' && selectedClip) {
        e.preventDefault();
        deleteClip(selectedClip.id);
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentTime(Math.max(0, currentTime - 1));
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentTime(Math.min(duration, currentTime + 1));
      }

      if (e.key === 'd') {
        setSelectedClip(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, selectedClip, currentTime, duration, handleUndo, handleRedo, deleteClip]);

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
    addClip(newClip);
    setDraggedAsset(null);
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

    if (resizingClip.edge === 'left') {
      resizeClip(
        resizingClip.clipId,
        Math.max(0, clip.startTime + deltaSeconds),
        Math.max(1, clip.duration - deltaSeconds)
      );
    } else {
      resizeClip(
        resizingClip.clipId,
        clip.startTime,
        Math.max(1, clip.duration + deltaSeconds)
      );
    }
    
    setResizingClip({ ...resizingClip, startX: e.clientX });
  };

  const handleMouseUp = () => {
    if (resizingClip) {
      saveResizeClip();
    }
    setResizingClip(null);
  };

  const handleApplyEffect = () => {
    if (!selectedClip || !selectedEffect) return;
    applyEffect(selectedClip.id, selectedEffect);
    setSelectedClip({ ...selectedClip, effects: [...selectedClip.effects, selectedEffect] });
  };

  const handleSaveSettings = (newSettings) => {
    setProjectSettings(newSettings);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const generateWaveform = () => {
    return Array.from({ length: 30 }, () => Math.random() * 100);
  };

  const videoClips = timeline.filter(c => c.type === 'video');
  const audioClips1 = timeline.filter((c, i) => c.type === 'audio' && i % 2 === 0);
  const audioClips2 = timeline.filter((c, i) => c.type === 'audio' && i % 2 === 1);

  return (
    <div className="app" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <header className="header">
        <h1>🌙 {projectSettings.projectName}</h1>
        <div className="header-menu">
          <button 
            onClick={handleUndo} 
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button 
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
          <button title="File">File</button>
          <button title="Edit">Edit</button>
          <button title="View">View</button>
          <button onClick={() => setShowSettingsModal(true)} title="Settings (Ctrl+,)">⚙️ Settings</button>
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
              <button style={{ backgroundColor: '#FF6B6B' }} title="Red" />
              <button style={{ backgroundColor: '#4ECDC4' }} title="Teal" />
              <button style={{ backgroundColor: '#45B7D1' }} title="Blue" />
              <button style={{ backgroundColor: '#FFA502' }} title="Orange" />
            </div>
          </div>

          <div className="panel">
            <h3>📤 Export</h3>
            <button className="export-btn" onClick={() => setShowExportDialog(true)} title="Export (Ctrl+E)">
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
                          deleteClip(clip.id);
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
                        {generateWaveform().map((h, i) => (
                          <div key={i} className="waveform-bar" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                      <button 
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteClip(clip.id);
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
                        {generateWaveform().map((h, i) => (
                          <div key={i} className="waveform-bar" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                      <button 
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteClip(clip.id);
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
            <>
              <AudioMixer clips={timeline} />
              <div className="panel">
                <h3>⌨️ Shortcuts</h3>
                <p className="help-text">
                  <strong>Space</strong> - Play/Pause<br/>
                  <strong>Del</strong> - Delete clip<br/>
                  <strong>←/→</strong> - Rewind/Forward<br/>
                  <strong>D</strong> - Deselect<br/>
                  <strong>Ctrl+Z</strong> - Undo<br/>
                  <strong>Ctrl+Y</strong> - Redo<br/>
                  <strong>Ctrl+E</strong> - Export<br/>
                  <strong>Ctrl+,</strong> - Settings
                </p>
              </div>
            </>
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
        <button className="play-btn" onClick={() => setIsPlaying(!isPlaying)} title="Play/Pause (Space)">
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button title="Stop">⏹</button>
        <span className="time-display">{formatTime(currentTime)} / {formatTime(duration)}</span>
        <input 
          type="range" 
          min="0" 
          max={duration} 
          value={currentTime} 
          onChange={(e) => setCurrentTime(parseInt(e.target.value))}
          className="slider"
          title="Timeline scrubber"
        />
        <button className="volume-btn" title="Volume">🔊</button>
        <button className="mic-btn" title="Microphone">🎙️</button>
        <button className="export-final" onClick={() => setShowExportDialog(true)} title="Export (Ctrl+E)">
          🚀 Export
        </button>
      </footer>

      {/* DIALOGS */}
      <ExportDialog 
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        duration={duration}
      />

      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={handleSaveSettings}
        projectSettings={projectSettings}
      />
    </div>
  );
}

export default App;
