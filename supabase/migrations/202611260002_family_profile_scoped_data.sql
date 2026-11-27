-- SEBAS PLAY 13.0: isolate favorites and playback history by family profile.
-- Existing rows remain account-wide (profile_id IS NULL) and are not discarded.
alter table public.favorites
  add column if not exists profile_id uuid null references public.family_profiles(id) on delete cascade;
alter table public.watch_progress
  add column if not exists profile_id uuid null references public.family_profiles(id) on delete cascade;

alter table public.favorites drop constraint if exists favorites_user_id_content_type_content_id_key;
alter table public.watch_progress drop constraint if exists watch_progress_user_id_content_type_content_id_key;

create unique index if not exists favorites_account_scope_unique
  on public.favorites(user_id,content_type,content_id) where profile_id is null;
create unique index if not exists favorites_profile_scope_unique
  on public.favorites(user_id,profile_id,content_type,content_id) where profile_id is not null;
create unique index if not exists watch_progress_account_scope_unique
  on public.watch_progress(user_id,content_type,content_id) where profile_id is null;
create unique index if not exists watch_progress_profile_scope_unique
  on public.watch_progress(user_id,profile_id,content_type,content_id) where profile_id is not null;

drop policy if exists "Users can add own favorites" on public.favorites;
drop policy if exists "Users can read own favorites" on public.favorites;
drop policy if exists "Users can remove own favorites" on public.favorites;
create policy "Users can read own scoped favorites" on public.favorites for select to authenticated
using (user_id=(select auth.uid()) and (profile_id is null or exists (
  select 1 from public.family_profiles p where p.id=favorites.profile_id and p.user_id=(select auth.uid())
)));
create policy "Users can add own scoped favorites" on public.favorites for insert to authenticated
with check (user_id=(select auth.uid()) and (profile_id is null or exists (
  select 1 from public.family_profiles p where p.id=favorites.profile_id and p.user_id=(select auth.uid())
)));
create policy "Users can remove own scoped favorites" on public.favorites for delete to authenticated
using (user_id=(select auth.uid()) and (profile_id is null or exists (
  select 1 from public.family_profiles p where p.id=favorites.profile_id and p.user_id=(select auth.uid())
)));

drop policy if exists "Users can add own watch progress" on public.watch_progress;
drop policy if exists "Users can delete own watch progress" on public.watch_progress;
drop policy if exists "Users can read own watch progress" on public.watch_progress;
drop policy if exists "Users can update own watch progress" on public.watch_progress;
create policy "Users can read own scoped watch progress" on public.watch_progress for select to authenticated
using (user_id=(select auth.uid()) and (profile_id is null or exists (
  select 1 from public.family_profiles p where p.id=watch_progress.profile_id and p.user_id=(select auth.uid())
)));
create policy "Users can add own scoped watch progress" on public.watch_progress for insert to authenticated
with check (user_id=(select auth.uid()) and (profile_id is null or exists (
  select 1 from public.family_profiles p where p.id=watch_progress.profile_id and p.user_id=(select auth.uid())
)));
create policy "Users can update own scoped watch progress" on public.watch_progress for update to authenticated
using (user_id=(select auth.uid()) and (profile_id is null or exists (
  select 1 from public.family_profiles p where p.id=watch_progress.profile_id and p.user_id=(select auth.uid())
)))
with check (user_id=(select auth.uid()) and (profile_id is null or exists (
  select 1 from public.family_profiles p where p.id=watch_progress.profile_id and p.user_id=(select auth.uid())
)));
create policy "Users can delete own scoped watch progress" on public.watch_progress for delete to authenticated
using (user_id=(select auth.uid()) and (profile_id is null or exists (
  select 1 from public.family_profiles p where p.id=watch_progress.profile_id and p.user_id=(select auth.uid())
)));

-- Keep Roku devices paired to the profile selected when their one-time code is created.
alter table public.device_pairing_sessions
  add column if not exists profile_id uuid null references public.family_profiles(id) on delete cascade;
alter table public.paired_devices
  add column if not exists profile_id uuid null references public.family_profiles(id) on delete cascade;
