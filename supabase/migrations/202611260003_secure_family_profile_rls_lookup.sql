-- Harden profile ownership checks. family_profiles intentionally denies direct client access,
-- so exposed table policies call a narrowly scoped helper in the unexposed private schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create or replace function private.owns_family_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.family_profiles p
    where p.id = p_profile_id
      and p.user_id = (select auth.uid())
  );
$$;
revoke all on function private.owns_family_profile(uuid) from public, anon;
grant execute on function private.owns_family_profile(uuid) to authenticated;

drop policy if exists "Users can read own scoped favorites" on public.favorites;
drop policy if exists "Users can add own scoped favorites" on public.favorites;
drop policy if exists "Users can remove own scoped favorites" on public.favorites;
create policy "Users can read own scoped favorites" on public.favorites for select to authenticated
using (user_id=(select auth.uid()) and (profile_id is null or private.owns_family_profile(profile_id)));
create policy "Users can add own scoped favorites" on public.favorites for insert to authenticated
with check (user_id=(select auth.uid()) and (profile_id is null or private.owns_family_profile(profile_id)));
create policy "Users can remove own scoped favorites" on public.favorites for delete to authenticated
using (user_id=(select auth.uid()) and (profile_id is null or private.owns_family_profile(profile_id)));

drop policy if exists "Users can read own scoped watch progress" on public.watch_progress;
drop policy if exists "Users can add own scoped watch progress" on public.watch_progress;
drop policy if exists "Users can update own scoped watch progress" on public.watch_progress;
drop policy if exists "Users can delete own scoped watch progress" on public.watch_progress;
create policy "Users can read own scoped watch progress" on public.watch_progress for select to authenticated
using (user_id=(select auth.uid()) and (profile_id is null or private.owns_family_profile(profile_id)));
create policy "Users can add own scoped watch progress" on public.watch_progress for insert to authenticated
with check (user_id=(select auth.uid()) and (profile_id is null or private.owns_family_profile(profile_id)));
create policy "Users can update own scoped watch progress" on public.watch_progress for update to authenticated
using (user_id=(select auth.uid()) and (profile_id is null or private.owns_family_profile(profile_id)))
with check (user_id=(select auth.uid()) and (profile_id is null or private.owns_family_profile(profile_id)));
create policy "Users can delete own scoped watch progress" on public.watch_progress for delete to authenticated
using (user_id=(select auth.uid()) and (profile_id is null or private.owns_family_profile(profile_id)));
