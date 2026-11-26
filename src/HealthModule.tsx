import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./modules.css";
import { supabase } from "./lib/supabase";
import BodyDiagram from "./BodyDiagram";

type Exercise = { name: string; muscle: string; hint: string };
type Plan = { id: string; name: string; description: string | null; plan_data: { exercises?: Exercise[] } };
type Session = { id: string; name: string; started_at: string; completed_at: string | null };
type LoggedSet = { id: string; exercise_name: string; muscle_group: string; set_number: number; reps: number; weight: number };

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
  const [muscleTotals, setMuscleTotals] = useState<Record<string, number>>({});
  const [loggedSetCount, setLoggedSetCount] = useState(0);

  async function loadHealth() {
    if (!supabase) return;
    const [{ data: planData, error: planError }, { data: sessionData, error: sessionError }, { data: setData, error: setErrorData }] = await Promise.all([
      supabase.from("workout_plans").select("id,name,description,plan_data").eq("is_archived", false).order("created_at", { ascending: false }),
      supabase.from("workout_sessions").select("id,name,started_at,completed_at").order("started_at", { ascending: false }).limit(12),
      supabase.from("workout_sets").select("muscle_group,reps").limit(2000),
    ]);
    if (planError) setError(planError.message);
    if (sessionError) setError(sessionError.message);
    if (setErrorData) setError(setErrorData.message);
    setPlans((planData ?? []) as Plan[]);
    setHistory((sessionData ?? []) as Session[]);
    const totals: Record<string, number> = {};
    (setData ?? []).forEach((item: { muscle_group: string; reps: number }) => {
      totals[item.muscle_group] = (totals[item.muscle_group] ?? 0) + Number(item.reps || 0);
    });
    setMuscleTotals(totals);
    setLoggedSetCount((setData ?? []).length);
  }

  useEffect(() => { void loadHealth(); }, []);

  const totalReps = Object.values(muscleTotals).reduce((sum, value) => sum + value, 0);
  const rankedMuscles = Object.entries(muscleTotals).sort((a, b) => b[1] - a[1]);
  const selectedRank = Math.max(1, rankedMuscles.findIndex(([name]) => name === selectedMuscle) + 1);
  const completedSessions = history.filter((session) => Boolean(session.completed_at)).length;

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
      const { error: saveError } = await supabase.from("recovery_logs").insert({
        user_id: userData.user.id,
        sleep_hours: recoverySleep === "" ? null : Number(recoverySleep),
        energy_level: Number(energy), soreness_level: Number(soreness),
        notes: recoveryNotes.trim() || null,
      });
      if (saveError) throw saveError;
      setRecoveryNotes("");
      setMessage("Recovery check-in saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't save the check-in.");
    } finally { setBusy(false); }
  }

  return (
    <section className="banana-module health-module">
      <div className="module-heading">
        <div><p className="eyebrow">PHASE 2 · HEALTH</p><h2>Your training workspace</h2><p>Build plans, record sets, review sessions, and check in with recovery.</p></div>
        <span className="module-pill">CLOUD SAVED</span>
      </div>
      {(error || message) && <p className={error ? "module-alert error" : "module-alert"} role="status">{error || message}</p>}

      <section className="health-v3-stats" aria-label="Health overview">
        <article><span>LOGGED REPS</span><strong>{totalReps.toLocaleString()}</strong><small>Across your saved sets</small></article>
        <article><span>SETS TRACKED</span><strong>{loggedSetCount.toLocaleString()}</strong><small>Saved workout sets</small></article>
        <article><span>COMPLETED SESSIONS</span><strong>{completedSessions}</strong><small>In recent history</small></article>
      </section>

      <article className="module-card bodygraph-v3-card">
        <div className="module-card-head"><div><p className="eyebrow">INTERACTIVE BODY MAP</p><h3>Explore your muscle groups</h3><p>Select an area on the diagram or use the muscle buttons.</p></div><span>LIVE DATA</span></div>
        <div className="bodygraph-v3-layout">
          <BodyDiagram selectedMuscle={selectedMuscle} onSelect={(muscle) => { setSelectedMuscle(muscle); setFilter(muscle); }} />
          <aside className="bodygraph-v3-detail">
            <p className="eyebrow">SELECTED MUSCLE</p>
            <h3>{selectedMuscle}</h3>
            <div className="bodygraph-rank"><strong>#{selectedRank}</strong><span>BY TOTAL REPS</span></div>
            <p className="bodygraph-total">{(muscleTotals[selectedMuscle] ?? 0).toLocaleString()} <span>reps logged</span></p>
            <p className="module-footnote">Rankings use the reps saved in your workout sets. Log sets in a workout to update this map.</p>
            <button className="module-small-button" onClick={() => setFilter(selectedMuscle)}>View {selectedMuscle.toLowerCase()} exercises</button>
          </aside>
        </div>
      </article>

      <div className="module-grid two">
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
          <select className="module-input" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option>{["Chest","Back","Shoulders","Biceps","Triceps","Core","Legs"].map((muscle) => <option key={muscle}>{muscle}</option>)}</select>
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
