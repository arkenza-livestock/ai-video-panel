import React, { useState } from 'react';
import './ExportDialog.css';

function ExportDialog({ isOpen, onClose, duration }) {
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('1080p');
  const [fps, setFps] = useState(30);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = () => {
    setIsExporting(true);
    // Simulating export
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setTimeout(() => {
            alert('✅ Video exported successfully!');
            onClose();
          }, 500);
          return 100;
        }
        return prev + Math.random() * 30;
      });
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>🚀 Export Video</h2>
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>

        <div className="dialog-body">
          <div className="form-group">
            <label>Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="mp4">MP4 (H.264)</option>
              <option value="webm">WebM (VP9)</option>
              <option value="mov">MOV (ProRes)</option>
              <option value="gif">GIF (Animated)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Quality</label>
            <div className="quality-options">
              {['480p', '720p', '1080p', '4K'].map(q => (
                <button
                  key={q}
                  className={`quality-btn ${quality === q ? 'active' : ''}`}
                  onClick={() => setQuality(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>FPS</label>
            <div className="fps-options">
              {[24, 30, 60].map(f => (
                <button
                  key={f}
                  className={`fps-btn ${fps === f ? 'active' : ''}`}
                  onClick={() => setFps(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="info-box">
            <p>📊 <strong>Estimated Size:</strong> ~{Math.round((duration * fps) / 30 * 0.5)} MB</p>
            <p>⏱️ <strong>Duration:</strong> {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}</p>
          </div>

          {isExporting && (
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="progress-text">{Math.round(progress)}% Complete</p>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn-cancel" onClick={onClose} disabled={isExporting}>
            Cancel
          </button>
          <button 
            className="btn-export" 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? '⏳ Exporting...' : '🚀 Export'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;
