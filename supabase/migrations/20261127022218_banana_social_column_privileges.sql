-- Friend participants may only accept or decline requests and invitations.
revoke update on table public.friend_connections from authenticated;
grant update(status) on table public.friend_connections to authenticated;
revoke update on table public.friend_challenges from authenticated;
grant update(status) on table public.friend_challenges to authenticated;
