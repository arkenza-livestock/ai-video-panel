import React from 'react';
import { useEditor } from '../context/EditorContext';
import '../styles/Footer.css';

function Footer() {
  const {
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    duration,
    showExportDialog,
    setShowExportDialog,
  } = useEditor();

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        
        {/* PLAYBACK BUTTONS */}
        <div className="playback-controls">
          <button 
            className="play-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            title="Play/Pause (Space)"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button 
            className="stop-btn"
            onClick={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            title="Stop & Rewind"
          >
            ⏹
          </button>
        </div>

        {/* TIME DISPLAY */}
        <span className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* TIMELINE SCRUBBER */}
        <div className="timeline-slider-container">
          <input 
            type="range" 
            min="0" 
            max={duration} 
            value={currentTime} 
            onChange={(e) => setCurrentTime(parseInt(e.target.value))}
            className="slider"
            title="Seek timeline"
          />
        </div>

        {/* AUDIO CONTROLS */}
        <div className="audio-controls">
          <button 
            className="volume-btn"
            title="Volume"
          >
            🔊
          </button>
          <button 
            className="mic-btn"
            title="Microphone"
          >
            🎙️
          </button>
        </div>

        {/* EXPORT BUTTON */}
        <button 
          className="export-final-btn"
          onClick={() => setShowExportDialog(true)}
          title="Export (Ctrl+E)"
        >
          🚀 Export
        </button>
      </div>
    </footer>
  );
}

export default Footer;
