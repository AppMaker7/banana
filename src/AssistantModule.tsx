import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "./lib/supabase";

type Task = { id: string; title: string; notes: string | null; priority: string; completed_at: string | null; created_at: string };
type SavedPlan = { id: string; name: string; plan_data: { exercises?: { name: string; muscle: string; hint: string }[]; guidance?: string } };
type Goal = "balanced" | "school" | "fitness" | "project";
type TrainingSession = { id: string; name: string; started_at: string; completed_at: string | null };
type TrainingSet = { exercise_name: string; muscle_group: string; reps: number; weight: number; created_at: string };
type RecoveryLog = { logged_on: string; sleep_hours: number | null; energy_level: number | null; soreness_level: number | null };

const taskTemplates: Record<Goal, string[]> = {
  balanced: ["Choose one important task for today", "Take a screen break and reset", "Prepare what you need for tomorrow"],
  school: ["Review the most important class notes", "Work on one assignment in a focused block", "Pack materials for the next school day"],
  fitness: ["Choose a comfortable movement session", "Prepare water and a simple recovery break", "Record how the session felt"],
  project: ["Write down the next smallest project step", "Work on that step for one focused block", "Review what changed and note the next action"],
};

export default function AssistantModule() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [trainingSets, setTrainingSets] = useState<TrainingSet[]>([]);
  const [recoveryLogs, setRecoveryLogs] = useState<RecoveryLog[]>([]);
  const [weeklyReport, setWeeklyReport] = useState("");
  const [goal, setGoal] = useState<Goal>("balanced");
  const [project, setProject] = useState("");
  const [question, setQuestion] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [answer, setAnswer] = useState("Tell me what you're working on, or generate a starter plan below.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadTasks() {
    if (!supabase) return;
    const [{ data, error: loadError }, { data: planData, error: planError }, { data: sessionData, error: sessionError }, { data: setData, error: setErrorData }, { data: recoveryData, error: recoveryError }] = await Promise.all([
      supabase.from("tasks").select("id,title,notes,priority,completed_at,created_at").order("created_at", { ascending: false }).limit(40),
      supabase.from("workout_plans").select("id,name,plan_data").eq("is_archived", false).order("created_at", { ascending: false }).limit(6),
      supabase.from("workout_sessions").select("id,name,started_at,completed_at").order("started_at", { ascending: false }).limit(100),
      supabase.from("workout_sets").select("exercise_name,muscle_group,reps,weight,created_at").order("created_at", { ascending: false }).limit(300),
      supabase.from("recovery_logs").select("logged_on,sleep_hours,energy_level,soreness_level").order("logged_on", { ascending: false }).limit(14),
    ]);
    if (loadError) setError(loadError.message);
    if (planError) setError(planError.message);
    if (sessionError) setError(sessionError.message);
    if (setErrorData) setError(setErrorData.message);
    if (recoveryError) setError(recoveryError.message);
    setTasks((data ?? []) as Task[]);
    setPlans((planData ?? []) as SavedPlan[]);
    setTrainingSessions((sessionData ?? []) as TrainingSession[]);
    setTrainingSets((setData ?? []) as TrainingSet[]);
    setRecoveryLogs((recoveryData ?? []) as RecoveryLog[]);
  }

  useEffect(() => { void loadTasks(); }, []);

  const openCount = tasks.filter((task) => !task.completed_at).length;

  async function generateTasks() {
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Log in again to save tasks.");
      const { data: aiData, error: aiError } = await supabase.functions.invoke("banana-ai", {
        body: {
          message: "Create exactly three short, realistic, age-appropriate tasks for the selected goal. Keep the workload manageable, avoid health or appearance targets, and return only a valid JSON array of three strings. No markdown.",
          context: { goal, project: project.trim(), existingTasks: tasks.filter((task) => !task.completed_at).map((task) => task.title).slice(0, 8) },
        },
      });
      if (aiError) throw aiError;
      const raw = typeof aiData?.reply === "string" ? aiData.reply.trim().replace(/^\x60\x60\x60(?:json)?/i, "").replace(/\x60\x60\x60$/, "").trim() : "";
      const parsed: unknown = JSON.parse(raw);
      const titles = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim().slice(0, 160)).slice(0, 3) : [];
      if (titles.length !== 3) throw new Error("BANANA AI couldn't create a valid three-task plan. Try again.");
      const prefix = project.trim() ? "Project: " + project.trim() + " · " : "";
      const rows = titles.map((title) => ({ user_id: userData.user.id, title, notes: prefix + "Generated by BANANA AI.", priority: "normal" }));
      const { error: insertError } = await supabase.from("tasks").insert(rows);
      if (insertError) throw insertError;
      setMessage("BANANA AI created and saved your tasks.");
      await loadTasks();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't create your task list.");
    } finally { setBusy(false); }
  }

  async function generateWorkoutPlan() {
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Log in again to save a workout routine.");
      const catalog = [
        { name: "Push-ups", muscle: "Chest", hint: "Bodyweight · controlled reps" },
        { name: "Incline push-ups", muscle: "Chest", hint: "Bodyweight · adjustable difficulty" },
        { name: "One-arm dumbbell row", muscle: "Back", hint: "Light dumbbell · each side" },
        { name: "Superman raises", muscle: "Back", hint: "Bodyweight · slow and controlled" },
        { name: "Dumbbell curls", muscle: "Biceps", hint: "Light dumbbells" },
        { name: "Overhead triceps extension", muscle: "Triceps", hint: "Light dumbbell" },
        { name: "Dumbbell shoulder press", muscle: "Shoulders", hint: "Light dumbbells" },
        { name: "Dead bugs", muscle: "Core", hint: "Bodyweight · steady breathing" },
        { name: "Bodyweight squats", muscle: "Legs", hint: "Bodyweight · comfortable range" },
        { name: "Glute bridges", muscle: "Glutes", hint: "Bodyweight · controlled movement" },
      ];
      const { data: aiData, error: aiError } = await supabase.functions.invoke("banana-ai", {
        body: {
          message: "Build a balanced, beginner-friendly routine using only exercise names in the supplied catalog. Choose 4 to 6 movements, vary muscle groups, keep effort moderate, and include rest guidance. Return only JSON with keys exercises (array of exact exercise names) and guidance (one short string). No markdown.",
          context: { exerciseCatalog: catalog.map((item) => item.name), equipment: "bodyweight and light dumbbells", goal, existingPlans: plans.map((plan) => plan.name) },
        },
      });
      if (aiError) throw aiError;
      const raw = typeof aiData?.reply === "string" ? aiData.reply.trim().replace(/^\x60\x60\x60(?:json)?/i, "").replace(/\x60\x60\x60$/, "").trim() : "";
      const parsed = JSON.parse(raw) as { exercises?: unknown; guidance?: unknown };
      const names = Array.isArray(parsed.exercises) ? parsed.exercises.filter((item): item is string => typeof item === "string") : [];
      const exercises = [...new Set(names)].map((name) => catalog.find((item) => item.name === name)).filter((item): item is typeof catalog[number] => Boolean(item)).slice(0, 6);
      if (exercises.length < 4) throw new Error("BANANA AI couldn't build a valid routine from the exercise library. Try again.");
      const guidance = typeof parsed.guidance === "string" ? parsed.guidance.slice(0, 400) : "Use comfortable effort, focus on technique, and leave room for recovery.";
      const { error: saveError } = await supabase.from("workout_plans").insert({
        user_id: userData.user.id,
        name: "BANANA AI Routine",
        description: "AI-generated from the BANANA exercise library.",
        plan_data: { exercises, guidance },
      });
      if (saveError) throw saveError;
      setMessage("BANANA AI created and saved your routine.");
      await loadTasks();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't create the workout routine.");
    } finally { setBusy(false); }
  }

  async function reviewSavedPlan(plan: SavedPlan) {
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data, error: aiError } = await supabase.functions.invoke("banana-ai", {
        body: {
          message: "Review this saved workout plan. Explain what muscle groups it covers, whether it looks reasonably balanced, what may be missing, and suggest at most two practical adjustments. Keep guidance age-appropriate, moderate, and recovery-aware. Do not infer body composition or recommend training through pain.",
          context: { planName: plan.name, exercises: plan.plan_data?.exercises ?? [], guidance: plan.plan_data?.guidance ?? null, recentSessions: trainingSessions.slice(0, 8), personalSetRecords: trainingSets.slice(0, 20) },
        },
      });
      if (aiError) throw aiError;
      if (typeof data?.reply !== "string" || !data.reply.trim()) throw new Error(data?.error || "BANANA AI couldn't review that plan.");
      setAnswer(data.reply.trim());
      setMessage("Plan review is ready in BANANA Intelligence.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't review that plan.");
    } finally { setBusy(false); }
  }

  async function createWeeklyReport() {
    if (!supabase) return;
    setBusy(true); setError(""); setMessage(""); setWeeklyReport("");
    try {
      const since = new Date(); since.setDate(since.getDate() - 6); since.setHours(0,0,0,0);
      const sessions = trainingSessions.filter((row) => new Date(row.started_at) >= since);
      const sets = trainingSets.filter((row) => new Date(row.created_at) >= since);
      const focusRows = await supabase.from("focus_sessions").select("started_at,completed_minutes").gte("started_at", since.toISOString()).order("started_at", { ascending: false }).limit(100);
      if (focusRows.error) throw focusRows.error;
      const taskRows = tasks.filter((row) => new Date(row.created_at) >= since);
      const { data, error: aiError } = await supabase.functions.invoke("banana-ai", {
        body: {
          message: "Create a short weekly BANANA progress report with: what was logged, one pattern supported by the records, one thing to celebrate, and one gentle next step. Do not judge missed days, infer health status, set body or appearance goals, or encourage excessive training. If records are sparse, say so plainly.",
          context: {
            period: { from: since.toISOString(), to: new Date().toISOString() },
            workouts: sessions.map((row) => ({ name: row.name, completed: Boolean(row.completed_at), date: row.started_at })),
            exerciseSets: sets,
            focusSessions: focusRows.data ?? [],
            tasks: taskRows.map((row) => ({ title: row.title, completed: Boolean(row.completed_at) })),
            recentRecoveryCheckIns: recoveryLogs.slice(0, 7),
          },
        },
      });
      if (aiError) throw aiError;
      if (typeof data?.reply !== "string" || !data.reply.trim()) throw new Error(data?.error || "BANANA AI didn't return a weekly report.");
      setWeeklyReport(data.reply.trim());
      setMessage("Your weekly report is ready.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't create your weekly report.");
    } finally { setBusy(false); }
  }

  async function addCustomTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !taskInput.trim()) return;
    setBusy(true); setError("");
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Log in again to save tasks.");
      const { error: insertError } = await supabase.from("tasks").insert({
        user_id: userData.user.id, title: taskInput.trim(), notes: project.trim() ? "Project: " + project.trim() : null, priority: "normal",
      });
      if (insertError) throw insertError;
      setTaskInput("");
      setMessage("Task added to your list.");
      await loadTasks();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't add that task.");
    } finally { setBusy(false); }
  }

  async function toggleTask(task: Task) {
    if (!supabase) return;
    const completedAt = task.completed_at ? null : new Date().toISOString();
    const { error: updateError } = await supabase.from("tasks").update({ completed_at: completedAt }).eq("id", task.id);
    if (updateError) setError(updateError.message);
    else await loadTasks();
  }

  async function askAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !question.trim()) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data, error: aiError } = await supabase.functions.invoke("banana-ai", {
        body: { message: question.trim(), context: { openTasks: tasks.filter((task) => !task.completed_at).map((task) => task.title).slice(0, 12), savedWorkoutPlans: plans.map((plan) => ({ name: plan.name, exercises: plan.plan_data?.exercises ?? [] })), recentWorkouts: trainingSessions.slice(0, 10), recentExerciseSets: trainingSets.slice(0, 30), recentRecoveryCheckIns: recoveryLogs.slice(0, 7) } },
      });
      if (aiError) throw aiError;
      if (typeof data?.reply !== "string" || !data.reply.trim()) {
        throw new Error(data?.error || "BANANA AI didn't return a response.");
      }
      setAnswer(data.reply);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "BANANA AI isn't connected yet. Check the server setup.");
    } finally { setBusy(false); }
  }

  return (
    <section className="banana-module">
      <div className="module-heading">
        <div><p className="eyebrow">V3 · ADVANCED AI</p><h2>Your intelligent workspace.</h2><p>Ask open-ended questions, plan your next move, and build routines with context from BANANA.</p></div>
        <span className="module-pill">AI CONNECTOR</span>
      </div>
      <div className="module-alert assistant-notice">Messages are sent to BANANA's secure server function for an AI response. Don't include passwords or private information.</div>
      {(error || message) && <p className={error ? "module-alert error" : "module-alert"} role="status">{error || message}</p>}
      <div className="module-grid two">
        <article className="module-card assistant-chat">
          <div className="module-card-head"><div><p className="eyebrow">BANANA INTELLIGENCE</p><h3>Ask anything.</h3></div><span>01</span></div>
          <div className="assistant-answer">{answer}</div>
          <form className="assistant-question" onSubmit={askAssistant}>
            <input className="module-input" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask BANANA to help with anything…" maxLength={2000} />
            <button className="module-small-button" type="submit" disabled={busy || !question.trim()}>{busy ? "Thinking…" : "Ask AI"}</button>
          </form>
          <form className="assistant-question" onSubmit={addCustomTask}>
            <input className="module-input" value={taskInput} onChange={(event) => setTaskInput(event.target.value)} placeholder="Or type a task to save…" maxLength={160} />
            <button className="module-primary" type="submit" disabled={busy || !taskInput.trim()}>Add task</button>
          </form>
        </article>
        <article className="module-card">
          <div className="module-card-head"><div><p className="eyebrow">GUIDED PLANNER</p><h3>Generate a starter list</h3><p>Choose the area you want to organize today.</p></div><span>02</span></div>
          <label className="module-label">Goal type<select className="module-input" value={goal} onChange={(event) => setGoal(event.target.value as Goal)}><option value="balanced">Balanced day</option><option value="school">School</option><option value="fitness">Health and movement</option><option value="project">Project sprint</option></select></label>
          <label className="module-label assistant-project-label">Project name (optional)<input className="module-input" value={project} onChange={(event) => setProject(event.target.value)} placeholder="e.g. Science presentation" maxLength={80} /></label>
          <div className="assistant-preview-list">{taskTemplates[goal].map((item) => <div key={item}><span>✦</span>{item}</div>)}</div>
          <button className="module-primary" disabled={busy} onClick={() => void generateTasks()}>{busy ? "Creating…" : "Create my tasks"}</button>
        </article>
      </div>
      <article className="module-card">
        <div className="module-card-head"><div><p className="eyebrow">WORKOUT ROUTINE BUILDER</p><h3>Generate a balanced routine</h3><p>Creates a starter plan with comfortable sets and recovery guidance.</p></div><span>{plans.length} SAVED</span></div>
        <button className="module-primary" disabled={busy} onClick={() => void generateWorkoutPlan()}>{busy ? "Creating…" : "Create workout routine"}</button>
        {plans.map((plan) => <div className="module-list-row" key={plan.id}><div><strong>{plan.name}</strong><small>{plan.plan_data?.exercises?.length ?? 0} exercises · Available in Health</small></div><button type="button" className="module-secondary" disabled={busy} onClick={() => void reviewSavedPlan(plan)}>Review plan</button></div>)}
      </article>
      <article className="module-card ai-weekly-report">
        <div className="module-card-head"><div><p className="eyebrow">WEEKLY INTELLIGENCE</p><h3>Your progress report.</h3><p>AI summarizes your real saved workouts, focus sessions, tasks and recovery check-ins.</p></div><span>7 DAYS</span></div>
        <button className="module-primary" disabled={busy} onClick={() => void createWeeklyReport()}>{busy ? "Reviewing your week…" : "Generate weekly report"}</button>
        {weeklyReport && <div className="assistant-answer ai-report-answer" aria-live="polite">{weeklyReport}</div>}
      </article>
      <article className="module-card">
        <div className="module-card-head"><div><p className="eyebrow">YOUR TASKS & PROJECTS</p><h3>Task board</h3></div><span>{openCount} OPEN</span></div>
        {tasks.length === 0 ? <p className="module-empty">Your tasks will appear here after you create a list.</p> : tasks.map((task) => <label className={task.completed_at ? "assistant-task completed" : "assistant-task"} key={task.id}><input type="checkbox" checked={Boolean(task.completed_at)} onChange={() => void toggleTask(task)} /><span><strong>{task.title}</strong><small>{task.notes || "Personal task"} · {task.completed_at ? "Completed" : "Open"}</small></span></label>)}
      </article>
    </section>
  );
}
