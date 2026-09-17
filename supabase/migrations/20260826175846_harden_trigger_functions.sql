-- Trigger functions must not be reachable as PostgREST RPC endpoints
-- (Supabase security advisor 0028/0029).
revoke execute on function public.handle_new_user()     from public, anon, authenticated;
revoke execute on function public.touch_learning_state() from public, anon, authenticated;
revoke execute on function public.touch_updated_at()     from public, anon, authenticated;
