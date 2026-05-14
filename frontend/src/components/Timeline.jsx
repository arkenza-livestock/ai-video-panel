import React, { useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import '../styles/Timeline.css';

function Timeline() {
  const {
    timeline,
    selectedClip,
    setSelectedClip,
    currentTime,
    setCurrentTime,
    duration,
    deleteClip,
    resizeClip,
    saveResizeClip,
  } = useEditor();

  const [resizingClip, setResizingClip] = React.useState(null);
  const timelineRef = useRef(null);

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

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="timeline-component" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
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
        <div className="track">
          <div className="track-header">▼ V1</div>
          <div className="track-content" onDragOver={handleDragOver}>
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
        <div className="track">
          <div className="track-header">▼ A1</div>
          <div className="track-content" onDragOver={handleDragOver}>
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
        <div className="track">
          <div className="track-header">▼ A2</div>
          <div className="track-content" onDragOver={handleDragOver}>
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
  );
}

export default Timeline;
