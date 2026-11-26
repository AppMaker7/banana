import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./modules.css";
import { supabase } from "./lib/supabase";
import BodyDiagram from "./BodyDiagram";
import RankCenter from "./RankCenter";

type Exercise = { name: string; muscle: string; hint: string };
type Plan = { id: string; name: string; description: string | null; plan_data: { exercises?: Exercise[] } };
type Session = { id: string; name: string; started_at: string; completed_at: string | null };
type LoggedSet = { id: string; exercise_name: string; muscle_group: string; set_number: number; reps: number; weight: number };
const MUSCLE_GROUPS = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Core", "Glutes", "Legs"];
const REP_RANKS = [
  { name: "Wood", min: 0 }, { name: "Bronze", min: 10 },
  { name: "Silver", min: 20 }, { name: "Gold", min: 35 },
  { name: "Platinum", min: 50 }, { name: "Diamond", min: 70 },
  { name: "Champion", min: 90 }, { name: "Titan", min: 120 },
  { name: "Olympian", min: 150 },
];
function getMuscleRank(reps: number) {
  const index = REP_RANKS.reduce((best, rank, i) => reps >= rank.min ? i : best, 0);
  const current = REP_RANKS[index];
  const next = REP_RANKS[index + 1] ?? null;
  const progress = next ? Math.max(0, Math.min(100, ((reps - current.min) / (next.min - current.min)) * 100)) : 100;
  return { ...current, next, progress };
}

const library: Exercise[] = [
  { name: "Push-ups", muscle: "Chest", hint: "Bodyweight · controlled reps" },
  { name: "Incline push-ups", muscle: "Chest", hint: "Bodyweight · adjustable difficulty" },
  { name: "Dumbbell floor press", muscle: "Chest", hint: "Light dumbbells · floor" },
  { name: "One-arm dumbbell row", muscle: "Back", hint: "Light dumbbell · each side" },
  { name: "Superman raises", muscle: "Back", hint: "Bodyweight · slow and controlled" },
  { name: "Reverse snow angels", muscle: "Back", hint: "Bodyweight · gentle range" },
  { name: "Dumbbell curls", muscle: "Biceps", hint: "Light dumbbells" },
  { name: "Hammer curls", muscle: "Biceps", hint: "Light dumbbells" },
  { name: "Overhead triceps extension", muscle: "Triceps", hint: "Light dumbbell" },
  { name: "Dumbbell shoulder press", muscle: "Shoulders", hint: "Light dumbbells" },
  { name: "Dead bugs", muscle: "Core", hint: "Bodyweight · steady breathing" },
  { name: "Bodyweight squats", muscle: "Legs", hint: "Bodyweight · comfortable range" },
  { name: "Reverse lunges", muscle: "Legs", hint: "Bodyweight · controlled steps" },
  { name: "Glute bridges", muscle: "Glutes", hint: "Bodyweight · controlled movement" },
  { name: "Bodyweight hip hinges", muscle: "Glutes", hint: "Bodyweight · comfortable range" },
];

