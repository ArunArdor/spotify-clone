export default function Sidebar({ activePage, onChangePage }) {
  const makeClass = (page) =>
    "nav-item" + (activePage === page ? " active" : "");

  return (
    <aside className="sidebar">
      <div className="logo">Spotify Clone</div>

      <nav className="nav-section">
        <div
          className={makeClass("home")}
          onClick={() => onChangePage("home")}
        >
          🏠 Home
        </div>
        <div
          className={makeClass("search")}
          onClick={() => onChangePage("search")}
        >
          🔍 Search
        </div>
        <div
          className={makeClass("library")}
          onClick={() => onChangePage("library")}
        >
          📚 Your Library
        </div>
      </nav>

      <div className="nav-section">
        <div className="nav-title">Playlists</div>
        <div className="nav-item">🔥 Liked Songs</div>
        <div className="nav-item">💪 Gym Vibes</div>
        <div className="nav-item">🧠 Study Mode</div>
      </div>
    </aside>
  );
}
