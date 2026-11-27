import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "./lib/supabase";

type Task={id:string;title:string;priority:string;completed_at:string|null;created_at:string};
type Workout={id:string;name:string;started_at:string;completed_at:string|null};
type FocusLog={id:string;started_at:string;completed_minutes:number|null;ended_at:string|null};
type Achievement={id:string;name:string;description:string;icon:string|null};
type Props={onNavigate:(tab:"Health"|"Focus"|"AI"|"Music"|"Settings")=>void};
const ranks=[{name:"Wood",min:0},{name:"Bronze",min:10},{name:"Silver",min:20},{name:"Gold",min:35},{name:"Platinum",min:50},{name:"Diamond",min:70},{name:"Champion",min:90},{name:"Titan",min:120},{name:"Olympian",min:150}];
function rankFor(reps:number){let index=0;ranks.forEach((r,i)=>{if(reps>=r.min)index=i});const current=ranks[index],next=ranks[index+1];return{...current,next,progress:next?Math.min(100,((reps-current.min)/(next.min-current.min))*100):100}}
function dayKey(d:Date){return d.getFullYear()+"-"+d.getMonth()+"-"+d.getDate()}

export default function HomeDashboard({onNavigate}:Props){
 const [name,setName]=useState("there"),[openTasks,setOpenTasks]=useState<Task[]>([]),[weekData,setWeekData]=useState<{label:string;count:number;today:boolean}[]>([]),[achievements,setAchievements]=useState<Achievement[]>([]),[unlocked,setUnlocked]=useState<Set<string>>(new Set()),[bestReps,setBestReps]=useState(0),[taskInput,setTaskInput]=useState(""),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [totals,setTotals]=useState({xp:0,completedTasks:0,workouts:0,focusMinutes:0,activeDays:0,tasksToday:0,completedToday:0});
 async function loadDashboard(){
  if(!supabase){setLoading(false);return} setError("");
  try{
   const {data:auth,error:authError}=await supabase.auth.getUser();if(authError)throw authError;if(!auth.user)throw new Error("Your session expired. Log in again.");
   const uid=auth.user.id,now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate()),weekStart=new Date(today),monthStart=new Date(today);weekStart.setDate(today.getDate()-6);monthStart.setDate(today.getDate()-29);
   const [profile,tasks,open,workouts,focus,sets,defs,unlocks]=await Promise.all([
    supabase.from("profiles").select("display_name").eq("id",uid).maybeSingle(),
    supabase.from("tasks").select("id,title,priority,completed_at,created_at").gte("created_at",monthStart.toISOString()).order("created_at",{ascending:false}).limit(200),
    supabase.from("tasks").select("id,title,priority,completed_at,created_at").is("completed_at",null).order("created_at",{ascending:false}).limit(4),
    supabase.from("workout_sessions").select("id,name,started_at,completed_at").gte("started_at",monthStart.toISOString()).order("started_at",{ascending:false}).limit(100),
    supabase.from("focus_sessions").select("id,started_at,completed_minutes,ended_at").gte("started_at",monthStart.toISOString()).order("started_at",{ascending:false}).limit(100),
    supabase.from("workout_sets").select("reps,exercise_name,muscle_group").order("reps",{ascending:false}).limit(500),
    supabase.from("achievements").select("id,name,description,icon").order("category"),
    supabase.from("user_achievements").select("achievement_id").eq("user_id",uid),
    supabase.from("recovery_logs").select("logged_on").order("logged_on",{ascending:false}).limit(60)
   ]);
   for(const r of [profile,tasks,open,workouts,focus,sets,defs,unlocks,recovery])if(r.error)throw r.error;
   const taskRows=(tasks.data??[]) as Task[],openRows=(open.data??[]) as Task[],workoutRows=(workouts.data??[]) as Workout[],focusRows=(focus.data??[]) as FocusLog[];
   const completedTasks=taskRows.filter(x=>Boolean(x.completed_at)),completedWorkouts=workoutRows.filter(x=>Boolean(x.completed_at)),focusMinutes=focusRows.reduce((n,x)=>n+Math.max(0,x.completed_minutes??0),0),best=Math.max(0,...(sets.data??[]).map((x:{reps:number})=>Number(x.reps)||0));
   const week=Array.from({length:7},(_,i)=>{const d=new Date(weekStart);d.setDate(weekStart.getDate()+i);const key=dayKey(d);const count=taskRows.filter(x=>dayKey(new Date(x.created_at))===key).length+workoutRows.filter(x=>dayKey(new Date(x.started_at))===key).length+focusRows.filter(x=>dayKey(new Date(x.started_at))===key).length;return{label:d.toLocaleDateString(undefined,{weekday:"short"}),count,today:key===dayKey(today)}});
   const trackedExercises=new Set((sets.data??[]).map((x:{exercise_name:string})=>x.exercise_name)).size;
   const trackedMuscles=new Set((sets.data??[]).map((x:{muscle_group:string})=>x.muscle_group)).size;
   const activeDays=week.filter(x=>x.count>0).length;
   const rules=[
    {id:"first_task",ok:completedTasks.length>=1},{id:"first_workout",ok:completedWorkouts.length>=1},
    {id:"five_workouts",ok:completedWorkouts.length>=5},{id:"first_focus",ok:focusRows.some(x=>(x.completed_minutes??0)>0)},
    {id:"focus_hour",ok:focusMinutes>=60},{id:"first_set",ok:best>0},
    {id:"ten_workouts",ok:completedWorkouts.length>=10},{id:"twenty_workouts",ok:completedWorkouts.length>=20},
    {id:"ten_tasks",ok:completedTasks.length>=10},{id:"twentyfive_tasks",ok:completedTasks.length>=25},
    {id:"five_focus_sessions",ok:focusRows.filter(x=>(x.completed_minutes??0)>0).length>=5},
    {id:"five_focus_hours",ok:focusMinutes>=300},{id:"five_exercises",ok:trackedExercises>=5},
    {id:"all_muscles",ok:trackedMuscles>=8},{id:"first_recovery",ok:(recovery.data??[]).length>=1},
    {id:"three_active_days",ok:activeDays>=3}
   ];
   const existing=new Set((unlocks.data??[]).map((x:{achievement_id:string})=>x.achievement_id)),newRows=rules.filter(x=>x.ok&&!existing.has(x.id)).map(x=>({user_id:uid,achievement_id:x.id}));
   if(newRows.length){const {error:e}=await supabase.from("user_achievements").upsert(newRows,{onConflict:"user_id,achievement_id",ignoreDuplicates:true});if(e)throw e}
   setName((profile.data?.display_name||auth.user.email?.split("@")[0]||"there").split(" ")[0]);setOpenTasks(openRows);setWeekData(week);setAchievements((defs.data??[]) as Achievement[]);setUnlocked(new Set([...existing,...newRows.map(x=>x.achievement_id)]));setBestReps(best);
   setTotals({xp:completedTasks.length*10+completedWorkouts.length*25+Math.floor(focusMinutes/5),completedTasks:completedTasks.length,workouts:completedWorkouts.length,focusMinutes,activeDays:week.filter(x=>x.count>0).length,tasksToday:taskRows.filter(x=>dayKey(new Date(x.created_at))===dayKey(today)).length,completedToday:completedTasks.filter(x=>x.completed_at&&dayKey(new Date(x.completed_at))===dayKey(today)).length});
  }catch(e){setError(e instanceof Error?e.message:"Couldn't load your dashboard.")}finally{setLoading(false)}
 }
 useEffect(()=>{void loadDashboard()},[]);
 async function addTask(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!supabase||!taskInput.trim())return;setBusy(true);setError("");setNotice("");try{const {data,error}=await supabase.auth.getUser();if(error)throw error;if(!data.user)throw new Error("Log in again to add a task.");const {error:insertError}=await supabase.from("tasks").insert({user_id:data.user.id,title:taskInput.trim(),priority:"normal"});if(insertError)throw insertError;setTaskInput("");setNotice("Task added.");await loadDashboard()}catch(e){setError(e instanceof Error?e.message:"Couldn't add that task.")}finally{setBusy(false)}}
 async function completeTask(task:Task){if(!supabase)return;setBusy(true);setError("");setNotice("");const {error}=await supabase.from("tasks").update({completed_at:new Date().toISOString()}).eq("id",task.id);if(error)setError(error.message);else{setNotice("Mission complete. Nice work.");await loadDashboard()}setBusy(false)}
 const rank=rankFor(bestReps),maxBar=Math.max(1,...weekData.map(x=>x.count)),unlockedAchievements=achievements.filter(x=>unlocked.has(x.id));
 return <section className="banana-home">
  {(error||notice)&&<p className={error?"module-alert error":"module-alert"} role="status">{error||notice}</p>}
  <section className="home-hero"><div className="home-hero-copy"><span className="home-overline">YOUR PERSONAL PROGRESSION</span><h2>Good to see you, <em>{name}.</em></h2><p>Build momentum at your own pace. Your progress is measured by what you actually log.</p><div className="home-rank-line"><span className="home-rank-mark">✦</span><div><small>OVERALL EXERCISE RANK</small><strong>{rank.name}</strong></div><span className="home-rank-reps">{bestReps} best reps</span></div><div className="home-rank-progress"><i style={{width:rank.progress+"%"}}/></div><small className="home-rank-next">{rank.next?Math.max(0,rank.next.min-bestReps)+" reps in one set to "+rank.next.name:"Highest tier reached"}</small></div><div className="home-hero-side"><div className="home-xp-value">{totals.xp}<span>XP</span></div><small>30-DAY XP EARNED</small><div className="home-xp-caption">Tasks · workouts · focus sessions</div></div></section>
  <div className="home-stat-grid"><article className="home-stat-card"><span>WORKOUTS COMPLETED</span><strong>{totals.workouts}</strong><small>Last 30 days</small></article><article className="home-stat-card"><span>FOCUS MINUTES</span><strong>{totals.focusMinutes}</strong><small>Last 30 days</small></article><article className="home-stat-card"><span>TASKS COMPLETED</span><strong>{totals.completedTasks}</strong><small>Last 30 days</small></article><article className="home-stat-card"><span>ACTIVE DAYS</span><strong>{totals.activeDays}<small> / 7</small></strong><small>This week</small></article></div>
  <div className="home-main-grid"><article className="module-card home-missions-card"><div className="module-card-head"><div><p className="eyebrow">DAILY MISSIONS</p><h3>Make today count.</h3><p>{totals.completedToday} of {totals.tasksToday} tasks created today completed</p></div><span>{openTasks.length} OPEN</span></div><form className="home-add-task" onSubmit={addTask}><input className="module-input" value={taskInput} onChange={e=>setTaskInput(e.target.value)} placeholder="Add a task for today…" maxLength={160}/><button className="module-small-button" disabled={busy||!taskInput.trim()}>Add</button></form>{loading?<p className="module-empty">Loading your missions…</p>:openTasks.length===0?<p className="module-empty">No open tasks. Add a small mission when you're ready.</p>:openTasks.map(task=><div className="home-task-row" key={task.id}><span className={"home-priority home-priority-"+task.priority}/><span>{task.title}</span><button disabled={busy} onClick={()=>void completeTask(task)}>Complete</button></div>)}<button className="home-link-button" onClick={()=>onNavigate("AI")}>Open task board and BANANA AI <b>↗</b></button></article>
   <article className="module-card home-week-card"><div className="module-card-head"><div><p className="eyebrow">YOUR ACTIVITY</p><h3>This week</h3><p>Logged tasks, workouts and focus sessions</p></div><span>{totals.activeDays}/7 DAYS</span></div><div className="home-week-bars">{weekData.map(day=><div className="home-week-day" key={day.label}><div className="home-week-bar-wrap"><i style={{height:(day.count?Math.max(9,day.count/maxBar*100):3)+"%"}}/></div><small className={day.today?"today":""}>{day.label}</small></div>)}</div><div className="home-week-legend"><i/> Activity logged <span>Rest days count too.</span></div></article></div>
  <div className="home-shortcuts"><button onClick={()=>onNavigate("Health")}><span className="home-shortcut-icon">✳</span><span><strong>Health & ranks</strong><small>Workouts, muscle map and records</small></span><b>↗</b></button><button onClick={()=>onNavigate("Focus")}><span className="home-shortcut-icon cyan">◷</span><span><strong>Focus mode</strong><small>Timers and focus history</small></span><b>↗</b></button><button onClick={()=>onNavigate("AI")}><span className="home-shortcut-icon">✦</span><span><strong>BANANA AI</strong><small>Planning and workout critique</small></span><b>↗</b></button><button onClick={()=>onNavigate("Music")}><span className="home-shortcut-icon cyan">♫</span><span><strong>Music</strong><small>Playlists and Spotify embed</small></span><b>↗</b></button></div>
  <article className="module-card home-achievements"><div className="module-card-head"><div><p className="eyebrow">ACHIEVEMENTS</p><h3>Milestones you've unlocked</h3><p>Earned from real activity recorded in BANANA.</p></div><span>{unlockedAchievements.length} UNLOCKED</span></div>{unlockedAchievements.length?<div className="home-achievement-grid">{unlockedAchievements.map(x=><div className="home-achievement" key={x.id}><span>{x.icon||"✦"}</span><div><strong>{x.name}</strong><small>{x.description}</small></div></div>)}</div>:<p className="module-empty">Your first milestones will appear here as you log activity.</p>}</article>
  <p className="home-data-note">Stats are calculated from your own saved records. No sample scores or invented leaderboard data.</p>
 </section>
}
