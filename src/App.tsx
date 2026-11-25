import { useState } from "react";

type Tab = "Home" | "Health" | "Focus" | "Settings";

function BananaMark() {
  return (
    <svg viewBox="0 0 120 120" aria-label="BANANA" role="img">
      <path d="M27 25 17 39c12 37 35 57 66 56 12 0 22-5 29-14-28 8-55-9-72-44L27 25Z" fill="none" stroke="#FFE44D" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m27 25-9 13 13 8M103 81l9 1-5 10" fill="none" stroke="#35DDF5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const navItems: { name: Tab; icon: string }[] = [
  { name: "Home", icon: "⌂" },
  { name: "Health", icon: "✳" },
  { name: "Focus", icon: "◷" },
  { name: "Settings", icon: "⚙" },
];

function App() {
  const [active, setActive] = useState<Tab>("Home");
  const [playing, setPlaying] = useState(false);
  const [focusEnabled, setFocusEnabled] = useState(false);

  const title = active === "Home" ? "Your day, in balance." : active === "Health" ? "Move with intention." : active === "Focus" ? "Take back your time." : "Make it yours.";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><BananaMark /></span><span>BANANA</span></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button key={item.name} className={active === item.name ? "nav-item active" : "nav-item"} onClick={() => setActive(item.name)}>
              <span className="nav-icon">{item.icon}</span><span>{item.name}</span>
              {active === item.name && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><span className="tip-icon">✦</span><p>Small steps.<br /><strong>Real momentum.</strong></p></div>
          <div className="profile-mini"><div className="avatar">B</div><div><strong>Your space</strong><span>Personal account</span></div><span className="more">···</span></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><BananaMark /></span><strong>BANANA</strong></div>
        </header>

        <div className="content">
          <section className="greeting-row">
            <div><p className="eyebrow">YOUR PERSONAL ECOSYSTEM</p><h1>{title}</h1><p className="subheading">A little progress today adds up to something bigger.</p></div>
            <div className="date-chip"><span className="date-dot" /> TODAY'S OVERVIEW</div>
          </section>

          {active === "Home" ? (
            <>
              <section className="stat-grid">
                <article className="stat-card"><div className="stat-top"><span>DAILY MOMENTUM</span><span className="stat-symbol yellow-text">↗</span></div><div className="stat-value">68<span>%</span></div><div className="stat-foot"><div className="progress-track"><i style={{ width: "68%" }} /></div><small>Keep your rhythm going</small></div></article>
                <article className="stat-card"><div className="stat-top"><span>FOCUS TIME</span><span className="stat-symbol cyan-text">◷</span></div><div className="stat-value">1<span>h</span> 24<span>m</span></div><div className="stat-foot"><small>Time well spent today</small></div></article>
                <article className="stat-card"><div className="stat-top"><span>WORKOUTS THIS WEEK</span><span className="stat-symbol yellow-text">✳</span></div><div className="stat-value">3<span>/ 4</span></div><div className="stat-foot"><small>One step at a time</small></div></article>
              </section>

              <section className="section-heading"><div><p className="eyebrow">YOUR TOOLS</p><h2>Make today count.</h2></div><button className="text-button" onClick={() => setActive("Settings")}>Customize dashboard <span>↗</span></button></section>

              <section className="feature-grid">
                <article className="feature-card health-card">
                  <div className="card-head"><span className="card-icon yellow-bg">✳</span><span className="card-kicker">HEALTH</span><span className="arrow">↗</span></div>
                  <h3>Build your<br /><em>strength.</em></h3>
                  <p>Plan a workout, track your sets, and keep your music close.</p>
                  <button className="card-button yellow-button" onClick={() => setActive("Health")}>Open Health <span>→</span></button>
                  <div className="orbit orbit-one" /><div className="orbit orbit-two" />
                </article>
                <article className="feature-card focus-card">
                  <div className="card-head"><span className="card-icon cyan-bg">◷</span><span className="card-kicker">FOCUS MODE</span><span className="arrow">↗</span></div>
                  <h3>Own your<br /><em>attention.</em></h3>
                  <p>Complete a challenge to earn a timed break from selected app limits.</p>
                  <button className="card-button cyan-button" onClick={() => setActive("Focus")}>Open Focus <span>→</span></button>
                  <div className="focus-rings"><span /><span /><span /></div>
                </article>
              </section>

              <section className="lower-grid">
                <article className="panel routine-panel">
                  <div className="panel-heading"><div><p className="eyebrow">UP NEXT</p><h2>Your routine</h2></div><button className="more-button" aria-label="More routine options">···</button></div>
                  <div className="routine-item"><div className="routine-icon yellow-bg">✳</div><div className="routine-copy"><strong>Chest & back</strong><span>Strength · 35–45 min</span></div><span className="routine-time">TODAY</span></div>
                  <div className="routine-item"><div className="routine-icon cyan-bg">◷</div><div className="routine-copy"><strong>Focused study</strong><span>Deep work · 25 min</span></div><span className="routine-time">LATER</span></div>
                </article>
                <article className="panel music-panel">
                  <div className="panel-heading"><div><p className="eyebrow">WORKOUT SOUNDTRACK</p><h2>Keep the energy.</h2></div><span className="music-wave">▂ ▅ ▃ ▆ ▄</span></div>
                  <div className="track-row"><div className="album-art"><span>♫</span></div><div className="track-copy"><strong>Workout mix</strong><span>Your playlist · Ready when you are</span></div><button className="play-button" onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause music" : "Play music"}>{playing ? "Ⅱ" : "▶"}</button></div>
                  <div className="music-note">{playing ? "PLAYER PREVIEW · PLAYING" : "MUSIC CONTROLS WILL FOLLOW YOU INTO WORKOUTS"}</div>
                </article>
              </section>
            </>
          ) : (
            <section className="placeholder-panel">
              <div className="placeholder-symbol">{active === "Health" ? "✳" : active === "Focus" ? "◷" : "⚙"}</div>
              <p className="eyebrow">{active.toUpperCase()} MODULE</p>
              <h2>{active === "Health" ? "Your training space is next." : active === "Focus" ? "Make focus work for you." : "Your setup, your rules."}</h2>
              <p>{active === "Health" ? "Workout planning, exercise tracking, recovery, and an in-workout music player will live here." : active === "Focus" ? "Choose apps, complete a movement challenge, and earn a timed unlock. Essential apps always stay available." : "Themes, sounds, notifications, and personal preferences will be managed here."}</p>
              {active === "Focus" && <button className={focusEnabled ? "card-button cyan-button" : "card-button yellow-button"} onClick={() => setFocusEnabled(!focusEnabled)}>{focusEnabled ? "Focus preview enabled" : "Preview Focus Mode"} <span>→</span></button>}
              <button className="back-link" onClick={() => setActive("Home")}>← Back to dashboard</button>
            </section>
          )}
          <footer className="footer"><span>BUILT WITH INTENTION</span><span>BANANA © 2026</span></footer>
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.map((item) => <button key={item.name} className={active === item.name ? "mobile-nav-item active" : "mobile-nav-item"} onClick={() => setActive(item.name)}><span>{item.icon}</span><small>{item.name}</small></button>)}
      </nav>
    </div>
  );
}

export default App;