export default function HealthModule() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [history, setHistory] = useState<Session[]>([]);
  const [planName, setPlanName] = useState("My workout");
  const [selected, setSelected] = useState<string[]>(["Push-ups", "One-arm dumbbell row"]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [activeExercises, setActiveExercises] = useState<Exercise[]>([]);
  const [sets, setSets] = useState<LoggedSet[]>([]);
  const [reps, setReps] = useState<Record<string, string>>({});
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [recoverySleep, setRecoverySleep] = useState("8");
  const [energy, setEnergy] = useState("3");
  const [soreness, setSoreness] = useState("2");
  const [recoveryNotes, setRecoveryNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("All");
  const [selectedMuscle, setSelectedMuscle] = useState("Chest");
  const [muscleBests, setMuscleBests] = useState<Record<string, number>>({});
  const [exerciseBests, setExerciseBests] = useState<Record<string, number>>({});
  const [healthView, setHealthView] = useState<"Rank" | "Bodygraph" | "Leagues" | "Gallery">("Rank");
  const [critique, setCritique] = useState("");
  const [critiqueBusy, setCritiqueBusy] = useState(false);

  async function loadHealth() {
    if (!supabase) return;
    const [{ data: planData, error: planError }, { data: sessionData, error: sessionError }] = await Promise.all([
      supabase.from("workout_plans").select("id,name,description,plan_data").eq("is_archived", false).order("created_at", { ascending: false }),
      supabase.from("workout_sessions").select("id,name,started_at,completed_at").order("started_at", { ascending: false }).limit(12),
    ]);
    if (planError) setError(planError.message);
    if (sessionError) setError(sessionError.message);
    setPlans((planData ?? []) as Plan[]);
    setHistory((sessionData ?? []) as Session[]);
    const allSets: { muscle_group: string; exercise_name: string; reps: number }[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error: setErrorData } = await supabase.from("workout_sets")
        .select("muscle_group,exercise_name,reps").order("created_at", { ascending: true }).range(offset, offset + 999);
      if (setErrorData) { setError(setErrorData.message); break; }
      allSets.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    const bests: Record<string, number> = {};
    MUSCLE_GROUPS.forEach((muscle) => { bests[muscle] = 0; });
    allSets.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(bests, item.muscle_group)) {
        const setReps = Math.max(0, Number(item.reps || 0));
        bests[item.muscle_group] = Math.max(bests[item.muscle_group], setReps);
      }
    });
    setMuscleBests(bests);
    const exerciseScores: Record<string, number> = {};
    allSets.forEach((item) => {
      const name = String(item.exercise_name || "");
      if (name) exerciseScores[name] = Math.max(exerciseScores[name] ?? 0, Math.max(0, Number(item.reps || 0)));
    });
    setExerciseBests(exerciseScores);
  }

  useEffect(() => { void loadHealth(); }, []);

  const selectedReps = muscleBests[selectedMuscle] ?? 0;
  const selectedRank = getMuscleRank(selectedReps);

  async function runWorkoutCritique() {
    if (!supabase) return;
    setCritiqueBusy(true); setError(""); setCritique("");
    try {
      const recent = history.slice(0, 6).map((session) => ({
        name: session.name,
        date: session.started_at,
        completed: Boolean(session.completed_at),
      }));
      const { data, error: aiError } = await supabase.functions.invoke("banana-ai", {
        body: {
          message: "Review my logged workout progress. Give a concise, supportive critique: identify what is being tracked, what looks balanced or underrepresented, and one practical next step. Do not infer body composition or prescribe intense training. Use only the supplied records and clearly say when data is too limited.",
          context: { recentSessions: recent, exerciseBestReps: exerciseBests, muscleBestReps: muscleBests },
        },
      });
      if (aiError) throw aiError;
      if (typeof data?.reply !== "string" || !data.reply.trim()) throw new Error(data?.error || "BANANA AI did not return a review.");
      setCritique(data.reply.trim());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Workout critique is unavailable right now.");
    } finally { setCritiqueBusy(false); }
  }

  const filteredLibrary = useMemo(
    () => library.filter((item) => filter === "All" || item.muscle === filter),
    [filter],
  );

  async function createPlan() {
    if (!supabase || !planName.trim() || selected.length === 0) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Log in again to save a workout.");
      const exercises = library.filter((item) => selected.includes(item.name));
      const { data, error: saveError } = await supabase.from("workout_plans").insert({
        user_id: userData.user.id,
        name: planName.trim(),
        description: "Created in BANANA Health",
        plan_data: { exercises },
      }).select("id,name,description,plan_data").single();
      if (saveError) throw saveError;
      setPlans((current) => [data as Plan, ...current]);
      setMessage("Workout plan saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't save this workout.");
    } finally { setBusy(false); }
  }

  async function startSession(plan?: Plan) {
    if (!supabase || activeSession) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Log in again to start a workout.");
      const exercises = plan?.plan_data?.exercises ?? library.filter((item) => selected.includes(item.name));
      const { data, error: startError } = await supabase.from("workout_sessions").insert({
        user_id: userData.user.id,
        plan_id: plan?.id ?? null,
        name: plan?.name ?? "Quick workout",
      }).select("id,name,started_at,completed_at").single();
      if (startError) throw startError;
      setActiveSession(data as Session);
      setActiveExercises(exercises.length ? exercises : library.slice(0, 2));
      setSets([]);
      setMessage("Workout started. Log each set as you go.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't start the workout.");
    } finally { setBusy(false); }
  }

  async function loadSets(sessionId: string) {
    if (!supabase) return;
    const { data, error: loadError } = await supabase.from("workout_sets")
      .select("id,exercise_name,muscle_group,set_number,reps,weight")
      .eq("session_id", sessionId).order("created_at", { ascending: true });
    if (loadError) setError(loadError.message);
    setSets((data ?? []) as LoggedSet[]);
  }

  async function logSet(exercise: Exercise) {
    if (!supabase || !activeSession) return;
    const count = Math.floor(Number(reps[exercise.name] ?? ""));
    const weight = Number(weights[exercise.name] ?? "0");
    if (!Number.isFinite(count) || count < 1 || !Number.isFinite(weight) || weight < 0) {
      setError("Enter a valid rep count and a non-negative weight.");
      return;
    }
    setBusy(true); setError("");
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Your session expired. Log in again.");
      const setNumber = sets.filter((item) => item.exercise_name === exercise.name).length + 1;
      const { error: insertError } = await supabase.from("workout_sets").insert({
        session_id: activeSession.id, user_id: userData.user.id,
        exercise_name: exercise.name, muscle_group: exercise.muscle,
        set_number: setNumber, reps: count, weight,
      });
      if (insertError) throw insertError;
      setReps((current) => ({ ...current, [exercise.name]: "" }));
      await loadSets(activeSession.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't log that set.");
    } finally { setBusy(false); }
  }

  async function finishSession() {
    if (!supabase || !activeSession) return;
    setBusy(true); setError("");
    try {
      const { error: finishError } = await supabase.from("workout_sessions")
        .update({ completed_at: new Date().toISOString() }).eq("id", activeSession.id);
      if (finishError) throw finishError;
      setMessage("Workout saved to your history.");
      setActiveSession(null); setActiveExercises([]); setSets([]);
      await loadHealth();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't finish the workout.");
    } finally { setBusy(false); }
  }

  async function saveRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Log in again to save recovery.");
      const { error: saveError } = await supabase.from("recovery_logs").upsert({
        user_id: userData.user.id,
        sleep_hours: recoverySleep === "" ? null : Number(recoverySleep),
        energy_level: Number(energy), soreness_level: Number(soreness),
        notes: recoveryNotes.trim() || null,
      }, { onConflict: "user_id,logged_on" });
      if (saveError) throw saveError;
      setRecoveryNotes("");
      setMessage("Recovery check-in saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't save the check-in.");
    } finally { setBusy(false); }
  }

  return (
    <section className="banana-module health-module">
      {(error || message) && <p className={error ? "module-alert error" : "module-alert"} role="status">{error || message}</p>}

      <nav className="bodygraph-tabs rank-tabs" aria-label="Health sections">
        {(["Rank", "Bodygraph", "Leagues", "Gallery"] as const).map((tab) => (
          <button type="button" key={tab} className={healthView === tab ? "bodygraph-tab-active" : "bodygraph-tab-muted"} aria-pressed={healthView === tab} onClick={() => setHealthView(tab)}>{tab}</button>
        ))}
      </nav>

      {healthView === "Rank" && (
        <RankCenter
          muscleBests={muscleBests}
          exerciseBests={exerciseBests}
          selectedMuscle={selectedMuscle}
          onSelectMuscle={(muscle) => { setSelectedMuscle(muscle); setFilter(muscle); }}
          critique={critique}
          critiqueBusy={critiqueBusy}
          onCritique={() => void runWorkoutCritique()}
        />
      )}

      {healthView === "Bodygraph" && (
        <>
          <article className="bodygraph-screen">
            <BodyDiagram selectedMuscle={selectedMuscle} onSelect={(muscle) => { setSelectedMuscle(muscle); setFilter(muscle); }} />
          </article>
          <section className="bodygraph-rankings" id="muscle-rankings">
            <div className="bodygraph-rankings-heading"><h3>Muscle Rankings</h3><span aria-label="Ranks are based on your best single set">ⓘ</span></div>
            <div className="bodygraph-selected-summary">
              <div><span className="bodygraph-summary-label">SELECTED MUSCLE</span><h4>{selectedMuscle}</h4></div>
              <div className="bodygraph-summary-score"><strong>{selectedReps}</strong><span>BEST REPS IN ONE SET</span></div>
              <div className="bodygraph-summary-rank"><span>CURRENT RANK</span><strong>{selectedRank.name}</strong></div>
            </div>
            <div className="bodygraph-rankings-grid">
              {MUSCLE_GROUPS.map((muscle) => {
                const best = muscleBests[muscle] ?? 0;
                const rank = getMuscleRank(best);
                return <button type="button" key={muscle} className={selectedMuscle === muscle ? "bodygraph-rank-tile selected" : "bodygraph-rank-tile"} onClick={() => { setSelectedMuscle(muscle); setFilter(muscle); }}>
                  <span>{muscle}</span><strong>{rank.name}</strong><small>{best.toLocaleString()} best reps</small>
                </button>;
              })}
            </div>
            <p className="module-footnote">Ranks use your highest logged rep count in one set for each muscle group. Sets are never added together.</p>
          </section>
        </>
      )}

      {healthView === "Leagues" && (
        <section className="rank-feature-panel">
          <div className="rank-feature-kicker">BANANA LEAGUES</div>
          <h2>Your progress, your pace.</h2>
          <p>Leagues are a personal progression view for now. Your rank is calculated from your best logged set, not lifetime reps or workout volume.</p>
          <div className="rank-league-current"><span>YOUR CURRENT TIER</span><strong>{getMuscleRank(Math.max(0, ...Object.values(exerciseBests))).name}</strong><small>{Object.keys(exerciseBests).length} exercises tracked</small></div>
          <p className="module-footnote">Social leaderboards will only appear when there is a real, privacy-safe ranking source. No placeholder competitors or invented scores.</p>
        </section>
      )}

      {healthView === "Gallery" && (
        <section className="rank-feature-panel">
          <div className="rank-feature-kicker">RANK GALLERY</div>
          <h2>All nine ranks.</h2>
          <p>Unlock each tier by improving your best consecutive-rep set on an exercise or muscle group.</p>
          <div className="rank-gallery-grid">
            {REP_RANKS.map((rank, index) => <div className="rank-gallery-item" key={rank.name}><span className={"rank-emblem rank-emblem-" + index}><b>{index + 1}</b></span><strong>{rank.name}</strong><small>{rank.min}+ reps</small></div>)}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <article className="bodygraph-last-workout">
          <div className="bodygraph-last-copy">
            <p className="bodygraph-last-label">LAST WORKOUT</p>
            <h3>{history[0].name}</h3>
            <p>{history[0].completed_at ? "Workout completed · " : "Workout in progress · "}{new Date(history[0].started_at).toLocaleDateString()}</p>
          </div>
          <a className="bodygraph-improvements-button" href="#health-workout-builder" onClick={() => setHealthView("Bodygraph")}>SEE BODYGRAPH</a>
        </article>
      )}

      <div className="module-grid two" id="health-workout-builder">
        <article className="module-card">
          <div className="module-card-head"><div><p className="eyebrow">WORKOUT BUILDER</p><h3>Create a plan</h3></div><span>01</span></div>
          <label className="module-label">Plan name<input className="module-input" value={planName} onChange={(event) => setPlanName(event.target.value)} maxLength={100} /></label>
          <div className="module-pick-list">
            {library.map((item) => <label key={item.name} className="module-pick"><input type="checkbox" checked={selected.includes(item.name)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, item.name] : current.filter((name) => name !== item.name))} /><span><strong>{item.name}</strong><small>{item.muscle} · {item.hint}</small></span></label>)}
          </div>
          <button className="module-primary" disabled={busy || !planName.trim() || selected.length === 0} onClick={() => void createPlan()}>{busy ? "Saving…" : "Save workout plan"}</button>
        </article>

        <article className="module-card">
          <div className="module-card-head"><div><p className="eyebrow">YOUR PLANS</p><h3>Saved workouts</h3></div><span>{plans.length} PLANS</span></div>
          {plans.length === 0 ? <p className="module-empty">Your saved plans will appear here. Create one on the left to get started.</p> : plans.map((plan) => (
            <div className="module-list-row" key={plan.id}>
              <div><strong>{plan.name}</strong><small>{plan.plan_data?.exercises?.length ?? 0} exercises</small></div>
              <button className="module-small-button" disabled={busy || Boolean(activeSession)} onClick={() => void startSession(plan)}>Start</button>
            </div>
          ))}
          {!activeSession && <button className="module-secondary" disabled={busy} onClick={() => void startSession()}>Start a quick workout</button>}
          {activeSession && <div className="active-workout">
            <div className="active-workout-top"><div><p className="eyebrow">IN PROGRESS</p><strong>{activeSession.name}</strong></div><span>LIVE</span></div>
            {activeExercises.map((exercise) => {
              const logged = sets.filter((item) => item.exercise_name === exercise.name);
              return <div className="set-entry" key={exercise.name}>
                <div className="set-entry-title"><strong>{exercise.name}</strong><small>{logged.length} sets logged</small></div>
                <div className="set-entry-fields">
                  <label>Reps<input className="module-input" type="number" min="1" max="500" inputMode="numeric" value={reps[exercise.name] ?? ""} onChange={(event) => setReps((current) => ({ ...current, [exercise.name]: event.target.value }))} /></label>
                  <label>Weight<input className="module-input" type="number" min="0" step="0.5" inputMode="decimal" placeholder="0" value={weights[exercise.name] ?? ""} onChange={(event) => setWeights((current) => ({ ...current, [exercise.name]: event.target.value }))} /></label>
                  <button className="module-small-button" disabled={busy || !reps[exercise.name]} onClick={() => void logSet(exercise)}>Log set</button>
                </div>
                {logged.map((item) => <small className="logged-set" key={item.id}>Set {item.set_number}: {item.reps} reps · {item.weight} weight</small>)}
              </div>;
            })}
            <button className="module-primary" disabled={busy} onClick={() => void finishSession()}>Finish workout</button>
          </div>}
        </article>
      </div>

      <div className="module-grid two">
        <article className="module-card">
          <div className="module-card-head"><div><p className="eyebrow">EXERCISE LIBRARY</p><h3>Find a movement</h3></div><span>{filteredLibrary.length} MOVES</span></div>
          <select className="module-input" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option>{["Chest","Back","Shoulders","Biceps","Triceps","Core","Glutes","Legs"].map((muscle) => <option key={muscle}>{muscle}</option>)}</select>
          <div className="module-library-list">{filteredLibrary.map((item) => <div className="module-list-row" key={item.name}><div><strong>{item.name}</strong><small>{item.muscle} · {item.hint}</small></div><button className="module-text-button" onClick={() => setSelected((current) => current.includes(item.name) ? current : [...current, item.name])}>Add to plan +</button></div>)}</div>
        </article>
        <article className="module-card">
          <div className="module-card-head"><div><p className="eyebrow">WORKOUT HISTORY</p><h3>Recent sessions</h3></div><span>{history.length} RECENT</span></div>
          {history.length === 0 ? <p className="module-empty">Completed sessions will show up here.</p> : history.map((session) => <div className="module-list-row" key={session.id}><div><strong>{session.name}</strong><small>{new Date(session.started_at).toLocaleString()} · {session.completed_at ? "Completed" : "In progress"}</small></div><span className="module-status">{session.completed_at ? "SAVED" : "OPEN"}</span></div>)}
        </article>
      </div>

      <article className="module-card recovery-card">
        <div className="module-card-head"><div><p className="eyebrow">RECOVERY CHECK-IN</p><h3>How are you feeling today?</h3><p>Use this to notice patterns, not to judge yourself. Rest is part of progress.</p></div><span>04</span></div>
        <form className="recovery-form" onSubmit={saveRecovery}>
          <label className="module-label">Sleep (hours)<input className="module-input" type="number" min="0" max="24" step="0.5" value={recoverySleep} onChange={(event) => setRecoverySleep(event.target.value)} /></label>
          <label className="module-label">Energy<select className="module-input" value={energy} onChange={(event) => setEnergy(event.target.value)}>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} / 5</option>)}</select></label>
          <label className="module-label">Soreness<select className="module-input" value={soreness} onChange={(event) => setSoreness(event.target.value)}>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} / 5</option>)}</select></label>
          <label className="module-label">Notes<input className="module-input" value={recoveryNotes} onChange={(event) => setRecoveryNotes(event.target.value)} maxLength={500} placeholder="Anything worth noting?" /></label>
          <button className="module-primary" disabled={busy}>Save check-in</button>
        </form>
      </article>
      <p className="module-footnote">Keep workouts comfortable and technique-focused. Stop if something hurts, and give yourself recovery time.</p>
    </section>
  );
}
