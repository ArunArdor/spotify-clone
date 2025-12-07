import { useState, useRef, useEffect } from "react";
import "./App.css";

// Song data (update src names if your files differ)
const SONGS = [
  {
    id: 1,
    title: "Excuses",
    artist: "AP Dhillon",
    duration: "2:56",
    src: "/audio/excuses.mp3",
  },
  {
    id: 2,
    title: "Brown Munde",
    artist: "AP Dhillon, Gurinder Gill",
    duration: "4:10",
    src: "/audio/brown-munde.mp3",
  },
  {
    id: 3,
    title: "295",
    artist: "Sidhu Moose Wala",
    duration: "4:32",
    src: "/audio/295.mp3",
  },
  {
    id: 4,
    title: "Insane",
    artist: "AP Dhillon, Gurinder Gill, Shinda Kahlon",
    duration: "3:40",
    src: "/audio/insane.mp3",
  },
];

// helper to format seconds as M:SS
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function App() {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // seconds
  const [duration, setDuration] = useState(0); // seconds
  const [searchQuery, setSearchQuery] = useState(""); // NEW

  const audioRef = useRef(null);

  // Filter songs based on search
  const normalizedQuery = searchQuery.toLowerCase().trim();
  const filteredSongs =
    normalizedQuery === ""
      ? SONGS
      : SONGS.filter(
          (song) =>
            song.title.toLowerCase().includes(normalizedQuery) ||
            song.artist.toLowerCase().includes(normalizedQuery)
        );

  // Click on song from list
  const handleSongClick = (song) => {
    if (currentSong?.id === song.id) {
      // same song → restart & play
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      setIsPlaying(true);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  // Play / Pause button in player
  const handlePlayPauseClick = () => {
    if (!currentSong) {
      // if nothing selected yet, start at first song
      const firstSong = filteredSongs[0] || SONGS[0];
      if (!firstSong) return;
      setCurrentSong(firstSong);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  // ▶▶ Next song
  const playNext = () => {
    const list = filteredSongs.length > 0 ? filteredSongs : SONGS;

    if (!currentSong) {
      if (list.length === 0) return;
      setCurrentSong(list[0]);
      setIsPlaying(true);
      return;
    }

    const currentIndex = list.findIndex((s) => s.id === currentSong.id);
    const nextIndex = currentIndex === -1
      ? 0
      : (currentIndex + 1) % list.length;
    setCurrentSong(list[nextIndex]);
    setIsPlaying(true);
  };

  // ◀◀ Previous song
  const playPrev = () => {
    const list = filteredSongs.length > 0 ? filteredSongs : SONGS;

    if (!currentSong) {
      if (list.length === 0) return;
      setCurrentSong(list[list.length - 1]);
      setIsPlaying(true);
      return;
    }

    const currentIndex = list.findIndex((s) => s.id === currentSong.id);
    const prevIndex =
      currentIndex === -1
        ? list.length - 1
        : (currentIndex - 1 + list.length) % list.length;
    setCurrentSong(list[prevIndex]);
    setIsPlaying(true);
  };

  // Sync React state with <audio>
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentSong) {
      audio.pause();
      return;
    }

    audio.src = currentSong.src;

    if (isPlaying) {
      audio
        .play()
        .catch((err) => console.log("Autoplay blocked or error:", err));
    } else {
      audio.pause();
    }
  }, [currentSong, isPlaying]);

  // When song finishes, auto-next
  const handleEnded = () => {
    playNext();
  };

  // When metadata (duration) is loaded
  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration || 0);
  };

  // When time updates (progress)
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime || 0);
  };

  // Click on the progress bar to seek
  const handleTimelineClick = (event) => {
    if (!duration || !audioRef.current) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const ratio = clickX / rect.width;
    const newTime = ratio * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Calculate percentage for the green bar
  const progressPercent =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="app">
      <div className="app-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo">Spotify Clone</div>

          <nav className="nav-section">
            <div className="nav-item active">🏠 Home</div>
            <div className="nav-item">🔍 Search</div>
            <div className="nav-item">📚 Your Library</div>
          </nav>

          <div className="nav-section">
            <div className="nav-title">Playlists</div>
            <div className="nav-item">🔥 Liked Songs</div>
            <div className="nav-item">💪 Gym Vibes</div>
            <div className="nav-item">🧠 Study Mode</div>
          </div>
        </aside>

        {/* Main content */}
        <main className="main-content">
          <header className="main-header">
            <button className="pill-btn">Upgrade</button>
            <button className="pill-btn pill-outline">Profile</button>
          </header>

          <section className="main-section">
            <h2>Good evening</h2>
            <div className="card-row">
              <div className="playlist-card">Liked Songs</div>
              <div className="playlist-card">Daily Mix 1</div>
              <div className="playlist-card">Punjabi Hits</div>
            </div>
          </section>

          <section className="main-section">
            <h2>Made for You</h2>
            <div className="card-row">
              <div className="big-card">Discover Weekly</div>
              <div className="big-card">Release Radar</div>
              <div className="big-card">Chill Mix</div>
            </div>
          </section>

          {/* Song list with search */}
          <section className="main-section">
            <div className="songs-header-row">
              <h2>Your Songs</h2>
              <input
                type="text"
                className="search-input"
                placeholder="Search songs or artists"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="song-list">
              <div className="song-list-header">
                <span>#</span>
                <span>Title</span>
                <span>Artist</span>
                <span>Duration</span>
              </div>

              {filteredSongs.length === 0 ? (
                <div className="song-empty">No songs found.</div>
              ) : (
                filteredSongs.map((song, index) => (
                  <div
                    key={song.id}
                    className={`song-row ${
                      currentSong?.id === song.id ? "active" : ""
                    }`}
                    onClick={() => handleSongClick(song)}
                  >
                    <span>{index + 1}</span>
                    <span>{song.title}</span>
                    <span>{song.artist}</span>
                    <span>{song.duration}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Bottom Player */}
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
            <button className="icon-btn" onClick={playPrev}>
              ⏮
            </button>
            <button className="icon-btn big" onClick={handlePlayPauseClick}>
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button className="icon-btn" onClick={playNext}>
              ⏭
            </button>
          </div>
          <div className="player-timeline">
            <span className="time">{formatTime(currentTime)}</span>
            <div className="timeline-bar" onClick={handleTimelineClick}>
              <div
                className="timeline-progress"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="time">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="player-right">
          <span className="volume-icon">🔊</span>
          <div className="volume-bar">
            <div className="volume-level" />
          </div>
        </div>
      </footer>

      {/* Audio element */}
      <audio
        ref={audioRef}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
      />
    </div>
  );
}

export default App;
