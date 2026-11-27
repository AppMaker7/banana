create or replace function public.list_banana_friend_leaderboard()
returns table(display_name text, workouts integer, focus_minutes integer, completed_tasks integer, xp integer, is_you boolean)
language sql security definer set search_path = '' stable as $$
 with current_user_opted_in as (
  select p.id from public.profiles p where p.id = auth.uid() and p.share_progress = true
 ),
 visible_users as (
  select auth.uid() as user_id where exists (select 1 from current_user_opted_in)
  union
  select case when c.user_a = auth.uid() then c.user_b else c.user_a end
  from public.friend_connections c
  join public.profiles friend_profile on friend_profile.id = case when c.user_a = auth.uid() then c.user_b else c.user_a end
  where c.status = 'accepted' and (c.user_a = auth.uid() or c.user_b = auth.uid())
   and friend_profile.share_progress = true and exists (select 1 from current_user_opted_in)
 ),
 totals as (
  select v.user_id,p.display_name,
   least(3,(select count(*)::integer from public.workout_sessions w where w.user_id=v.user_id and w.completed_at >= now()-interval '7 days')) as workout_count,
   least(180,(select coalesce(sum(f.completed_minutes),0)::integer from public.focus_sessions f where f.user_id=v.user_id and f.started_at >= now()-interval '7 days' and f.completed_minutes>0)) as focus_total,
   least(50,(select count(*)::integer from public.tasks t where t.user_id=v.user_id and t.completed_at >= now()-interval '7 days')) as task_count
  from visible_users v join public.profiles p on p.id=v.user_id
 )
 select display_name,workout_count,focus_total,task_count,
  (workout_count*25+floor(focus_total::numeric/5)::integer+task_count*10) as xp,
  user_id=auth.uid() as is_you
 from totals order by xp desc,display_name asc;
$$;
revoke all on function public.list_banana_friend_leaderboard() from public;
revoke execute on function public.list_banana_friend_leaderboard() from anon;
grant execute on function public.list_banana_friend_leaderboard() to authenticated;
