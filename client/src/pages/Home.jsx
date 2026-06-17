// The launcher landing page (route "/", and what the installed PWA opens to).
// Presents the two ways into the one app: the teacher's Admin Panel and the
// projected Game Screen. Plain anchors (not router links) so each screen mounts
// fresh; the SPA fallback + service worker serve them offline.
function Home() {
  return (
    <main className="launcher">
      <h1>Space Race</h1>
      <p className="launcher-tagline">Classroom English quiz race</p>

      <nav className="launcher-choices" aria-label="Choose a screen">
        <a className="launcher-card nes-container is-dark" href="/admin">
          <span className="launcher-icon" aria-hidden="true">⚙</span>
          <span className="launcher-label">Teacher</span>
          <span className="launcher-sub">Admin Panel</span>
        </a>
        <a className="launcher-card nes-container is-dark" href="/game">
          <span className="launcher-icon" aria-hidden="true">▶</span>
          <span className="launcher-label">Projector</span>
          <span className="launcher-sub">Game Screen</span>
        </a>
      </nav>
    </main>
  )
}

export default Home
