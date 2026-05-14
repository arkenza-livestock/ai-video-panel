import React, { useState, useEffect } from 'react';
import { useEditor } from './context/EditorContext';
import exportService from './services/exportService';
import './ExportDialog.css';

function ExportDialog({ isOpen, onClose, duration }) {
  const { apiReady, apiError } = useEditor();

  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('1080p');
  const [fps, setFps] = useState(30);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportId, setExportId] = useState(null);
  const [exportError, setExportError] = useState(null);
  const [exportStatus, setExportStatus] = useState(null);

  const formats = [
    { id: 'mp4', name: 'MP4 (H.264)', icon: '🎬' },
    { id: 'webm', name: 'WebM', icon: '🎬' },
    { id: 'mov', name: 'MOV (ProRes)', icon: '🎬' },
    { id: 'gif', name: 'Animated GIF', icon: '🎞️' },
  ];

  const qualities = [
    { id: '480p', name: '480p (SD)', size: '~50MB' },
    { id: '720p', name: '720p (HD)', size: '~150MB' },
    { id: '1080p', name: '1080p (Full HD)', size: '~350MB' },
    { id: '4K', name: '4K (Ultra HD)', size: '~800MB' },
  ];

  const fpsOptions = [24, 30, 60];

  // Calculate estimated file size
  const estimateFileSize = () => {
    const baseSize = {
      '480p': 50,
      '720p': 150,
      '1080p': 350,
      '4K': 800,
    };

    const durationMinutes = duration / 60;
    const estimated = (baseSize[quality] || 100) * (durationMinutes / 5);
    return Math.round(estimated);
  };

  // Handle export
  const handleExport = async () => {
    if (!apiReady) {
      setExportError('Backend API not available');
      return;
    }

    try {
      setIsExporting(true);
      setExportError(null);
      setExportProgress(0);

      // Send export request
      const result = await exportService.startExport({
        format,
        quality,
        fps,
      });

      setExportId(result.export_id);
      setExportStatus('queued');

      // Start polling for progress
      pollExportProgress(result.export_id);
    } catch (error) {
      setExportError(error.message);
      setIsExporting(false);
    }
  };

  // Poll export progress
  const pollExportProgress = async (id) => {
    const interval = setInterval(async () => {
      try {
        const status = await exportService.getExportStatus(id);
        setExportStatus(status.status);
        setExportProgress(status.progress || 0);

        if (status.status === 'completed') {
          clearInterval(interval);
          setIsExporting(false);
          // Could download file here if backend provides URL
        } else if (status.status === 'failed') {
          clearInterval(interval);
          setExportError(status.error || 'Export failed');
          setIsExporting(false);
        }
      } catch (error) {
        clearInterval(interval);
        setExportError(error.message);
        setIsExporting(false);
      }
    }, 1000);
  };

  const handleCancel = () => {
    setFormat('mp4');
    setQuality('1080p');
    setFps(30);
    setIsExporting(false);
    setExportProgress(0);
    setExportId(null);
    setExportError(null);
    setExportStatus(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="export-dialog-overlay" onClick={handleCancel}>
      <div className="export-dialog" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="dialog-header">
          <h2>🚀 Export Video</h2>
          <button className="close-btn" onClick={handleCancel}>✕</button>
        </div>

        {/* CONTENT */}
        <div className="dialog-content">
          {!isExporting ? (
            <>
              {/* FORMAT SELECTION */}
              <div className="section">
                <h3>Format</h3>
                <div className="options-grid">
                  {formats.map((fmt) => (
                    <button
                      key={fmt.id}
                      className={`option-btn ${format === fmt.id ? 'active' : ''}`}
                      onClick={() => setFormat(fmt.id)}
                    >
                      <span className="icon">{fmt.icon}</span>
                      <span className="name">{fmt.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* QUALITY SELECTION */}
              <div className="section">
                <h3>Quality</h3>
                <div className="options-grid">
                  {qualities.map((q) => (
                    <button
                      key={q.id}
                      className={`option-btn ${quality === q.id ? 'active' : ''}`}
                      onClick={() => setQuality(q.id)}
                    >
                      <span className="name">{q.name}</span>
                      <span className="size">{q.size}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* FPS SELECTION */}
              <div className="section">
                <h3>Frame Rate</h3>
                <div className="fps-buttons">
                  {fpsOptions.map((f) => (
                    <button
                      key={f}
                      className={`fps-btn ${fps === f ? 'active' : ''}`}
                      onClick={() => setFps(f)}
                    >
                      {f} FPS
                    </button>
                  ))}
                </div>
              </div>

              {/* PREVIEW INFO */}
              <div className="preview-info">
                <div className="info-row">
                  <span>Duration:</span>
                  <span>
                    {Math.floor(duration / 60)}m {Math.floor(duration % 60)}s
                  </span>
                </div>
                <div className="info-row">
                  <span>Estimated Size:</span>
                  <span>~{estimateFileSize()}MB</span>
                </div>
                <div className="info-row">
                  <span>Format:</span>
                  <span>{format.toUpperCase()}</span>
                </div>
              </div>

              {/* ERROR MESSAGE */}
              {exportError && (
                <div className="error-message">
                  ⚠️ {exportError}
                </div>
              )}

              {/* BUTTONS */}
              <div className="dialog-buttons">
                <button className="cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
                <button 
                  className="export-btn"
                  onClick={handleExport}
                  disabled={!apiReady}
                >
                  🚀 Start Export
                </button>
              </div>
            </>
          ) : (
            /* EXPORTING STATE */
            <div className="exporting-state">
              <div className="progress-container">
                <h3>Exporting...</h3>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <p className="progress-text">
                  {exportProgress}% Complete
                </p>
              </div>

              <div className="status-info">
                <p>
                  <strong>Status:</strong> {exportStatus}
                </p>
                <p>
                  <strong>Format:</strong> {format.toUpperCase()}
                </p>
                <p>
                  <strong>Quality:</strong> {quality}
                </p>
              </div>

              {exportStatus === 'completed' && (
                <div className="success-message">
                  ✅ Export completed successfully!
                </div>
              )}

              {exportStatus === 'failed' && (
                <div className="error-message">
                  ❌ Export failed
                </div>
              )}

              {exportStatus !== 'completed' && exportStatus !== 'failed' && (
                <button 
                  className="cancel-btn"
                  onClick={handleCancel}
                >
                  Close
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;
