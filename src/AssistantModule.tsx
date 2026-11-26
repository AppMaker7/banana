import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "./lib/supabase";

type Task = { id: string; title: string; notes: string | null; priority: string; completed_at: string | null; created_at: string };
type SavedPlan = { id: string; name: string; plan_data: { exercises?: { name: string; muscle: string; hint: string }[] } };
type Goal = "balanced" | "school" | "fitness" | "project";

const taskTemplates: Record<Goal, string[]> = {
  balanced: ["Choose one important task for today", "Take a screen break and reset", "Prepare what you need for tomorrow"],
  school: ["Review the most important class notes", "Work on one assignment in a focused block", "Pack materials for the next school day"],
  fitness: ["Choose a comfortable movement session", "Prepare water and a simple recovery break", "Record how the session felt"],
  project: ["Write down the next smallest project step", "Work on that step for one focused block", "Review what changed and note the next action"],
};

export default function AssistantModule() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
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
    const [{ data, error: loadError }, { data: planData, error: planError }] = await Promise.all([
      supabase.from("tasks").select("id,title,notes,priority,completed_at,created_at").order("created_at", { ascending: false }).limit(40),
      supabase.from("workout_plans").select("id,name,plan_data").eq("is_archived", false).order("created_at", { ascending: false }).limit(6),
    ]);
    if (loadError) setError(loadError.message);
    if (planError) setError(planError.message);
    setTasks((data ?? []) as Task[]);
    setPlans((planData ?? []) as SavedPlan[]);
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
      const prefix = project.trim() ? "Project: " + project.trim() + " · " : "";
      const rows = taskTemplates[goal].map((title) => ({
        user_id: userData.user.id, title, notes: prefix + "Generated from BANANA's guided planner.", priority: "normal",
      }));
      const { error: insertError } = await supabase.from("tasks").insert(rows);
      if (insertError) throw insertError;
      setMessage("Your starter tasks were saved.");
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
      const exercises = [
        { name: "Push-ups", muscle: "Chest", hint: "2 comfortable sets · 8–12 reps" },
        { name: "One-arm dumbbell row", muscle: "Back", hint: "2 comfortable sets · 8–12 reps each side" },
        { name: "Dumbbell shoulder press", muscle: "Shoulders", hint: "2 comfortable sets · 8–12 reps" },
        { name: "Dumbbell curls", muscle: "Biceps", hint: "2 comfortable sets · 8–12 reps" },
        { name: "Dead bugs", muscle: "Core", hint: "2 controlled sets · 6–10 reps each side" },
        { name: "Bodyweight squats", muscle: "Legs", hint: "2 comfortable sets · 8–12 reps" },
      ];
      const { error: saveError } = await supabase.from("workout_plans").insert({
        user_id: userData.user.id,
        name: "BANANA Balanced Starter Routine",
        description: "A balanced starter template. Adjust to your comfort and leave room for recovery.",
        plan_data: { exercises, guidance: "Use comfortable effort, focus on good form, and allow recovery days between strength sessions." },
      });
      if (saveError) throw saveError;
      setMessage("Starter workout routine saved to Health.");
      await loadTasks();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't create the workout routine.");
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
        body: { message: question.trim(), context: { openTasks: openCount, savedWorkoutPlans: plans.length } },
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
        {plans.map((plan) => <div className="module-list-row" key={plan.id}><div><strong>{plan.name}</strong><small>{plan.plan_data?.exercises?.length ?? 0} exercises · Available in Health</small></div><span className="module-status">SAVED</span></div>)}
      </article>
      <article className="module-card">
        <div className="module-card-head"><div><p className="eyebrow">YOUR TASKS & PROJECTS</p><h3>Task board</h3></div><span>{openCount} OPEN</span></div>
        {tasks.length === 0 ? <p className="module-empty">Your tasks will appear here after you create a list.</p> : tasks.map((task) => <label className={task.completed_at ? "assistant-task completed" : "assistant-task"} key={task.id}><input type="checkbox" checked={Boolean(task.completed_at)} onChange={() => void toggleTask(task)} /><span><strong>{task.title}</strong><small>{task.notes || "Personal task"} · {task.completed_at ? "Completed" : "Open"}</small></span></label>)}
      </article>
    </section>
  );
}
