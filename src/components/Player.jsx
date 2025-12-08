// src/components/Player.jsx
/* eslint-disable react/prop-types */
export default function Player({
  currentSong,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  currentTime,
  duration,
  progressPercent,
  onTimelineClick,
  volume,
  onVolumeChange,
}) {
  const handleVolumeInput = (e) => {
    const value = Number(e.target.value); // 0–100
    onVolumeChange(value / 100); // convert to 0–1
  };

  return (
    <footer className="player-bar">
      {/* Left: current track info */}
      <div className="player-left">
        <div className="track-title">
          {currentSong ? currentSong.title : "No song playing"}
        </div>
        <div className="track-artist">
          {currentSong
            ? currentSong.artist
            : "Pick a song from the list above or search"}
        </div>
      </div>

      {/* Center: controls + timeline */}
      <div className="player-center">
        <div className="player-controls">
          <button className="icon-btn" onClick={onPrev}>
            ⏮
          </button>
          <button className="icon-btn big" onClick={onPlayPause}>
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button className="icon-btn" onClick={onNext}>
            ⏭
          </button>
        </div>

        <div className="player-timeline">
          <span className="time">{currentTime}</span>
          <div className="timeline-bar" onClick={onTimelineClick}>
            <div
              className="timeline-progress"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="time">{duration}</span>
        </div>
      </div>

      {/* Right: volume */}
      <div className="player-right">
        <span className="volume-icon">🔊</span>
        <input
          type="range"
          className="volume-slider"
          min="0"
          max="100"
          value={Math.round(volume * 100)}
          onChange={handleVolumeInput}
        />
      </div>
    </footer>
  );
}
