export default function SongList({
  songs,
  currentSong,
  onSongClick,
  searchQuery,
  onSearchChange,
}) {
  return (
    <section className="main-section">
      <div className="songs-header-row">
        <h2>Your Songs</h2>
        <input
          type="text"
          className="search-input"
          placeholder="Search songs or artists"
          value={searchQuery}
          onChange={onSearchChange}
        />
      </div>

      <div className="song-list">
        <div className="song-list-header">
          <span>#</span>
          <span>Title</span>
          <span>Artist</span>
          <span>Duration</span>
        </div>

        {songs.length === 0 ? (
          <div className="song-empty">No songs found.</div>
        ) : (
          songs.map((song, index) => (
            <div
              key={song.id}
              className={`song-row ${
                currentSong?.id === song.id ? "active" : ""
              }`}
              onClick={() => onSongClick(song)}
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
  );
}
