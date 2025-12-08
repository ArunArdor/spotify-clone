import { useState, useRef, useEffect, useMemo } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import SongList from "./components/SongList";
import Player from "./components/Player";

// 🌐 Backend base URL: env in production, localhost in dev
const rawBase =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const API_BASE = rawBase.replace(/\/+$/, "");                 // remove any trailing /

// Local fallback songs
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
  const [volume, setVolume] = useState(1); // 0.0 - 1.0 (100% by default)


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
        if (!res.ok) throw new Error("Failed to fetch songs");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSongs(data);
        }
      } catch (err) {
        console.log("Backend not running or fetch failed, using local SONGS.", err);
      }
    };

    loadSongs();
  }, []);

  // Local filtering (used on Home page)
  const normalizedQuery = useMemo(
    () => searchQuery.toLowerCase().trim(),
    [searchQuery]
  );

  const filteredSongs = useMemo(() => {
    if (normalizedQuery === "") return songs;
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(normalizedQuery) ||
        song.artist.toLowerCase().includes(normalizedQuery)
    );
  }, [songs, normalizedQuery]);

  const getActiveList = () => {
    if (activePage === "search" && onlineResults.length > 0) {
      return onlineResults;
    }
    if (filteredSongs.length > 0) {
      return filteredSongs;
    }
    return songs;
  };

  // Click on song from any list (local or online)
  const handleSongClick = (song) => {                     // If we clicked the same song → just toggle play/pause, don't reset
  if (currentSong?.id === song.id) {
    setIsPlaying((prev) => !prev);
    return;
  }

  // If it's a new song → start that song from the beginning
  setCurrentSong(song);
  setIsPlaying(true);
};


  // Play / Pause button in player
  const handlePlayPauseClick = () => {
    if (!currentSong) {
      const list = getActiveList();
      const firstSong = list[0];
      if (!firstSong) return;
      setCurrentSong(firstSong);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  // ▶▶ Next song
  const playNext = () => {
    const list = getActiveList();

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
    const list = getActiveList();

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

    // When the current song changes, load its source and (optionally) start from 0
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentSong) {
      audio.pause();
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    // set src only when song changes
    audio.src = currentSong.src;

    // start this new song from the beginning
    audio.currentTime = 0;
    setCurrentTime(0);

    // if we are supposed to be playing, start
    if (isPlaying) {
      audio
        .play()
        .catch((err) => console.log("Autoplay blocked or error:", err));
    }
  }, [currentSong]); // 👈 only runs when currentSong changes

  // When play/pause changes, just control playback (don't touch src or time)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      audio
        .play()
        .catch((err) => console.log("Autoplay blocked or error:", err));
    } else {
      audio.pause();
    }
  }, [isPlaying]); // 👈 only runs when play/pause toggles

    // Volume effect – keep audio element in sync with volume state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume; // 0.0 - 1.0
  }, [volume]);

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

// Seek when user drags the timeline slider (percent: 0–100)
const handleSeek = (percent) => {
  if (!duration || !audioRef.current) return;
  const newTime = (percent / 100) * duration;
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

  // 🗑 Delete-song handler (DELETE /api/songs/:id)
  const handleDeleteSong = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this song from your library?"
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_BASE}/api/songs/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        // If backend says "not found", just treat as already deleted
        if (res.status === 404) {
          console.warn("Song not found on backend, removing locally");
          setSongs((prev) => prev.filter((song) => song.id !== id));
          if (currentSong?.id === id) {
            setCurrentSong(null);
            setIsPlaying(false);
          }
          return;
        }

        const text = await res.text();
        console.error("Delete failed:", res.status, text);
        alert("Error deleting song (status " + res.status + ")");
        return;
      }

      // Success case
      setSongs((prev) => prev.filter((song) => song.id !== id));

      if (currentSong?.id === id) {
        setCurrentSong(null);
        setIsPlaying(false);
      }
    } catch (err) {
      console.error("Delete request error:", err);
      alert("Error deleting song (network error)");
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
        `${API_BASE}/api/search?term=${encodeURIComponent(q)}`
      );
      if (!res.ok) throw new Error("Search request failed");
      const data = await res.json();

      const mapped =
        (data.results || [])
          .filter((item) => item.previewUrl)
          .map((item, idx) => ({
            id: item.trackId || idx,
            title: item.trackName,
            artist: item.artistName,
            duration: item.trackTimeMillis
              ? formatTime(item.trackTimeMillis / 1000)
              : "0:30",
            src: item.previewUrl,
            imageUrl: item.artworkUrl100,
          })) || [];

      setOnlineResults(mapped);
    } catch (err) {
      console.error("Online search failed", err);
      setOnlineError("Search failed. Please try again.");
    } finally {
      setIsOnlineLoading(false);
    }
  };

  const progressPercent = useMemo(
    () => (duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0),
    [currentTime, duration]
  );

  const remainingSeconds = Math.max(0, duration - currentTime);

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
        currentTime={formatTime(currentTime)}                 // left timer
        duration={formatTime(duration)}                       // (optional, not shown now)
        remainingTime={`-${formatTime(remainingSeconds)}`}    // right timer, counts down
        progressPercent={progressPercent}
        onSeek={handleSeek}
        volume={volume}
        onVolumeChange={(newVolume) => setVolume(newVolume)}
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
