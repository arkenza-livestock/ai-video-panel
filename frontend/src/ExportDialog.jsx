import React from 'react';
import { useEditor } from './context/EditorContext';
import './AudioMixer.css';

function AudioMixer() {
  const { timeline, updateTimeline } = useEditor();

  const handleVolumeChange = (clipIndex, newVolume) => {
    const updatedClips = [...timeline];
    updatedClips[clipIndex].volume = parseFloat(newVolume);
    updateTimeline(updatedClips);
  };

  if (!timeline || timeline.length === 0) {
    return (
      <div className="audio-mixer">
        <h3>🎚️ Audio Mixer</h3>
        <p>Henüz clip eklenmedi</p>
      </div>
    );
  }

  return (
    <div className="audio-mixer">
      <h3>🎚️ Audio Mixer</h3>
      <div className="mixer-channels">
        {timeline.map((clip, index) => (
          <div key={index} className="mixer-channel">
            <label>{clip.name || `Clip ${index + 1}`}</label>
            <input
              type="range"
              min="0"
              max="100"
              value={clip.volume || 100}
              onChange={(e) => handleVolumeChange(index, e.target.value)}
              className="volume-slider"
            />
            <span className="volume-value">{Math.round(clip.volume || 100)}%</span>
            <div className="volume-meter">
              <div
                className="volume-meter-fill"
                style={{ width: `${clip.volume || 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AudioMixer;
