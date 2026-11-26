import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

type FocusLog = {
  id: string; started_at: string; ended_at: string | null;
  planned_minutes: number; completed_minutes: number | null;
  challenge_type: string | null; challenge_completed: boolean;
};

const challenges = [
  "Stand up and gently stretch",
  "Take a short, comfortable walk",
  "Rest your eyes away from the screen",
  "Get a glass of water",
];

function clock(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return mins + ":" + secs;
}

export default function FocusModule() {
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [challenge, setChallenge] = useState(challenges[0]);
  const [challengeDone, setChallengeDone] = useState(false);
  const [history, setHistory] = useState<FocusLog[]>([]);
  const [breakEarned, setBreakEarned] = useState(0);
  const [breakMinutes, setBreakMinutes] = useState(10);
  const [breakRemaining, setBreakRemaining] = useState(0);
  const [breakRunning, setBreakRunning] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadHistory() {
    if (!supabase) return;
    const { data, error: loadError } = await supabase.from("focus_sessions")
      .select("id,started_at,ended_at,planned_minutes,completed_minutes,challenge_type,challenge_completed")
      .order("started_at", { ascending: false }).limit(12);
    if (loadError) setError(loadError.message);
    setHistory((data ?? []) as FocusLog[]);
  }

  useEffect(() => { void loadHistory(); }, []);

  async function finishSession(completed: boolean) {
    if (!supabase || !sessionId) return;
    const elapsed = Math.max(0, Math.floor((minutes * 60 - remaining) / 60));
    setRunning(false);
    try {
      const { error: finishError } = await supabase.from("focus_sessions").update({
        ended_at: new Date().toISOString(),
        completed_minutes: completed ? minutes : elapsed,
        challenge_completed: challengeDone,
      }).eq("id", sessionId);
      if (finishError) throw finishError;
      setMessage(completed ? "Focus session complete. Nice work." : "Session ended and saved.");
      setBreakEarned(completed ? breakMinutes : 0);
      setBreakRemaining(completed ? breakMinutes * 60 : 0);
      setBreakRunning(false);
      setSessionId(null);
      setRemaining(minutes * 60);
      await loadHistory();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't save the focus session.");
    }
  }

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          void finishSession(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, sessionId, minutes, challengeDone]);

  useEffect(() => {
    if (!breakRunning) return;
    const timer = window.setInterval(() => {
      setBreakRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setBreakRunning(false);
          setBreakEarned(0);
          setMessage("Your break timer is complete.");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [breakRunning]);

  async function startSession() {
    if (!supabase || sessionId) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Log in again to start a focus session.");
      const { data, error: startError } = await supabase.from("focus_sessions").insert({
        user_id: userData.user.id,
        planned_minutes: minutes,
        challenge_type: challenge,
        challenge_completed: false,
      }).select("id").single();
      if (startError) throw startError;
      setSessionId(data.id as string);
      setRemaining(minutes * 60);
      setChallengeDone(false);
      setBreakEarned(0);
      setBreakRemaining(0);
      setBreakRunning(false);
      setRunning(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't start focus mode.");
    } finally { setBusy(false); }
  }

  function changeMinutes(value: number) {
    if (sessionId) return;
    setMinutes(value);
    setRemaining(value * 60);
  }

  const progress = sessionId ? Math.max(0, Math.min(100, ((minutes * 60 - remaining) / (minutes * 60)) * 100)) : 0;

  return (
    <section className="banana-module">
      <div className="module-heading">
        <div><p className="eyebrow">PHASE 3 · FOCUS MODE</p><h2>Protect your attention.</h2><p>Set a focus block, take a mindful break, and keep a record of your sessions.</p></div>
        <span className="module-pill">SESSION TRACKER</span>
      </div>
      {(error || message) && <p className={error ? "module-alert error" : "module-alert"} role="status">{error || message}</p>}
      <div className="focus-layout">
        <article className="module-card focus-timer-card">
          <div className="module-card-head"><div><p className="eyebrow">DEEP WORK TIMER</p><h3>{running ? "You're in focus mode" : sessionId ? "Session paused" : "Ready when you are"}</h3></div><span>{sessionId ? "ACTIVE" : "READY"}</span></div>
          <div className="focus-clock">{clock(remaining)}</div>
          <div className="focus-progress"><i style={{ width: progress + "%" }} /></div>
          <div className="focus-duration">
            {[15,25,45,60].map((value) => <button key={value} className={minutes === value ? "duration-chip selected" : "duration-chip"} disabled={Boolean(sessionId)} onClick={() => changeMinutes(value)}>{value} min</button>)}
          </div>
          {!sessionId ? <button className="module-primary focus-main-button" disabled={busy} onClick={() => void startSession()}>{busy ? "Starting…" : "Start focus session"}</button> : (
            <div className="focus-controls">
              <button className="module-secondary" onClick={() => setRunning((value) => !value)}>{running ? "Pause" : "Resume"}</button>
              <button className="module-primary" onClick={() => void finishSession(false)}>End session</button>
            </div>
          )}
          {breakEarned > 0 && <div className="break-earned"><strong>{breakEarned}-minute break timer available</strong><span>{breakRunning ? "Break in progress" : breakRemaining > 0 ? "Paused at " + clock(breakRemaining) : "Start it when you are ready."} · This does not unlock or block other Android apps.</span><div className="break-controls">{!breakRunning ? <button className="module-small-button" onClick={() => { if (breakRemaining === 0) setBreakRemaining(breakMinutes * 60); setBreakRunning(true); }}>{breakRemaining > 0 ? "Resume break" : "Start break"}</button> : <button className="module-secondary" onClick={() => setBreakRunning(false)}>Pause break</button>}<button className="module-secondary" onClick={() => { setBreakRunning(false); setBreakRemaining(0); setBreakEarned(0); }}>End break</button></div></div>}
        </article>
        <article className="module-card">
          <div className="module-card-head"><div><p className="eyebrow">OPTIONAL RESET</p><h3>Choose a break challenge</h3><p>Gentle options — no exercise test required.</p></div><span>RESET</span></div>
          <label className="module-label">Break duration<select className="module-input" value={breakMinutes} onChange={(event) => setBreakMinutes(Number(event.target.value))} disabled={Boolean(sessionId)}>{[5,10,15,20].map((value) => <option key={value} value={value}>{value} minutes</option>)}</select></label>
          <label className="module-label">Break activity<select className="module-input" value={challenge} onChange={(event) => setChallenge(event.target.value)} disabled={Boolean(sessionId)}>{challenges.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="challenge-check"><input type="checkbox" checked={challengeDone} onChange={(event) => setChallengeDone(event.target.checked)} disabled={!sessionId} /><span><strong>Mark my reset complete</strong><small>Optional. You can finish a focus session without completing it.</small></span></label>
          <div className="focus-info">
            <strong>What this web version can do</strong>
            <p>Track timers, sessions, and break history. It cannot pause or block other Android apps. System-wide app restrictions would need a separately installed Android companion with the required permissions.</p>
          </div>
          <button className="module-secondary" onClick={() => { if (sessionId) { void finishSession(false); } else { setRunning(false); setRemaining(minutes * 60); setChallengeDone(false); setBreakRunning(false); setBreakRemaining(0); setBreakEarned(0); setMessage("Focus timer reset. No app restrictions were changed."); } }}>Emergency stop / reset</button>
        </article>
      </div>
      <article className="module-card">
        <div className="module-card-head"><div><p className="eyebrow">YOUR ACTIVITY</p><h3>Focus history</h3></div><span>{history.length} RECENT</span></div>
        {history.length === 0 ? <p className="module-empty">Your completed focus sessions will appear here.</p> : history.map((item) => <div className="module-list-row" key={item.id}><div><strong>{item.completed_minutes ?? 0} of {item.planned_minutes} minutes</strong><small>{new Date(item.started_at).toLocaleString()} · {item.challenge_type ?? "No break activity"}</small></div><span className="module-status">{item.ended_at ? "SAVED" : "OPEN"}</span></div>)}
      </article>
    </section>
  );
}
