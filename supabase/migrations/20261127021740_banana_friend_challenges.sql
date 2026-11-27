-- Invite-only challenges between accepted BANANA friends.
create table if not exists public.friend_challenges (
 id uuid primary key default gen_random_uuid(),
 creator_id uuid not null references auth.users(id) on delete cascade,
 participant_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(title) between 1 and 100),
 metric text not null check (metric in ('workouts','focus_minutes','completed_tasks')),
 target integer not null check (target between 1 and 100000),
 starts_on date not null default current_date,
 ends_on date not null,
 status text not null default 'pending' check (status in ('pending','accepted','declined','completed')),
 created_at timestamptz not null default now(),
 check (creator_id <> participant_id),
 check (ends_on >= starts_on)
);
alter table public.friend_challenges enable row level security;
create index if not exists friend_challenges_creator_idx on public.friend_challenges(creator_id,created_at desc);
create index if not exists friend_challenges_participant_idx on public.friend_challenges(participant_id,status,created_at desc);
create policy friend_challenges_read_participant on public.friend_challenges for select to authenticated using ((select auth.uid()) = creator_id or (select auth.uid()) = participant_id);
create policy friend_challenges_create_friend on public.friend_challenges for insert to authenticated with check (
 creator_id = (select auth.uid()) and exists (
  select 1 from public.friend_connections c where c.status = 'accepted'
  and ((c.user_a = creator_id and c.user_b = participant_id) or (c.user_b = creator_id and c.user_a = participant_id))
 )
);
create policy friend_challenges_respond on public.friend_challenges for update to authenticated
using (participant_id = (select auth.uid()) and status = 'pending')
with check (participant_id = (select auth.uid()) and status in ('accepted','declined'));
