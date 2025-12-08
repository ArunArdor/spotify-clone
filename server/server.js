const express = require("express");
const cors = require("cors");

// FIXED fetch import for node-fetch v3 compatibility
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory songs list
let songs = [
  { id: 1, title: "Excuses", artist: "AP Dhillon", duration: "2:56", src: "/audio/excuses.mp3" },
  { id: 2, title: "Brown Munde", artist: "AP Dhillon, Gurinder Gill", duration: "4:10", src: "/audio/brown-munde.mp3" },
  { id: 3, title: "295", artist: "Sidhu Moose Wala", duration: "4:32", src: "/audio/295.mp3" },
  { id: 4, title: "Insane", artist: "AP Dhillon, Gurinder Gill, Shinda Kahlon", duration: "3:40", src: "/audio/insane.mp3" },
];

let nextId = songs.length + 1;

// GET all songs
app.get("/api/songs", (req, res) => {
  res.json(songs);
});

// POST add new song
app.post("/api/songs", (req, res) => {
  const { title, artist, duration, src } = req.body;

  if (!title || !artist || !duration || !src) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const newSong = { id: nextId++, title, artist, duration, src };
  songs.push(newSong);
  res.status(201).json(newSong);
});

// DELETE song
app.delete("/api/songs/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = songs.findIndex((song) => song.id === id);

  if (index === -1) return res.status(404).json({ message: "Song not found" });

  const removed = songs[index];
  songs.splice(index, 1);
  res.json({ message: "Song deleted", song: removed });
});

// PROXY for iTunes search (works on iPhone + Safari)
app.get("/api/search", async (req, res) => {
  try {
    const term = req.query.term;
    if (!term) return res.status(400).json({ message: "Missing term" });

    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=25`
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("iTunes Proxy Error:", err);
    res.status(500).json({ message: "Proxy search failed" });
  }
});

app.get("/", (req, res) => {
  res.send("Spotify backend is running");
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
