import { useMemo } from "react";

const RANKS = [
  { name: "Wood", min: 0 }, { name: "Bronze", min: 10 },
  { name: "Silver", min: 20 }, { name: "Gold", min: 35 },
  { name: "Platinum", min: 50 }, { name: "Diamond", min: 70 },
  { name: "Champion", min: 90 }, { name: "Titan", min: 120 },
  { name: "Olympian", min: 150 },
];
const MUSCLES = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Core", "Glutes", "Legs"];

function rankFor(reps: number) {
  let index = 0;
  RANKS.forEach((rank, i) => { if (reps >= rank.min) index = i; });
  const current = RANKS[index];
  const next = RANKS[index + 1];
  const progress = next ? Math.max(0, Math.min(100, ((reps - current.min) / (next.min - current.min)) * 100)) : 100;
  return { ...current, index, next, progress };
}

function Emblem({ index, large = false }: { index: number; large?: boolean }) {
  return <span className={large ? "rank-emblem rank-emblem-large rank-emblem-" + index : "rank-emblem rank-emblem-" + index} aria-label={RANKS[index].name + " rank badge"}>
    <svg viewBox="0 0 64 72" aria-hidden="true">
      <path d="M32 3 57 16 53 48 32 68 11 48 7 16Z" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="2.4"/>
      <path d="M32 9 51 19 47 44 32 59 17 44 13 19Z" fill="none" stroke="currentColor" strokeOpacity=".68" strokeWidth="1.2"/>
      <path d="M32 15 37 25 48 27 40 35 42 46 32 41 22 46 24 35 16 27 27 25Z" fill="currentColor" fillOpacity=".95"/>
      <path d="M16 50 32 61 48 50" fill="none" stroke="currentColor" strokeOpacity=".8" strokeWidth="1.5"/>
    </svg>
    <b>{index + 1}</b>
  </span>;
}

type Props = {
  muscleBests: Record<string, number>;
  exerciseBests: Record<string, number>;
  selectedMuscle: string;
  onSelectMuscle: (muscle: string) => void;
  critique: string;
  critiqueBusy: boolean;
  onCritique: () => void;
};

export default function RankCenter({ muscleBests, exerciseBests, selectedMuscle, onSelectMuscle, critique, critiqueBusy, onCritique }: Props) {
  const exerciseRows = useMemo(() => Object.entries(exerciseBests).sort((a,b) => b[1]-a[1]), [exerciseBests]);
  const bestExercise = exerciseRows[0];
  const overall = rankFor(bestExercise?.[1] ?? 0);
  const trackedMuscles = MUSCLES.filter((muscle) => (muscleBests[muscle] ?? 0) > 0).length;
  const trackedExercises = exerciseRows.length;
  return (
    <div className="rank-center">
      <section className="rank-hero">
        <div className="rank-hero-copy">
          <span className="rank-overline">YOUR OVERALL RANK</span>
          <h2>Progress has a name.</h2>
          <p>Your rank reflects your strongest logged set. Every exercise and muscle keeps its own progression.</p>
          <div className="rank-hero-current"><Emblem index={overall.index} large /><div><strong>{overall.name}</strong><small>{bestExercise ? bestExercise[0] + " · " + bestExercise[1] + " best reps" : "Log your first set to begin"}</small></div></div>
        </div>
        <div className="rank-hero-progress">
          <div><span>{overall.next ? "NEXT: " + overall.next.name.toUpperCase() : "TOP RANK REACHED"}</span><b>{Math.round(overall.progress)}%</b></div>
          <div className="rank-progress-track"><i style={{ width: overall.progress + "%" }}/></div>
          <small>{overall.next ? Math.max(0, overall.next.min - (bestExercise?.[1] ?? 0)) + " more reps in one set to next rank" : "Olympian rank"}</small>
        </div>
      </section>

      <section className="rank-stat-grid">
        <article><span>EXERCISES TRACKED</span><strong>{trackedExercises}</strong><small>Individual exercise ranks</small></article>
        <article><span>MUSCLES TRACKED</span><strong>{trackedMuscles} / 8</strong><small>Separate muscle rankings</small></article>
        <article><span>BEST SET REPS</span><strong>{bestExercise?.[1] ?? 0}</strong><small>Highest single-set result</small></article>
      </section>

      <section className="rank-section">
        <div className="rank-section-heading"><div><span className="rank-overline">MUSCLE PROGRESSION</span><h3>Body rankings</h3></div><span>{trackedMuscles} ACTIVE</span></div>
        <div className="rank-muscle-grid">
          {MUSCLES.map((muscle) => {
            const reps = muscleBests[muscle] ?? 0;
            const rank = rankFor(reps);
            return <button type="button" key={muscle} className={selectedMuscle === muscle ? "rank-muscle-card selected" : "rank-muscle-card"} onClick={() => onSelectMuscle(muscle)}>
              <Emblem index={rank.index}/>
              <span><strong>{muscle}</strong><small>{reps} best reps</small></span>
              <b>{rank.name}</b>
            </button>;
          })}
        </div>
      </section>

      <section className="rank-section">
        <div className="rank-section-heading"><div><span className="rank-overline">EXERCISE PROGRESSION</span><h3>Exercise ranks</h3></div><span>{trackedExercises} TRACKED</span></div>
        {exerciseRows.length === 0 ? <div className="rank-empty">Your exercise ranks will appear here after you log your first workout set.</div> :
          <div className="rank-exercise-list">{exerciseRows.slice(0,12).map(([name,reps]) => { const rank = rankFor(reps); return <div className="rank-exercise-row" key={name}><Emblem index={rank.index}/><span><strong>{name}</strong><small>{reps} best reps in one set</small></span><b>{rank.name}</b></div>; })}</div>}
      </section>

      <section className="rank-ai-card">
        <div className="rank-ai-top"><span className="rank-ai-icon">✦</span><div><span className="rank-overline">BANANA INTELLIGENCE</span><h3>Workout critique</h3></div><span className="rank-ai-tag">AI</span></div>
        <p>Get a review of your recent sessions, exercise records, and muscle balance—with practical, non-extreme suggestions.</p>
        <button type="button" className="rank-ai-button" onClick={onCritique} disabled={critiqueBusy}>{critiqueBusy ? "Reviewing your progress…" : "Analyze my workouts"} <span>↗</span></button>
        {critique && <div className="rank-ai-response" aria-live="polite">{critique}</div>}
      </section>
    </div>
  );
}
