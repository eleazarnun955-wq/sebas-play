-- SEBAS PLAY: video bucket for authorized, public-to-playback assets.
-- Run once in Supabase SQL Editor. Free plan currently caps individual uploads at 50 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sebas-play-videos', 'sebas-play-videos', true, 52428800, array['video/mp4'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Only authenticated administrators may upload, replace, or delete objects.
drop policy if exists "SEBAS PLAY admins upload videos" on storage.objects;
create policy "SEBAS PLAY admins upload videos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'sebas-play-videos'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "SEBAS PLAY admins update videos" on storage.objects;
create policy "SEBAS PLAY admins update videos"
on storage.objects for update to authenticated
using (
  bucket_id = 'sebas-play-videos'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  bucket_id = 'sebas-play-videos'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "SEBAS PLAY admins delete videos" on storage.objects;
create policy "SEBAS PLAY admins delete videos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'sebas-play-videos'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Public playback is read-only; the object URL can be opened by Android and Roku.
drop policy if exists "SEBAS PLAY public playback videos" on storage.objects;
create policy "SEBAS PLAY public playback videos"
on storage.objects for select to public
using (bucket_id = 'sebas-play-videos');
