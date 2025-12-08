// src/components/Player.jsx
/* eslint-disable react/prop-types */
export default function Player({
  currentSong,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  currentTime,      // formatted (e.g. "0:32")
  duration,         // formatted, not used in UI but kept for future
  remainingTime,    // formatted, e.g. "-2:24"
  progressPercent,  // 0–100
  onSeek,           // function(percent)
  volume,
  onVolumeChange,
}) {
  const handleVolumeInput = (e) => {
    const value = Number(e.target.value); // 0–100
    onVolumeChange(value / 100);          // convert to 0–1
  };

  const handleTimelineInput = (e) => {
    const value = Number(e.target.value); // 0–100
    onSeek(value);
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
          {/* left: elapsed time */}
          <span className="time">{currentTime}</span>

          {/* middle: draggable slider */}
          <input
            type="range"
            className="timeline-slider"
            min="0"
            max="100"
            value={progressPercent}
            onChange={handleTimelineInput}
          />

          {/* right: remaining time (counts down) */}
          <span className="time">{remainingTime}</span>
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
