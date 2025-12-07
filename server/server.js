const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// In-memory songs list
let SONGS = [
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

// GET all songs
app.get("/api/songs", (req, res) => {
  res.json(SONGS);
});

// POST a new song
app.post("/api/songs", (req, res) => {
  const { title, artist, duration, src } = req.body;

  if (!title || !artist || !duration || !src) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const newSong = {
    id: SONGS.length ? SONGS[SONGS.length - 1].id + 1 : 1,
    title,
    artist,
    duration,
    src,
  };

  SONGS.push(newSong);
  console.log("Song added:", newSong);
  res.status(201).json(newSong);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
