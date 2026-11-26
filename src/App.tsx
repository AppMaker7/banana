import { useEffect, useState } from "react";
import HealthModule from "./HealthModule";
import FocusModule from "./FocusModule";

type Tab = "Home" | "Health" | "Focus" | "AI" | "Music" | "Settings";

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
  { name: "AI", icon: "✦" },
  { name: "Music", icon: "♫" },
  { name: "Settings", icon: "⚙" },
];

function App() {
  const [active, setActive] = useState<Tab>("Home");
  const [playing, setPlaying] = useState(false);
  const [focusEnabled, setFocusEnabled] = useState(false);
  const [workoutPreview, setWorkoutPreview] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState("");
  const [expandedMuscle, setExpandedMuscle] = useState("");
  const [repInputs, setRepInputs] = useState<Record<string, string>>({});
  const [repTotals, setRepTotals] = useState<Record<string, number>>(() => {
    try {
      const saved = window.localStorage.getItem("banana-muscle-rep-totals-v1");
      if (!saved) return {};
      const parsed = JSON.parse(saved) as Record<string, number>;
      return Object.fromEntries(
        Object.entries(parsed).filter(([key, value]) =>
          typeof key === "string" && typeof value === "number" &&
          Number.isFinite(value) && value >= 0
        )
      );
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("banana-muscle-rep-totals-v1", JSON.stringify(repTotals));
    } catch {
      // Keep the workout usable if browser storage is unavailable or full.
    }
  }, [repTotals]);
  const muscleData = [
    { name: "Chest", exercises: ["Push-ups", "Dumbbell floor press", "Incline push-ups"] },
    { name: "Back", exercises: ["One-arm dumbbell rows", "Superman raises", "Reverse snow angels"] },
    { name: "Shoulders", exercises: ["Dumbbell shoulder press", "Pike push-ups", "Arm circles"] },
    { name: "Biceps", exercises: ["Dumbbell curls", "Hammer curls"] },
    { name: "Triceps", exercises: ["Close-grip push-ups", "Overhead dumbbell extensions"] },
    { name: "Core", exercises: ["Crunches", "Dead bugs", "Bicycle crunches"] },
    { name: "Legs", exercises: ["Bodyweight squats", "Reverse lunges", "Calf raises"] },
  ];
  const muscleRank = (name: string) => [...muscleData].sort((a, b) => muscleTotal(b.name) - muscleTotal(a.name)).findIndex((group) => group.name === name) + 1;
  const muscleTotal = (name: string) => selectedGroupFor(name).exercises.reduce((sum, exercise) => sum + (repTotals[name + ":" + exercise] ?? 0), 0);
  const selectedGroupFor = (name: string) => muscleData.find((group) => group.name === name) ?? muscleData[0];
  const logExerciseReps = (muscle: string, exercise: string) => {
    const key = muscle + ":" + exercise;
    const amount = Math.max(0, Math.floor(Number(repInputs[key] ?? "0")));
    if (!amount) return;
    setRepTotals((current) => ({ ...current, [key]: (current[key] ?? 0) + amount }));
    setRepInputs((current) => ({ ...current, [key]: "" }));
  };

  const title = active === "Home" ? "Your day, in balance." : active === "Health" ? "Move with intention." : active === "Focus" ? "Take back your time." : active === "AI" ? "Make a plan that works." : active === "Music" ? "Set your soundtrack." : "Make it yours.";

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
          ) : active === "Health" ? (
            <section className="workout-dashboard">
              <section className="muscle-ranking-section">
                <div className="health-section-title">
                  <div><p className="eyebrow">YOUR BODYGRAPH</p><h2>Muscle rankings</h2></div>
                  <span className="workout-tag">BY TOTAL REPS</span>
                </div>
                <p className="muscle-helper">Tap a highlighted area to see that muscle group’s rank, then open it below to log reps.</p>
                <div className="bodygraph-card">
                  <div className="bodygraph-label">BODYGRAPH <span>FRONT + BACK</span></div>
                  <div className="bodygraph-figures">
                    <svg className="bodygraph-svg" viewBox="0 0 360 260" role="group" aria-label="Interactive front and back muscle map">
                      <g className="body-silhouette">
                        <circle cx="93" cy="27" r="17" /><path d="M79 46 L67 55 L49 62 L39 86 L48 115 L57 109 L62 91 L69 83 L68 126 L61 170 L66 212 L82 212 L91 168 L96 137 L101 168 L110 212 L126 212 L130 170 L117 126 L118 83 L125 91 L130 109 L139 115 L148 86 L137 62 L119 55 L107 46Z" />
                        <circle cx="267" cy="27" r="17" /><path d="M253 46 L241 55 L223 62 L213 86 L222 115 L231 109 L236 91 L243 83 L242 126 L235 170 L240 212 L256 212 L265 168 L270 137 L275 168 L284 212 L300 212 L304 170 L291 126 L292 83 L299 91 L304 109 L313 115 L322 86 L311 62 L293 55 L281 46Z" />
                      </g>
                      <g className="body-muscles">
                        <path className={selectedMuscle === "Shoulders" ? "muscle-zone active" : "muscle-zone"} d="M65 59 Q48 57 44 77 L56 91 L72 78Z M121 59 Q138 57 142 77 L130 91 L114 78Z" onClick={() => setSelectedMuscle("Shoulders")} role="button" tabIndex={0} aria-label="Select shoulders" />
                        <path className={selectedMuscle === "Chest" ? "muscle-zone active" : "muscle-zone"} d="M72 67 Q91 56 93 76 L91 105 Q75 108 67 91Z M96 76 Q99 56 116 67 L121 91 Q113 108 97 105Z" onClick={() => setSelectedMuscle("Chest")} role="button" tabIndex={0} aria-label="Select chest" />
                        <path className={selectedMuscle === "Biceps" ? "muscle-zone active" : "muscle-zone"} d="M47 91 L59 94 L53 125 L43 120Z M127 94 L139 91 L143 120 L133 125Z" onClick={() => setSelectedMuscle("Biceps")} role="button" tabIndex={0} aria-label="Select biceps" />
                        <path className={selectedMuscle === "Triceps" ? "muscle-zone active" : "muscle-zone"} d="M221 91 L233 94 L227 125 L217 120Z M301 94 L313 91 L317 120 L307 125Z" onClick={() => setSelectedMuscle("Triceps")} role="button" tabIndex={0} aria-label="Select triceps" />
                        <path className={selectedMuscle === "Core" ? "muscle-zone active" : "muscle-zone"} d="M76 108 L113 108 L109 150 L80 150Z" onClick={() => setSelectedMuscle("Core")} role="button" tabIndex={0} aria-label="Select core" />
                        <path className={selectedMuscle === "Back" ? "muscle-zone active" : "muscle-zone"} d="M246 66 L288 66 L296 105 L270 137 L238 105Z" onClick={() => setSelectedMuscle("Back")} role="button" tabIndex={0} aria-label="Select back" />
                        <path className={selectedMuscle === "Legs" ? "muscle-zone active" : "muscle-zone"} d="M68 153 L91 153 L86 207 L68 207Z M97 153 L119 153 L128 207 L110 207Z M242 153 L265 153 L260 207 L242 207Z M271 153 L293 153 L302 207 L284 207Z" onClick={() => setSelectedMuscle("Legs")} role="button" tabIndex={0} aria-label="Select legs" />
                      </g>
                    </svg>
                  </div>
                  <div className="bodygraph-legend"><span><i /> Selected muscle</span><small>Tap a body area</small></div>
                  <div className="bodygraph-rank-pop">
                    <div><span className="bodygraph-rank-kicker">SELECTED MUSCLE</span><strong>{selectedMuscle || "Choose a muscle"}</strong></div>
                    <div className="bodygraph-rank-value"><b>{selectedMuscle ? "#" + muscleRank(selectedMuscle) : "—"}</b><span>RANK</span></div>
                    <div className="bodygraph-reps">{selectedMuscle ? muscleTotal(selectedMuscle).toLocaleString() : "0"} <span>total reps</span></div>
                  </div>
                </div>
                <div className="muscle-groups-heading"><div><p className="eyebrow">YOUR TRAINING BREAKDOWN</p><h3>Muscle groups</h3></div><span>Tap to expand</span></div>
                <div className="muscle-accordion">
                  {muscleData.map((group) => {
                    const isOpen = expandedMuscle === group.name;
                    return (
                      <div className={isOpen ? "muscle-accordion-item expanded" : "muscle-accordion-item"} key={group.name}>
                        <button
                          className={isOpen ? "muscle-rank-row selected" : "muscle-rank-row"}
                          aria-expanded={isOpen}
                          onClick={() => { setExpandedMuscle(isOpen ? "" : group.name); setSelectedMuscle(group.name); }}
                        >
                          <span className="muscle-rank-number">#{[...muscleData].sort((x,y) => muscleTotal(y.name)-muscleTotal(x.name)).findIndex((item) => item.name === group.name) + 1}</span>
                          <span className="muscle-rank-name">{group.name}</span>
                          <strong>{muscleTotal(group.name).toLocaleString()} <small>reps</small></strong>
                          <span className="muscle-chevron">{isOpen ? "⌄" : "›"}</span>
                        </button>
                        {isOpen && (
                          <div className="muscle-dropdown">
                            <div className="muscle-exercise-heading">
                              <div><p className="eyebrow">EXERCISES</p><h3>{group.name}</h3></div>
                              <strong>{muscleTotal(group.name).toLocaleString()} <small>total reps</small></strong>
                            </div>
                            {group.exercises.map((exercise) => {
                              const key = group.name + ":" + exercise;
                              return <div className="muscle-exercise-row" key={key}>
                                <div className="muscle-exercise-info"><strong>{exercise}</strong><small>{(repTotals[key] ?? 0).toLocaleString()} reps logged</small></div>
                                <input aria-label={"Reps for " + exercise} type="number" min="1" inputMode="numeric" placeholder="Reps" value={repInputs[key] ?? ""} onChange={(event) => setRepInputs((current) => ({...current, [key]: event.target.value}))} />
                                <button onClick={() => logExerciseReps(group.name, exercise)} disabled={!Number(repInputs[key] ?? "0")}>Add</button>
                              </div>;
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="health-welcome">
                <div>
                  <p className="eyebrow">YOUR TRAINING SPACE</p>
                  <h2>Build strength.<br /><span>Stay consistent.</span></h2>
                  <p className="health-intro">Your workouts, progress, and recovery — all in one place.</p>
                </div>
                <div className="health-mark">✳</div>
              </div>

              <div className="health-stats">
                <article className="health-stat"><span>WORKOUTS THIS WEEK</span><strong>0 <small>/ 3</small></strong><div className="health-progress"><i style={{width:"0%"}} /></div></article>
                <article className="health-stat"><span>TIME TRAINED</span><strong>0<small> min</small></strong><p>Start a session to track time</p></article>
                <article className="health-stat"><span>LAST SESSION</span><strong className="last-session">Not yet</strong><p>Your history starts here</p></article>
              </div>

              <div className="health-section-title">
                <div><p className="eyebrow">PICK UP WHERE YOU LEFT OFF</p><h2>Today's workout</h2></div>
                <span className="workout-tag">STRENGTH</span>
              </div>

              <article className="today-workout-card">
                <div className="today-workout-top">
                  <div className="workout-icon-large">✳</div>
                  <div className="today-workout-meta"><span>YOUR PLAN</span><strong>Chest + Back</strong><small>Upper body · Personal routine</small></div>
                  <span className="workout-arrow">↗</span>
                </div>
                <div className="workout-divider" />
                <div className="workout-details">
                  <div><strong>3</strong><span>movements</span></div>
                  <div><strong>Bodyweight +</strong><span>light dumbbells</span></div>
                  <div><strong>Flexible</strong><span>take your time</span></div>
                </div>
                <button className="start-workout-button" onClick={() => setWorkoutPreview(!workoutPreview)}>{workoutPreview ? "Workout preview opened" : "View workout"} <span>→</span></button>
                {workoutPreview && <p className="workout-preview-note">Your workout preview is ready. Exercise tracking and saved sessions are coming next.</p>}
              </article>



              <div className="health-lower-grid">
                <article className="health-panel">
                  <div className="health-panel-heading"><div><p className="eyebrow">THIS WEEK</p><h3>Activity</h3></div><span>WEEKLY</span></div>
                  <div className="week-days">
                    {["M","T","W","T","F","S","S"].map((day, index) => <div className="week-day" key={index}><span>{day}</span><i /></div>)}
                  </div>
                  <p className="empty-activity">Your completed workouts will show up here.</p>
                </article>
                <article className="health-panel">
                  <div className="health-panel-heading"><div><p className="eyebrow">QUICK ACCESS</p><h3>Your tools</h3></div></div>
                  <button className="health-tool-row" onClick={() => setWorkoutPreview(true)}><span className="health-tool-icon">▤</span><span><strong>Workout plan</strong><small>See today's routine</small></span><b>→</b></button>
                  <button className="health-tool-row" onClick={() => setWorkoutPreview(true)}><span className="health-tool-icon cyan-tool">◷</span><span><strong>Workout history</strong><small>Sessions will appear here</small></span><b>→</b></button>
                </article>
              </div>
            </section>
            <HealthModule />
          ) : active === "Focus" ? (
            <FocusModule />
          ) : (
            <section className="placeholder-panel">
              <div className="placeholder-symbol">{active === "Focus" ? "◷" : "⚙"}</div>
              <p className="eyebrow">{active.toUpperCase()} MODULE</p>
              <h2>{active === "Focus" ? "Make focus work for you." : "Your setup, your rules."}</h2>
              <p>{active === "Focus" ? "Choose apps, complete a movement challenge, and earn a timed unlock. Essential apps always stay available." : "Themes, sounds, notifications, and personal preferences will be managed here."}</p>
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
