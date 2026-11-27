-- Keep social challenge goals moderate and recovery-friendly.
alter table public.friend_challenges
 drop constraint if exists friend_challenges_target_check;
alter table public.friend_challenges
 add constraint friend_challenges_target_check check (
  target >= 1
  and target <= case metric
   when 'workouts' then greatest(1, ceil((ends_on - starts_on + 1)::numeric / 7)::integer * 3)
   when 'focus_minutes' then greatest(60, ceil((ends_on - starts_on + 1)::numeric / 7)::integer * 180)
   else greatest(5, ceil((ends_on - starts_on + 1)::numeric / 7)::integer * 50)
  end
 );
