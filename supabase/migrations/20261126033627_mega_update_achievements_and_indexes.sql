-- BANANA mega update: achievement catalog and supporting foreign-key indexes
create index if not exists playlist_tracks_playlist_id_idx on public.playlist_tracks(playlist_id);
create index if not exists playlist_tracks_user_id_idx on public.playlist_tracks(user_id);
create index if not exists user_achievements_achievement_id_idx on public.user_achievements(achievement_id);
create index if not exists workout_plans_user_id_idx on public.workout_plans(user_id);
create index if not exists workout_sessions_plan_id_idx on public.workout_sessions(plan_id);

insert into public.achievements (id, name, description, category, icon, requirement) values
('first_task', 'First Mission', 'Complete your first saved task.', 'focus', '✓', '{"tasks":1}'::jsonb),
('first_workout', 'First Session', 'Finish your first logged workout.', 'health', '✳', '{"workouts":1}'::jsonb),
('five_workouts', 'Finding Your Rhythm', 'Complete five logged workouts.', 'health', '◆', '{"workouts":5}'::jsonb),
('first_focus', 'Focus Initiated', 'Complete your first focus session.', 'focus', '◷', '{"focus_sessions":1}'::jsonb),
('focus_hour', 'Deep Work', 'Log 60 completed focus minutes.', 'focus', '⌁', '{"focus_minutes":60}'::jsonb),
('first_set', 'Record Keeper', 'Log your first exercise set.', 'health', '★', '{"sets":1}'::jsonb)
on conflict (id) do update set
 name = excluded.name,
 description = excluded.description,
 category = excluded.category,
 icon = excluded.icon,
 requirement = excluded.requirement;
