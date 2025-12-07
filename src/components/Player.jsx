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
}) {
  return (
    <footer className="player-bar">
      <div className="player-left">
        <div className="track-title">
          {currentSong ? currentSong.title : "No song playing"}
        </div>
        <div className="track-artist">
          {currentSong
            ? currentSong.artist
            : "Pick a song from the list above"}
        </div>
      </div>

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

      <div className="player-right">
        <span className="volume-icon">🔊</span>
        <div className="volume-bar">
          <div className="volume-level" />
        </div>
      </div>
    </footer>
  );
}
