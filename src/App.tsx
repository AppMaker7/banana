function BananaMark() {
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label="BANANA logo">
      <path d="M27 25 17 39c12 37 35 57 66 56 12 0 22-5 29-14-28 8-55-9-72-44L27 25Z" fill="none" stroke="#FFE44D" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m27 25-9 13 13 8M103 81l9 1-5 10" fill="none" stroke="#35DDF5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function App() {
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><BananaMark /></span><span>BANANA</span></div>
        <span className="status"><i /> FOUNDATION</span>
      </header>

      <section className="welcome">
        <p className="eyebrow">YOUR PERSONAL ECOSYSTEM</p>
        <h1>Make room for<br /><span>what matters.</span></h1>
        <p className="intro">Health, focus and everyday progress — brought together in one place.</p>
        <div className="feature-grid">
          <article className="feature-card">
            <span className="feature-icon yellow">✳</span>
            <p className="card-label">COMING INTO FOCUS</p>
            <h2>Health</h2>
            <p>Workouts, movement and music in one flow.</p>
          </article>
          <article className="feature-card">
            <span className="feature-icon cyan">◷</span>
            <p className="card-label">TAKE BACK YOUR TIME</p>
            <h2>Focus</h2>
            <p>Intentional sessions and timed app breaks.</p>
          </article>
        </div>
        <div className="build-note"><span className="pulse" /> BANANA FOUNDATION IS SET UP <span className="note-line" /></div>
      </section>
      <footer>BUILT WITH INTENTION <span>© BANANA</span></footer>
    </main>
  );
}