-- Applied directly to Supabase project sebas-play.
-- Admin authorization is based only on trusted auth.app_metadata, never user_metadata.
-- To grant an administrator, set app_metadata.role = "admin" using the Supabase
-- Dashboard / trusted server-side Admin API. Do not allow users to edit app_metadata.
create or replace function public.is_sebas_play_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function public.is_sebas_play_admin() from public;
grant execute on function public.is_sebas_play_admin() to authenticated;

create policy "Admins manage movies" on public.movies
for all to authenticated
using ((select public.is_sebas_play_admin()))
with check ((select public.is_sebas_play_admin()));

create policy "Admins manage series" on public.series
for all to authenticated
using ((select public.is_sebas_play_admin()))
with check ((select public.is_sebas_play_admin()));

create policy "Admins manage seasons" on public.seasons
for all to authenticated
using ((select public.is_sebas_play_admin()))
with check ((select public.is_sebas_play_admin()));

create policy "Admins manage episodes" on public.episodes
for all to authenticated
using ((select public.is_sebas_play_admin()))
with check ((select public.is_sebas_play_admin()));

create policy "Admins manage live channels" on public.live_channels
for all to authenticated
using ((select public.is_sebas_play_admin()))
with check ((select public.is_sebas_play_admin()));

-- Existing public SELECT policies remain restricted to published content.
-- RLS must remain enabled on all catalog tables.