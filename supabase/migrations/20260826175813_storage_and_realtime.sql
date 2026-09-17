-- Storage buckets and Realtime (TZ.md §5 "Storage", §6 "Асинхронные операции").

-- ---------------------------------------------------------------- buckets
-- Both private; access is granted only by the `user_id`-prefix policies below.
--   materials/{user_id}/...
--   recordings/{user_id}/{activity_id}.m4a

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('materials', 'materials', false, 26214400,
   array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'text/plain']),
  ('recordings', 'recordings', false, 10485760,
   array['audio/m4a', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/webm', 'audio/mpeg', 'audio/wav'])
on conflict (id) do nothing;

-- ------------------------------------------------------- storage policies
-- The first path segment must be the caller's uid. Speaking uploads and
-- Library uploads are both client-initiated, so the client needs INSERT here
-- (the *processing* of what it uploaded still happens in an Edge Function).

create policy "materials: read own objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "materials: write own objects"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'materials' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "materials: update own objects"
  on storage.objects for update to authenticated
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'materials' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "materials: delete own objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "recordings: read own objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "recordings: write own objects"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "recordings: delete own objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- --------------------------------------------------------------- realtime
-- The client subscribes to `job:{id}` and never polls (TZ.md §6).
alter publication supabase_realtime add table public.jobs;
