import { useState, useRef, useEffect } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import SongList from "./components/SongList";
import Player from "./components/Player";

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
  const [songs, setSongs] = useState(SONGS); // now main source of truth
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // seconds
  const [duration, setDuration] = useState(0); // seconds
  const [searchQuery, setSearchQuery] = useState("");
  const [activePage, setActivePage] = useState("home"); // "home" | "search" | "library"

  const [newSong, setNewSong] = useState({
  title: "",
  artist: "",
  duration: "",
  src: "",
});

  const audioRef = useRef(null);

  // 🔥 Fetch from backend using Fetch API
  useEffect(() => {
    const loadSongs = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/songs");
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

  // Filter songs based on search
  const normalizedQuery = searchQuery.toLowerCase().trim();
  const filteredSongs =
    normalizedQuery === ""
      ? songs
      : songs.filter(
          (song) =>
            song.title.toLowerCase().includes(normalizedQuery) ||
            song.artist.toLowerCase().includes(normalizedQuery)
        );

  // Click on song from list
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
      const firstSong = filteredSongs[0] || songs[0];
      if (!firstSong) return;
      setCurrentSong(firstSong);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  // ▶▶ Next song
  const playNext = () => {
    const list = filteredSongs.length > 0 ? filteredSongs : songs;

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
    const list = filteredSongs.length > 0 ? filteredSongs : songs;

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

  const handleAddSong = async (e) => {
  e.preventDefault();

  if (!newSong.title || !newSong.artist || !newSong.duration || !newSong.src) {
    alert("Please fill all fields");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSong),
    });

  const text = await res.text();
  console.log("POST /api/songs status:", res.status, text);

    if (!res.ok) {
    throw new Error(`Failed to add song: ${res.status} ${text}`);
  }
    const created = JSON.parse(text);

    // Update UI with the new song
    setSongs((prev) => [...prev, created]);

    // Clear the form
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
            <>
              <section className="main-section">
                <h2>Search</h2>
                <p className="section-subtitle">
                  Search inside your songs by title or artist.
                </p>
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
          setNewSong((prev) => ({ ...prev, duration: e.target.value }))
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
      <ul>
        {songs.map((song) => (
          <li key={song.id}>
            {song.title} — {song.artist}
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
