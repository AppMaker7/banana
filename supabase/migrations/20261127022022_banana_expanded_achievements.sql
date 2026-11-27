insert into public.achievements (id,name,description,category,icon,requirement) values
('ten_workouts','Momentum Builder','Complete ten saved workouts.','health','◆','{"workouts":10}'::jsonb),
('twenty_workouts','Training Regular','Complete twenty saved workouts.','health','✦','{"workouts":20}'::jsonb),
('ten_tasks','Task Finisher','Complete ten saved tasks.','focus','✓','{"tasks":10}'::jsonb),
('twentyfive_tasks','Mission Board Pro','Complete twenty-five saved tasks.','focus','▣','{"tasks":25}'::jsonb),
('five_focus_sessions','Focus Rhythm','Complete five focus sessions.','focus','◷','{"focus_sessions":5}'::jsonb),
('five_focus_hours','Deep Focus','Log five hours of completed focus time.','focus','⌁','{"focus_minutes":300}'::jsonb),
('five_exercises','Movement Explorer','Log sets for five different exercises.','health','★','{"exercises":5}'::jsonb),
('all_muscles','Full Map','Log activity across all eight muscle groups.','health','◎','{"muscles":8}'::jsonb),
('first_recovery','Recovery Recorder','Save your first recovery check-in.','health','☼','{"recovery_logs":1}'::jsonb),
('three_active_days','Steady Week','Log activity on three different days in one week.','focus','◈','{"active_days":3}'::jsonb)
on conflict (id) do update set name=excluded.name,description=excluded.description,category=excluded.category,icon=excluded.icon,requirement=excluded.requirement;
