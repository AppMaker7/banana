import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "./lib/supabase";

type Task = { id: string; title: string; notes: string | null; priority: string; completed_at: string | null; created_at: string };
type Goal = "balanced" | "school" | "fitness" | "project";

const taskTemplates: Record<Goal, string[]> = {
  balanced: ["Choose one important task for today", "Take a screen break and reset", "Prepare what you need for tomorrow"],
  school: ["Review the most important class notes", "Work on one assignment in a focused block", "Pack materials for the next school day"],
  fitness: ["Choose a comfortable movement session", "Prepare water and a simple recovery break", "Record how the session felt"],
  project: ["Write down the next smallest project step", "Work on that step for one focused block", "Review what changed and note the next action"],
};

function localReply(question: string, taskCount: number) {
  const q = question.toLowerCase();
  if (q.includes("workout") || q.includes("exercise")) return "Start with a manageable plan, use movements you can do with good form, and leave room for rest. BANANA Health can save the plan and track each set.";
  if (q.includes("focus") || q.includes("study")) return "Try one 25-minute focus block, silence distractions you control, then take a short break. You can start and save that block in Focus Mode.";
  if (q.includes("project")) return "Break the project into one small next action, one check-in, and one finish condition. Add the actions below with a project name so they stay grouped.";
  if (q.includes("task") || q.includes("today")) return taskCount ? "You have " + taskCount + " open tasks saved. Pick the most important one and make the first step small enough to start." : "You don't have any open tasks saved yet. Choose a goal below and I'll create a starter list.";
  return "I can help organize a day, outline a project, or suggest a balanced workout structure. Try asking about focus, tasks, projects, or workouts. This version uses built-in guidance; a secure AI model connection isn't configured yet.";
}

export default function AssistantModule() {
  const [tasks, setTasks] = useState<Task[]>([]);
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
    const { data, error: loadError } = await supabase.from("tasks")
      .select("id,title,notes,priority,completed_at,created_at")
      .order("created_at", { ascending: false }).limit(40);
    if (loadError) setError(loadError.message);
    setTasks((data ?? []) as Task[]);
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

  function askAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;
    setAnswer(localReply(question, openCount));
  }

  return (
    <section className="banana-module">
      <div className="module-heading">
        <div><p className="eyebrow">PHASE 4 · BANANA AI</p><h2>Your planning assistant.</h2><p>Turn a goal into smaller actions, keep projects organized, and get a useful next step.</p></div>
        <span className="module-pill">BETA</span>
      </div>
      <div className="module-alert assistant-notice">AI connection isn't configured yet. This build includes a local guided planner and task manager; it does not send your information to an AI service.</div>
      {(error || message) && <p className={error ? "module-alert error" : "module-alert"} role="status">{error || message}</p>}
      <div className="module-grid two">
        <article className="module-card assistant-chat">
          <div className="module-card-head"><div><p className="eyebrow">ASK BANANA</p><h3>What should I do next?</h3></div><span>01</span></div>
          <div className="assistant-answer">{answer}</div>
          <form className="assistant-question" onSubmit={askAssistant}>
            <input className="module-input" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about focus, tasks, workouts…" maxLength={300} />
            <button className="module-small-button" type="submit">Ask</button>
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
        <div className="module-card-head"><div><p className="eyebrow">YOUR TASKS & PROJECTS</p><h3>Task board</h3></div><span>{openCount} OPEN</span></div>
        {tasks.length === 0 ? <p className="module-empty">Your tasks will appear here after you create a list.</p> : tasks.map((task) => <label className={task.completed_at ? "assistant-task completed" : "assistant-task"} key={task.id}><input type="checkbox" checked={Boolean(task.completed_at)} onChange={() => void toggleTask(task)} /><span><strong>{task.title}</strong><small>{task.notes || "Personal task"} · {task.completed_at ? "Completed" : "Open"}</small></span></label>)}
      </article>
    </section>
  );
}
