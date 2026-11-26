-- BANANA initial database foundation
-- Run in Supabase SQL Editor. User-owned records are protected by RLS.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = timezone('utc', now()); return new; end; $$;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'BANANA User' check (char_length(display_name) between 1 and 60),
 avatar_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.user_settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 theme text not null default 'midnight' check (theme in ('midnight','light','banana','ocean')),
 accent_color text not null default '#FFE44D', sound_effects boolean not null default true,
 notifications_enabled boolean not null default true, reduced_motion boolean not null default false,
 dashboard_layout jsonb not null default '{}'::jsonb, preferences jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.tasks (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(title) between 1 and 160), notes text, due_at timestamptz,
 priority text not null default 'normal' check (priority in ('low','normal','high')),
 completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.workout_plans (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 100), description text,
 plan_data jsonb not null default '{}'::jsonb, is_archived boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.workout_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 plan_id uuid references public.workout_plans(id) on delete set null, name text not null,
 started_at timestamptz not null default now(), completed_at timestamptz, notes text,
 created_at timestamptz not null default now()
);
create table if not exists public.workout_sets (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references public.workout_sessions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 exercise_name text not null check (char_length(exercise_name) between 1 and 120), muscle_group text not null,
 set_number integer not null check (set_number > 0), reps integer not null default 0 check (reps >= 0),
 weight numeric(7,2) not null default 0 check (weight >= 0),
 duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
 created_at timestamptz not null default now(), unique (session_id, exercise_name, set_number)
);
create table if not exists public.focus_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 started_at timestamptz not null default now(), ended_at timestamptz,
 planned_minutes integer not null check (planned_minutes between 1 and 1440),
 completed_minutes integer check (completed_minutes is null or completed_minutes >= 0),
 challenge_type text, challenge_completed boolean not null default false, notes text,
 created_at timestamptz not null default now()
);
create table if not exists public.recovery_logs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 logged_on date not null default current_date,
 sleep_hours numeric(4,2) check (sleep_hours is null or sleep_hours between 0 and 24),
 energy_level integer check (energy_level is null or energy_level between 1 and 5),
 soreness_level integer check (soreness_level is null or soreness_level between 1 and 5),
 notes text, created_at timestamptz not null default now(), unique (user_id, logged_on)
);
create table if not exists public.achievements (
 id text primary key, name text not null, description text not null, category text not null,
 icon text, requirement jsonb not null default '{}'::jsonb
);
create table if not exists public.user_achievements (
 user_id uuid not null references auth.users(id) on delete cascade,
 achievement_id text not null references public.achievements(id) on delete cascade,
 unlocked_at timestamptz not null default now(), primary key (user_id, achievement_id)
);
create table if not exists public.playlists (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 100),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.playlist_tracks (
 id uuid primary key default gen_random_uuid(), playlist_id uuid not null references public.playlists(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, title text not null, artist text,
 source text not null check (source in ('external','uploaded')), source_url text, storage_path text,
 position integer not null default 0 check (position >= 0), created_at timestamptz not null default now(),
 check ((source = 'external' and source_url is not null) or (source = 'uploaded' and storage_path is not null))
);

create index if not exists tasks_user_due_idx on public.tasks(user_id, due_at);
create index if not exists workout_sessions_user_started_idx on public.workout_sessions(user_id, started_at desc);
create index if not exists workout_sets_user_session_idx on public.workout_sets(user_id, session_id);
create index if not exists focus_sessions_user_started_idx on public.focus_sessions(user_id, started_at desc);
create index if not exists recovery_logs_user_date_idx on public.recovery_logs(user_id, logged_on desc);
create index if not exists playlists_user_idx on public.playlists(user_id);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles (id, display_name)
 values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'BANANA User'))
 on conflict (id) do nothing;
 insert into public.user_settings (user_id) values (new.id) on conflict (user_id) do nothing;
 return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists settings_updated_at on public.user_settings;
create trigger settings_updated_at before update on public.user_settings for each row execute procedure public.set_updated_at();
drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks for each row execute procedure public.set_updated_at();
drop trigger if exists workout_plans_updated_at on public.workout_plans;
create trigger workout_plans_updated_at before update on public.workout_plans for each row execute procedure public.set_updated_at();
drop trigger if exists playlists_updated_at on public.playlists;
create trigger playlists_updated_at before update on public.playlists for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.tasks enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.recovery_logs enable row level security;
alter table public.user_achievements enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.achievements enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "settings_manage_own" on public.user_settings for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "tasks_manage_own" on public.tasks for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "workout_plans_manage_own" on public.workout_plans for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "workout_sessions_manage_own" on public.workout_sessions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "workout_sets_manage_own" on public.workout_sets for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "focus_sessions_manage_own" on public.focus_sessions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "recovery_logs_manage_own" on public.recovery_logs for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "user_achievements_manage_own" on public.user_achievements for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "playlists_manage_own" on public.playlists for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "playlist_tracks_manage_own" on public.playlist_tracks for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "achievements_read_authenticated" on public.achievements for select to authenticated using (true);
