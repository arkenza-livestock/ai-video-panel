import React from 'react';
import { useEditor } from '../context/EditorContext';
import '../styles/Canvas.css';

function Canvas() {
  const { selectedClip } = useEditor();

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="canvas-container">
      <div className="canvas">
        <p className="canvas-title">▶ Video Preview</p>
        {selectedClip ? (
          <div className="clip-inspector-preview">
            <p className="clip-name">📌 {selectedClip.name}</p>
            <p className="clip-info">Duration: {formatTime(selectedClip.duration)}</p>
            <p className="clip-info">Start: {formatTime(selectedClip.startTime)}</p>
            {selectedClip.effects && selectedClip.effects.length > 0 && (
              <div className="clip-effects-badge">
                <p className="effects-count">✨ {selectedClip.effects.length} effects</p>
              </div>
            )}
          </div>
        ) : (
          <p className="placeholder-text">Select a clip or drag asset here</p>
        )}
      </div>
    </div>
  );
}

export default Canvas;
