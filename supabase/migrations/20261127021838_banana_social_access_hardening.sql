-- These lookup RPCs return minimal profile data and must never be executable anonymously.
revoke execute on function public.find_banana_friend(text) from anon;
revoke execute on function public.list_banana_connections() from anon;
grant execute on function public.find_banana_friend(text) to authenticated;
grant execute on function public.list_banana_connections() to authenticated;
create index if not exists friend_connections_requested_by_idx on public.friend_connections(requested_by);
