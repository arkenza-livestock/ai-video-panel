import React, { useState } from 'react';
import './AudioMixer.css';

function AudioMixer({ clips }) {
  const [volumes, setVolumes] = useState({});

  const handleVolumeChange = (clipId, volume) => {
    setVolumes({ ...volumes, [clipId]: volume });
  };

  const audioClips = clips.filter(c => c.type === 'audio');

  if (audioClips.length === 0) {
    return (
      <div className="audio-mixer empty">
        <p>No audio clips</p>
      </div>
    );
  }

  return (
    <div className="audio-mixer">
      <h3>🎚️ Audio Mixer</h3>
      <div className="mixer-channels">
        {audioClips.map(clip => (
          <div key={clip.id} className="mixer-channel">
            <div className="channel-name">{clip.name}</div>
            <div className="channel-controls">
              <input
                type="range"
                min="0"
                max="100"
                defaultValue={clip.volume || 80}
                onChange={(e) => handleVolumeChange(clip.id, e.target.value)}
                className="volume-slider"
              />
              <span className="volume-label">
                {volumes[clip.id] || clip.volume || 80}%
              </span>
            </div>
            <div className="channel-meter">
              <div className="meter-bar" style={{ width: `${(volumes[clip.id] || clip.volume || 80) / 2}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AudioMixer;
