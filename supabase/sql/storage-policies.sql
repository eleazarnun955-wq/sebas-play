-- SEBAS PLAY poster storage policies.
-- Review and apply only after confirming the admin JWT app_metadata role is configured.
-- The bucket is public for reading poster URLs; writes are restricted to trusted admins.
alter table storage.objects enable row level security;

drop policy if exists "SEBAS PLAY admins upload posters" on storage.objects;
create policy "SEBAS PLAY admins upload posters"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'sebas-play-posters'
  and (select public.is_sebas_play_admin())
);

drop policy if exists "SEBAS PLAY admins update posters" on storage.objects;
create policy "SEBAS PLAY admins update posters"
on storage.objects for update
to authenticated
using (
  bucket_id = 'sebas-play-posters'
  and (select public.is_sebas_play_admin())
)
with check (
  bucket_id = 'sebas-play-posters'
  and (select public.is_sebas_play_admin())
);

drop policy if exists "SEBAS PLAY admins delete posters" on storage.objects;
create policy "SEBAS PLAY admins delete posters"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'sebas-play-posters'
  and (select public.is_sebas_play_admin())
);
