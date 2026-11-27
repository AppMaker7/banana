-- Private friend-code connections. Profiles remain private; lookup returns only a display name and ID to authenticated users.
alter table public.profiles add column if not exists friend_code text;
update public.profiles set friend_code = upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10)) where friend_code is null;
alter table public.profiles alter column friend_code set default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10));
alter table public.profiles alter column friend_code set not null;
create unique index if not exists profiles_friend_code_uidx on public.profiles(friend_code);

create table if not exists public.friend_connections (
 id uuid primary key default gen_random_uuid(),
 user_a uuid not null references auth.users(id) on delete cascade,
 user_b uuid not null references auth.users(id) on delete cascade,
 requested_by uuid not null references auth.users(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','accepted','rejected')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (user_a < user_b),
 check (requested_by = user_a or requested_by = user_b),
 unique(user_a,user_b)
);
alter table public.friend_connections enable row level security;
create index if not exists friend_connections_user_a_idx on public.friend_connections(user_a,status);
create index if not exists friend_connections_user_b_idx on public.friend_connections(user_b,status);
create policy friend_connections_read_participant on public.friend_connections for select to authenticated using ((select auth.uid()) = user_a or (select auth.uid()) = user_b);
create policy friend_connections_create_self on public.friend_connections for insert to authenticated with check ((select auth.uid()) = requested_by and ((select auth.uid()) = user_a or (select auth.uid()) = user_b) and status = 'pending');
create policy friend_connections_respond on public.friend_connections for update to authenticated using (((select auth.uid()) = user_a or (select auth.uid()) = user_b) and (select auth.uid()) <> requested_by and status = 'pending') with check (((select auth.uid()) = user_a or (select auth.uid()) = user_b) and (select auth.uid()) <> requested_by and status in ('accepted','rejected'));

create or replace function public.find_banana_friend(p_code text)
returns table(id uuid, display_name text) language sql security definer set search_path = '' stable as $$
 select p.id, p.display_name from public.profiles p
 where auth.uid() is not null and p.friend_code = upper(trim(p_code)) and p.id <> auth.uid() limit 1;
$$;
revoke all on function public.find_banana_friend(text) from public;
grant execute on function public.find_banana_friend(text) to authenticated;

create or replace function public.list_banana_connections()
returns table(id uuid, friend_id uuid, display_name text, status text, requested_by uuid, created_at timestamptz, incoming boolean)
language sql security definer set search_path = '' stable as $$
 select c.id, case when c.user_a = auth.uid() then c.user_b else c.user_a end,
 p.display_name, c.status, c.requested_by, c.created_at, (c.requested_by <> auth.uid())
 from public.friend_connections c
 join public.profiles p on p.id = case when c.user_a = auth.uid() then c.user_b else c.user_a end
 where auth.uid() is not null and (c.user_a = auth.uid() or c.user_b = auth.uid())
 order by c.created_at desc;
$$;
revoke all on function public.list_banana_connections() from public;
grant execute on function public.list_banana_connections() to authenticated;
