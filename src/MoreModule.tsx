import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "./lib/supabase";

type Section = "Overview" | "Calendar" | "Journal" | "Discover" | "Achievements" | "Community";
type FriendConnection = { id: string; friend_id: string; display_name: string; status: "pending" | "accepted" | "rejected"; requested_by: string; created_at: string; incoming: boolean };
type FriendChallenge = { id: string; creator_id: string; participant_id: string; title: string; metric: "workouts" | "focus_minutes" | "completed_tasks"; target: number; starts_on: string; ends_on: string; status: "pending" | "accepted" | "declined" | "completed"; created_at: string };
type Task = { id: string; title: string; notes: string | null; priority: string; due_at: string | null; completed_at: string | null; created_at: string };
type Workout = { id: string; name: string; started_at: string; completed_at: string | null };
type FocusLog = { id: string; started_at: string; completed_minutes: number | null };
type SetLog = { id: string; exercise_name: string; muscle_group: string; reps: number; weight: number; created_at: string };
type Achievement = { id: string; name: string; description: string; category: string; icon: string | null };
type JournalEntry = { id: string; title: string; body: string; created_at: string };
const movements = [
  { name: "Push-ups", group: "Chest", type: "Push", cue: "Keep your body in one steady line and use a comfortable range." },
  { name: "Incline push-ups", group: "Chest", type: "Push", cue: "Use a stable raised surface and move with control." },
  { name: "Dumbbell floor press", group: "Chest", type: "Push", cue: "Keep the weights light and wrists comfortably stacked." },
  { name: "One-arm dumbbell row", group: "Back", type: "Pull", cue: "Support yourself on a stable surface and avoid twisting." },
  { name: "Reverse snow angels", group: "Back", type: "Mobility", cue: "Use a small, comfortable range without forcing your shoulders." },
  { name: "Dumbbell curls", group: "Arms", type: "Pull", cue: "Keep elbows near your sides and avoid swinging." },
  { name: "Hammer curls", group: "Arms", type: "Pull", cue: "Keep the movement smooth and use a manageable weight." },
  { name: "Overhead triceps extension", group: "Arms", type: "Push", cue: "Use a light weight and stop if your shoulders feel uncomfortable." },
  { name: "Dumbbell shoulder press", group: "Shoulders", type: "Push", cue: "Use a light load and avoid arching your back." },
  { name: "Dead bugs", group: "Core", type: "Core", cue: "Move slowly while keeping your breathing steady." },
  { name: "Bodyweight squats", group: "Legs", type: "Lower body", cue: "Use a comfortable depth and keep your feet stable." },
  { name: "Glute bridges", group: "Glutes", type: "Lower body", cue: "Move smoothly without forcing the top position." },
];
function localDay(value: string | Date) {
  const date = new Date(value);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}
