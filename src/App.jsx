import { useState, useRef, useEffect } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import SongList from "./components/SongList";
import Player from "./components/Player";

// 🌐 Backend base URL: env in production, localhost in dev
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Song data (local fallback)
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
  const [songs, setSongs] = useState(SONGS); // backend/local songs
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // seconds
  const [duration, setDuration] = useState(0); // seconds
  const [searchQuery, setSearchQuery] = useState("");
  const [activePage, setActivePage] = useState("home"); // "home" | "search" | "library"

  // form state for adding custom songs (backend)
  const [newSong, setNewSong] = useState({
    title: "",
    artist: "",
    duration: "",
    src: "",
  });

  // state for ONLINE search (internet)
  const [onlineResults, setOnlineResults] = useState([]);
  const [isOnlineLoading, setIsOnlineLoading] = useState(false);
  const [onlineError, setOnlineError] = useState("");

  const audioRef = useRef(null);

  // 🔥 Load songs from your Node backend (GET /api/songs)
  useEffect(() => {
    const loadSongs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/songs`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSongs(data);
        }
      } catch (err) {
        console.log("Backend not running, using local SONGS.", err);
      }
    };

    loadSongs();
  }, []);

  // Local filtering (used on Home page)
  const normalizedQuery = searchQuery.toLowerCase().trim();
  const filteredSongs =
    normalizedQuery === ""
      ? songs
      : songs.filter(
          (song) =>
            song.title.toLowerCase().includes(normalizedQuery) ||
            song.artist.toLowerCase().includes(normalizedQuery)
        );

  // Click on song from any list (local or online)
  const handleSongClick = (song) => {
    if (currentSong?.id === song.id) {
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
      const firstSong =
        activePage === "search"
          ? onlineResults[0] || songs[0]
          : filteredSongs[0] || songs[0];
      if (!firstSong) return;
      setCurrentSong(firstSong);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  // ▶▶ Next song
  const playNext = () => {
    const list =
      activePage === "search" && onlineResults.length > 0
        ? onlineResults
        : filteredSongs.length > 0
        ? filteredSongs
        : songs;

    if (!currentSong) {
      if (list.length === 0) return;
      setCurrentSong(list[0]);
      setIsPlaying(true);
      return;
    }

    const currentIndex = list.findIndex((s) => s.id === currentSong.id);
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % list.length;
    setCurrentSong(list[nextIndex]);
    setIsPlaying(true);
  };

  // ◀◀ Previous song
  const playPrev = () => {
    const list =
      activePage === "search" && onlineResults.length > 0
        ? onlineResults
        : filteredSongs.length > 0
        ? filteredSongs
        : songs;

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

  // ✅ Add-song handler (uses your backend POST /api/songs)
  const handleAddSong = async (e) => {
    e.preventDefault();

    if (!newSong.title || !newSong.artist || !newSong.duration || !newSong.src) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSong),
      });

      if (!res.ok) {
        throw new Error("Failed to add song");
      }

      const created = await res.json();
      setSongs((prev) => [...prev, created]);

      setNewSong({
        title: "",
        artist: "",
        duration: "",
        src: "",
      });

      alert("Song added!");
    } catch (err) {
      console.error(err);
      alert("Error adding song (is backend running?)");
    }
  };

    const handleDeleteSong = async (id) => {
    // Optional: confirm before deleting
    const confirmDelete = window.confirm("Delete this song from your library?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_BASE}/api/songs/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete song");
      }

      // Remove from local state
      setSongs((prev) => prev.filter((song) => song.id !== id));

      // If the deleted song is currently playing, stop it
      if (currentSong?.id === id) {
        setCurrentSong(null);
        setIsPlaying(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting song");
    }
  };

  // 🌍 ONLINE SEARCH using iTunes API
  const handleOnlineSearch = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setIsOnlineLoading(true);
    setOnlineError("");
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          q
        )}&media=music&limit=25`
      );
      const data = await res.json();

const mapped = (data.results || [])
  .filter((item) => item.previewUrl)
  .map((item, idx) => ({
    id: item.trackId || idx,
    title: item.trackName,
    artist: item.artistName,
    duration: item.trackTimeMillis
      ? formatTime(item.trackTimeMillis / 1000)
      : "0:30",
    src: item.previewUrl, // audio URL
    imageUrl: item.artworkUrl100, // cover image
  }));


      setOnlineResults(mapped);
    } catch (err) {
      console.error("Online search failed", err);
      setOnlineError("Search failed. Please try again.");
    } finally {
      setIsOnlineLoading(false);
    }
  };

  const progressPercent =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="app">
      <div className="app-body">
        <Sidebar activePage={activePage} onChangePage={setActivePage} />

        <main className="main-content">
          <Header />

          {activePage === "home" && (
            <>
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

              <SongList
                songs={filteredSongs}
                currentSong={currentSong}
                onSongClick={handleSongClick}
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
              />
            </>
          )}

          {activePage === "search" && (
            <section className="main-section">
              <h2>Search the internet</h2>
              <p className="section-subtitle">
                Type a song or artist. Results use public iTunes previews.
              </p>

              <form className="add-song-form" onSubmit={handleOnlineSearch}>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search all music (online)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="pill-btn" type="submit">
                  {isOnlineLoading ? "Searching..." : "Search"}
                </button>
              </form>

              {onlineError && (
                <p className="section-subtitle" style={{ color: "#ff7676" }}>
                  {onlineError}
                </p>
              )}

              <div className="song-list">
                {isOnlineLoading && (
                  <div className="song-empty">Loading results…</div>
                )}

                {!isOnlineLoading && onlineResults.length === 0 && (
                  <div className="song-empty">
                    No results yet. Try searching for &quot;AP Dhillon&quot; or
                    &quot;Sidhu Moose Wala&quot;.
                  </div>
                )}

                {!isOnlineLoading &&
  onlineResults.map((song, index) => (
    <div
      key={song.id}
      className={`song-row ${
        currentSong?.id === song.id ? "active" : ""
      }`}
      onClick={() => handleSongClick(song)}
    >
      <span>{index + 1}</span>
      <span className="song-with-cover">
        {song.imageUrl && (
          <img
            src={song.imageUrl}
            alt={song.title}
            className="song-cover"
          />
        )}
        <span>{song.title}</span>
      </span>
      <span>{song.artist}</span>
      <span>{song.duration}</span>
    </div>
  ))}

              </div>
            </section>
          )}

          {activePage === "library" && (
            <section className="main-section">
              <h2>Your Library</h2>
              <p className="section-subtitle">
                Add custom songs to your library (stored in backend memory).
              </p>

              <form className="add-song-form" onSubmit={handleAddSong}>
                <input
                  type="text"
                  placeholder="Title"
                  value={newSong.title}
                  onChange={(e) =>
                    setNewSong((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
                <input
                  type="text"
                  placeholder="Artist"
                  value={newSong.artist}
                  onChange={(e) =>
                    setNewSong((prev) => ({ ...prev, artist: e.target.value }))
                  }
                />
                <input
                  type="text"
                  placeholder="Duration (e.g. 3:21)"
                  value={newSong.duration}
                  onChange={(e) =>
                    setNewSong((prev) => ({
                      ...prev,
                      duration: e.target.value,
                    }))
                  }
                />
                <input
                  type="text"
                  placeholder="File path (e.g. /audio/excuses.mp3)"
                  value={newSong.src}
                  onChange={(e) =>
                    setNewSong((prev) => ({ ...prev, src: e.target.value }))
                  }
                />
                <button type="submit" className="pill-btn">
                  Add Song
                </button>
              </form>

              <div style={{ marginTop: "1rem" }}>
  <h3>All Songs (from backend)</h3>
  <ul className="library-list">
    {songs.map((song) => (
      <li key={song.id} className="library-item">
        <span>
          {song.title} — {song.artist}
        </span>
        <button
          type="button"
          className="delete-btn"
          onClick={() => handleDeleteSong(song.id)}
        >
          ✕
        </button>
      </li>
    ))}
  </ul>
</div>

            </section>
          )}
        </main>
      </div>

      <Player
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPauseClick}
        onNext={playNext}
        onPrev={playPrev}
        currentTime={formatTime(currentTime)}
        duration={formatTime(duration)}
        progressPercent={progressPercent}
        onTimelineClick={handleTimelineClick}
      />

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