function dateLabel(value: string) {
  return new Date(value + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
export default function MoreModule() {
  const [section, setSection] = useState<Section>("Overview");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [focus, setFocus] = useState<FocusLog[]>([]);
  const [sets, setSets] = useState<SetLog[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entryTitle, setEntryTitle] = useState("");
  const [entryBody, setEntryBody] = useState("");
  const [selectedDate, setSelectedDate] = useState(localDay(new Date()));
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [friendCode, setFriendCode] = useState("");
  const [friendInput, setFriendInput] = useState("");
  const [connections, setConnections] = useState<FriendConnection[]>([]);
  const [challenges, setChallenges] = useState<FriendChallenge[]>([]);
  const [challengeTitle, setChallengeTitle] = useState("Weekly consistency");
  const [challengeMetric, setChallengeMetric] = useState<"workouts" | "focus_minutes" | "completed_tasks">("workouts");
  const [challengeTarget, setChallengeTarget] = useState("3");
  const [challengeEnd, setChallengeEnd] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 7); return localDay(d); });

  async function load() {
    if (!supabase) { setLoading(false); return; }
    setError("");
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("Log in again to load your BANANA data.");
      const uid = auth.user.id;
      const [taskRows, workoutRows, focusRows, setRows, achievementRows, unlockRows, settings, profile, connectionRows, challengeRows] = await Promise.all([
        supabase.from("tasks").select("id,title,notes,priority,due_at,completed_at,created_at").order("created_at", { ascending: false }).limit(250),
        supabase.from("workout_sessions").select("id,name,started_at,completed_at").order("started_at", { ascending: false }).limit(250),
        supabase.from("focus_sessions").select("id,started_at,completed_minutes").order("started_at", { ascending: false }).limit(250),
        supabase.from("workout_sets").select("id,exercise_name,muscle_group,reps,weight,created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("achievements").select("id,name,description,category,icon").order("category"),
        supabase.from("user_achievements").select("achievement_id").eq("user_id", uid),
        supabase.from("user_settings").select("preferences").eq("user_id", uid).maybeSingle(),
        supabase.from("profiles").select("friend_code").eq("id", uid).maybeSingle(),
        supabase.rpc("list_banana_connections"),
        supabase.from("friend_challenges").select("id,creator_id,participant_id,title,metric,target,starts_on,ends_on,status,created_at").order("created_at", { ascending: false }).limit(100),
      ]);
      for (const result of [taskRows, workoutRows, focusRows, setRows, achievementRows, unlockRows, settings, profile, connectionRows, challengeRows]) if (result.error) throw result.error;
      setTasks((taskRows.data ?? []) as Task[]);
      setWorkouts((workoutRows.data ?? []) as Workout[]);
      setFocus((focusRows.data ?? []) as FocusLog[]);
      setSets((setRows.data ?? []) as SetLog[]);
      setAchievements((achievementRows.data ?? []) as Achievement[]);
      setUnlocked(new Set((unlockRows.data ?? []).map((row: { achievement_id: string }) => row.achievement_id)));
      setFriendCode(String(profile.data?.friend_code ?? ""));
      setConnections((connectionRows.data ?? []) as FriendConnection[]);
      setChallenges((challengeRows.data ?? []) as FriendChallenge[]);
      const preferences = (settings.data?.preferences ?? {}) as Record<string, unknown>;
      const savedEntries = Array.isArray(preferences.journal_entries) ? preferences.journal_entries : [];
      setEntries(savedEntries.filter((row): row is JournalEntry => Boolean(row && typeof row === "object" && typeof (row as JournalEntry).id === "string" && typeof (row as JournalEntry).body === "string")) as JournalEntry[]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't load your BANANA workspace.");
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const completedWorkouts = workouts.filter((row) => Boolean(row.completed_at));
  const completedTasks = tasks.filter((row) => Boolean(row.completed_at));
  const focusMinutes = focus.reduce((sum, row) => sum + Math.max(0, row.completed_minutes ?? 0), 0);
  const bestSet = sets.reduce((best, row) => Math.max(best, Number(row.reps) || 0), 0);
  const selectedTasks = tasks.filter((row) => row.due_at && localDay(row.due_at) === selectedDate);
  const selectedWorkouts = workouts.filter((row) => localDay(row.started_at) === selectedDate);
  const filteredMovements = useMemo(() => movements.filter((row) => filter === "All" || row.group === filter), [filter]);

  async function sendFriendRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !friendInput.trim()) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("Log in again to connect with a friend.");
      const { data, error: lookupError } = await supabase.rpc("find_banana_friend", { p_code: friendInput.trim().toUpperCase() });
      if (lookupError) throw lookupError;
      const friend = Array.isArray(data) ? data[0] : data;
      if (!friend?.id) throw new Error("No BANANA account matched that friend code.");
      const [userA, userB] = [auth.user.id, String(friend.id)].sort();
      const { error: insertError } = await supabase.from("friend_connections").insert({
        user_a: userA, user_b: userB, requested_by: auth.user.id, status: "pending",
      });
      if (insertError?.code === "23505") throw new Error("A connection request already exists for that account.");
      if (insertError) throw insertError;
      setFriendInput("");
      setMessage("Friend request sent to " + String(friend.display_name || "your friend") + ".");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't send that friend request.");
    } finally { setBusy(false); }
  }

  async function respondToFriend(id: string, status: "accepted" | "rejected") {
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { error: updateError } = await supabase.from("friend_connections").update({ status }).eq("id", id);
      if (updateError) throw updateError;
      setMessage(status === "accepted" ? "Friend connection accepted." : "Friend request declined.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't update that friend request.");
    } finally { setBusy(false); }
  }

  async function createFriendChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const friend = connections.find((row) => row.status === "accepted" && row.friend_id === (event.currentTarget.elements.namedItem("challenge-friend") as HTMLSelectElement | null)?.value);
    if (!friend) { setError("Choose an accepted friend first."); return; }
    const target = Math.floor(Number(challengeTarget));
    if (!challengeTitle.trim() || !Number.isFinite(target) || target < 1 || !challengeEnd) {
      setError("Add a title, a valid target, and an end date."); return;
    }
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("Log in again to create a challenge.");
      const { error: insertError } = await supabase.from("friend_challenges").insert({
        creator_id: auth.user.id, participant_id: friend.friend_id, title: challengeTitle.trim(),
        metric: challengeMetric, target, starts_on: localDay(new Date()), ends_on: challengeEnd, status: "pending",
      });
      if (insertError) throw insertError;
      setMessage("Challenge invitation sent.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't create that challenge.");
    } finally { setBusy(false); }
  }

  async function respondToChallenge(id: string, status: "accepted" | "declined") {
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { error: updateError } = await supabase.from("friend_challenges").update({ status }).eq("id", id);
      if (updateError) throw updateError;
      setMessage(status === "accepted" ? "Challenge accepted." : "Challenge declined.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't update that challenge.");
    } finally { setBusy(false); }
  }

  function ownChallengeProgress(challenge: FriendChallenge) {
    const start = new Date(challenge.starts_on + "T00:00:00").getTime();
    const end = new Date(challenge.ends_on + "T23:59:59").getTime();
    const inRange = (value: string | null) => Boolean(value && new Date(value).getTime() >= start && new Date(value).getTime() <= end);
    if (challenge.metric === "workouts") return workouts.filter((row) => Boolean(row.completed_at) && inRange(row.completed_at)).length;
    if (challenge.metric === "completed_tasks") return tasks.filter((row) => inRange(row.completed_at)).length;
    return focus.filter((row) => inRange(row.started_at)).reduce((sum, row) => sum + Math.max(0, row.completed_minutes ?? 0), 0);
  }

  async function saveJournal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !entryBody.trim()) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("Log in again to save a journal entry.");
      const { data: current, error: readError } = await supabase.from("user_settings").select("preferences").eq("user_id", auth.user.id).maybeSingle();
      if (readError) throw readError;
      const preferences = (current?.preferences ?? {}) as Record<string, unknown>;
      const entry: JournalEntry = { id: crypto.randomUUID(), title: entryTitle.trim().slice(0, 100) || "Quick note", body: entryBody.trim().slice(0, 3000), created_at: new Date().toISOString() };
      const nextEntries = [entry, ...entries].slice(0, 100);
      const { error: saveError } = await supabase.from("user_settings").upsert({ user_id: auth.user.id, preferences: { ...preferences, journal_entries: nextEntries } }, { onConflict: "user_id" });
      if (saveError) throw saveError;
      setEntries(nextEntries); setEntryTitle(""); setEntryBody(""); setMessage("Journal entry saved to your account.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't save your journal entry.");
    } finally { setBusy(false); }
  }

  async function deleteJournal(id: string) {
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("Log in again to edit your journal.");
      const { data: current, error: readError } = await supabase.from("user_settings").select("preferences").eq("user_id", auth.user.id).maybeSingle();
      if (readError) throw readError;
      const preferences = (current?.preferences ?? {}) as Record<string, unknown>;
      const nextEntries = entries.filter((entry) => entry.id !== id);
      const { error: saveError } = await supabase.from("user_settings").upsert({ user_id: auth.user.id, preferences: { ...preferences, journal_entries: nextEntries } }, { onConflict: "user_id" });
      if (saveError) throw saveError;
      setEntries(nextEntries); setMessage("Journal entry deleted.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't delete that entry.");
    } finally { setBusy(false); }
  }

  const activity = [
    ...completedTasks.map((row) => ({ id: "task-" + row.id, title: row.title, type: "Task completed", date: row.completed_at as string })),
    ...completedWorkouts.map((row) => ({ id: "workout-" + row.id, title: row.name, type: "Workout completed", date: row.completed_at as string })),
    ...focus.filter((row) => (row.completed_minutes ?? 0) > 0).map((row) => ({ id: "focus-" + row.id, title: (row.completed_minutes ?? 0) + " focused minutes", type: "Focus session", date: row.started_at })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 12);

  return <section className="banana-module more-module">
    <div className="module-heading"><div><p className="eyebrow">YOUR WORKSPACE</p><h2>Everything beyond the daily grind.</h2><p>Explore your stats, plan ahead, save notes and discover movements.</p></div><span className="module-pill">MORE</span></div>
    {(error || message) && <p className={error ? "module-alert error" : "module-alert"} role="status">{error || message}</p>}
    <nav className="more-tabs" aria-label="Workspace sections">{(["Overview", "Calendar", "Journal", "Discover", "Achievements", "Community"] as Section[]).map((item) => <button type="button" key={item} className={section === item ? "active" : ""} aria-pressed={section === item} onClick={() => setSection(item)}>{item}</button>)}</nav>
    {loading ? <article className="module-card"><p className="module-empty">Loading your account data…</p></article> : <>
      {section === "Overview" && <>
        <div className="more-stat-grid">
          <article className="more-stat"><span>COMPLETED WORKOUTS</span><strong>{completedWorkouts.length}</strong><small>Saved sessions</small></article>
          <article className="more-stat"><span>COMPLETED TASKS</span><strong>{completedTasks.length}</strong><small>Across your workspace</small></article>
          <article className="more-stat"><span>FOCUS TIME</span><strong>{Math.floor(focusMinutes / 60)}h {focusMinutes % 60}m</strong><small>Recorded minutes</small></article>
          <article className="more-stat"><span>BEST SINGLE SET</span><strong>{bestSet}</strong><small>Highest logged reps</small></article>
        </div>
        <article className="module-card"><div className="module-card-head"><div><p className="eyebrow">RECENT ACTIVITY</p><h3>Your latest milestones</h3></div><span>{activity.length} EVENTS</span></div>
          {activity.length ? activity.map((item) => <div className="module-list-row" key={item.id}><div><strong>{item.title}</strong><small>{item.type} · {new Date(item.date).toLocaleString()}</small></div><span className="module-status">SAVED</span></div>) : <p className="module-empty">Your completed tasks, workouts and focus sessions will appear here.</p>}
        </article>
      </>}
      {section === "Calendar" && <article className="module-card"><div className="module-card-head"><div><p className="eyebrow">YOUR SCHEDULE</p><h3>{dateLabel(selectedDate)}</h3><p>Tasks with due dates and workouts logged on this day.</p></div><span>CALENDAR</span></div>
        <label className="module-label">Choose a date<input className="module-input" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
        <div className="more-calendar-list">
          {selectedTasks.map((row) => <div className="module-list-row" key={row.id}><div><strong>{row.title}</strong><small>Task · {row.completed_at ? "Completed" : "Open"} · {row.priority} priority</small></div><span className="module-status">{row.completed_at ? "DONE" : "TASK"}</span></div>)}
          {selectedWorkouts.map((row) => <div className="module-list-row" key={row.id}><div><strong>{row.name}</strong><small>Workout · {row.completed_at ? "Completed" : "In progress"}</small></div><span className="module-status">WORKOUT</span></div>)}
          {!selectedTasks.length && !selectedWorkouts.length && <p className="module-empty">Nothing scheduled or logged for this date yet.</p>}
        </div>
      </article>}
      {section === "Journal" && <div className="module-grid two">
        <article className="module-card"><div className="module-card-head"><div><p className="eyebrow">PRIVATE JOURNAL</p><h3>Write it down.</h3><p>Entries are saved privately in your account preferences.</p></div><span>NOTES</span></div>
          <form className="more-journal-form" onSubmit={saveJournal}><label className="module-label">Title<input className="module-input" value={entryTitle} onChange={(event) => setEntryTitle(event.target.value)} maxLength={100} placeholder="A quick reflection" /></label><label className="module-label">Entry<textarea className="module-input" value={entryBody} onChange={(event) => setEntryBody(event.target.value)} maxLength={3000} rows={7} placeholder="What went well? What do you want to remember?" required /></label><button className="module-primary" disabled={busy || !entryBody.trim()}>{busy ? "Saving…" : "Save journal entry"}</button></form>
        </article>
        <article className="module-card"><div className="module-card-head"><div><p className="eyebrow">YOUR ENTRIES</p><h3>Recent notes</h3></div><span>{entries.length} SAVED</span></div>
          {entries.length ? entries.map((entry) => <div className="more-journal-entry" key={entry.id}><div><strong>{entry.title}</strong><small>{new Date(entry.created_at).toLocaleString()}</small></div><p>{entry.body}</p><button type="button" className="module-text-button" disabled={busy} onClick={() => void deleteJournal(entry.id)}>Delete entry</button></div>) : <p className="module-empty">Your private notes will show here.</p>}
        </article>
      </div>}
      {section === "Discover" && <article className="module-card"><div className="module-card-head"><div><p className="eyebrow">MOVEMENT LIBRARY</p><h3>Discover exercises.</h3><p>Simple movement references with technique reminders.</p></div><span>{filteredMovements.length} MOVES</span></div>
        <label className="module-label">Filter by muscle group<select className="module-input" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option>{Array.from(new Set(movements.map((row) => row.group))).map((group) => <option key={group}>{group}</option>)}</select></label>
        <div className="more-discover-grid">{filteredMovements.map((row) => <article className="more-movement" key={row.name}><span>{row.type.toUpperCase()} · {row.group.toUpperCase()}</span><strong>{row.name}</strong><p>{row.cue}</p></article>)}</div>
      </article>}
      {section === "Community" && <div className="community-workspace">
        <section className="community-hero">
          <div><span className="rank-overline">YOUR PRIVATE CIRCLE</span><h3>Train alongside people you know.</h3><p>Connect using friend codes. Requests must be accepted before you can invite each other to challenges. Your workout, focus and journal records stay private.</p></div>
          <div className="community-code"><small>YOUR FRIEND CODE</small><strong>{friendCode || "Loading…"}</strong><button type="button" className="module-secondary" disabled={!friendCode} onClick={() => void navigator.clipboard.writeText(friendCode).then(() => setMessage("Friend code copied."), () => setError("Clipboard access is unavailable in this browser."))}>Copy code</button></div>
        </section>
        <div className="module-grid two">
          <article className="module-card">
            <div className="module-card-head"><div><p className="eyebrow">ADD A FRIEND</p><h3>Enter their code.</h3><p>Only share your code with people you know.</p></div><span>CONNECT</span></div>
            <form className="community-add-form" onSubmit={sendFriendRequest}>
              <label className="module-label">Friend code<input className="module-input" value={friendInput} onChange={(event) => setFriendInput(event.target.value.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 10))} placeholder="A1B2C3D4E5" maxLength={10} required /></label>
              <button className="module-primary" disabled={busy || friendInput.trim().length < 6}>Send friend request</button>
            </form>
          </article>
          <article className="module-card">
            <div className="module-card-head"><div><p className="eyebrow">YOUR CONNECTIONS</p><h3>Friends & requests.</h3></div><span>{connections.filter((row) => row.status === "accepted").length} FRIENDS</span></div>
            {connections.length === 0 ? <p className="module-empty">No connections yet. Send a friend code to get started.</p> : <div className="community-connection-list">{connections.map((row) => <div className="community-connection" key={row.id}><span className="community-avatar">{row.display_name.slice(0,1).toUpperCase()}</span><div><strong>{row.display_name}</strong><small>{row.status === "accepted" ? "Connected" : row.status === "pending" ? (row.incoming ? "Incoming request" : "Request sent") : "Request declined"}</small></div>{row.status === "pending" && row.incoming ? <div className="community-actions"><button type="button" disabled={busy} onClick={() => void respondToFriend(row.id,"accepted")}>Accept</button><button type="button" className="module-secondary" disabled={busy} onClick={() => void respondToFriend(row.id,"rejected")}>Decline</button></div> : <span className="module-status">{row.status.toUpperCase()}</span>}</div>)}</div>}
          </article>
        </div>
        <article className="module-card">
          <div className="module-card-head"><div><p className="eyebrow">FRIEND CHALLENGES</p><h3>Make a friendly challenge.</h3><p>Challenges use your own saved activity. Only the invited friend can accept or decline.</p></div><span>{challenges.filter((row) => row.status === "accepted").length} ACTIVE</span></div>
          <form className="community-challenge-form" onSubmit={createFriendChallenge}>
            <label className="module-label">Invite a friend<select className="module-input" name="challenge-friend" required defaultValue=""><option value="" disabled>Select a friend</option>{connections.filter((row) => row.status === "accepted").map((row) => <option key={row.friend_id} value={row.friend_id}>{row.display_name}</option>)}</select></label>
            <label className="module-label">Challenge name<input className="module-input" value={challengeTitle} onChange={(event) => setChallengeTitle(event.target.value)} maxLength={100} required /></label>
            <label className="module-label">Track<select className="module-input" value={challengeMetric} onChange={(event) => setChallengeMetric(event.target.value as typeof challengeMetric)}><option value="workouts">Completed workouts</option><option value="focus_minutes">Focus minutes</option><option value="completed_tasks">Completed tasks</option></select></label>
            <label className="module-label">Target<input className="module-input" type="number" min="1" max="100000" value={challengeTarget} onChange={(event) => setChallengeTarget(event.target.value)} required /></label>
            <label className="module-label">Ends on<input className="module-input" type="date" min={localDay(new Date())} value={challengeEnd} onChange={(event) => setChallengeEnd(event.target.value)} required /></label>
            <button className="module-primary" disabled={busy || connections.every((row) => row.status !== "accepted")}>Send challenge invitation</button>
          </form>
          <div className="community-challenge-list">{challenges.length === 0 ? <p className="module-empty">Your accepted challenges will appear here.</p> : challenges.map((row) => { const progress = ownChallengeProgress(row); const incoming = row.participant_id !== row.creator_id && row.status === "pending"; const percent = Math.min(100, Math.round(progress / Math.max(1,row.target) * 100)); return <div className="community-challenge" key={row.id}><div className="community-challenge-top"><div><strong>{row.title}</strong><small>{row.metric.replace("_"," ")} · target {row.target} · ends {new Date(row.ends_on + "T12:00:00").toLocaleDateString()}</small></div><span className="module-status">{row.status.toUpperCase()}</span></div>{row.status === "accepted" && <><div className="community-progress"><i style={{width:percent+"%"}}/></div><small className="community-progress-label">Your logged progress: {progress} / {row.target}</small></>}{incoming && <div className="community-actions"><button type="button" disabled={busy} onClick={() => void respondToChallenge(row.id,"accepted")}>Accept</button><button type="button" className="module-secondary" disabled={busy} onClick={() => void respondToChallenge(row.id,"declined")}>Decline</button></div>}</div>})}</div>
        </article>
        <p className="module-footnote">No public profiles, open DMs, or global leaderboard. Friend codes are private invites, and activity data is never shared through this page.</p>
      </div>}
      {section === "Achievements" && <article className="module-card"><div className="module-card-head"><div><p className="eyebrow">ACHIEVEMENT COLLECTION</p><h3>Milestones you've unlocked.</h3><p>Earned achievements are synced to your account.</p></div><span>{unlocked.size} / {achievements.length}</span></div>
        <div className="more-achievement-grid">{achievements.map((row) => <article className={unlocked.has(row.id) ? "more-achievement unlocked" : "more-achievement"} key={row.id}><span>{row.icon || "✦"}</span><div><strong>{row.name}</strong><p>{row.description}</p></div><small>{unlocked.has(row.id) ? "UNLOCKED" : "LOCKED"}</small></article>)}</div>
      </article>}
    </>}
  </section>;
}
