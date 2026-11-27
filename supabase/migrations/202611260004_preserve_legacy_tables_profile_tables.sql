-- Keep the legacy account-wide favorites/watch_progress tables compatible with 12.0.
-- Profile-specific rows live in dedicated tables so legacy ON CONFLICT clauses remain valid.
create table if not exists public.family_profile_favorites (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 profile_id uuid not null references public.family_profiles(id) on delete cascade,
 content_type text not null check (content_type in ('movie','series','channel')),
 content_id uuid not null,
 created_at timestamptz not null default now(),
 constraint family_profile_favorites_unique unique(user_id,profile_id,content_type,content_id)
);
create table if not exists public.family_profile_watch_progress (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 profile_id uuid not null references public.family_profiles(id) on delete cascade,
 content_type text not null check (content_type in ('movie','episode')),
 content_id uuid not null,
 position_seconds integer not null default 0 check (position_seconds >= 0),
 duration_seconds integer null check (duration_seconds is null or duration_seconds > 0),
 updated_at timestamptz not null default now(),
 constraint family_profile_watch_progress_unique unique(user_id,profile_id,content_type,content_id)
);
create index if not exists family_profile_favorites_profile_idx on public.family_profile_favorites(profile_id);
create index if not exists family_profile_watch_progress_profile_idx on public.family_profile_watch_progress(profile_id);
alter table public.family_profile_favorites enable row level security;
alter table public.family_profile_watch_progress enable row level security;
create policy "Profile owners manage profile favorites" on public.family_profile_favorites for all to authenticated
using (user_id=(select auth.uid()) and private.owns_family_profile(profile_id))
with check (user_id=(select auth.uid()) and private.owns_family_profile(profile_id));
create policy "Profile owners manage profile watch progress" on public.family_profile_watch_progress for all to authenticated
using (user_id=(select auth.uid()) and private.owns_family_profile(profile_id))
with check (user_id=(select auth.uid()) and private.owns_family_profile(profile_id));

insert into public.family_profile_favorites(user_id,profile_id,content_type,content_id,created_at)
select user_id,profile_id,content_type,content_id,created_at from public.favorites where profile_id is not null
on conflict(user_id,profile_id,content_type,content_id) do nothing;
insert into public.family_profile_watch_progress(user_id,profile_id,content_type,content_id,position_seconds,duration_seconds,updated_at)
select user_id,profile_id,content_type,content_id,position_seconds,duration_seconds,updated_at from public.watch_progress where profile_id is not null
on conflict(user_id,profile_id,content_type,content_id) do update set position_seconds=excluded.position_seconds,duration_seconds=excluded.duration_seconds,updated_at=excluded.updated_at;

drop policy if exists "Users can read own scoped favorites" on public.favorites;
drop policy if exists "Users can add own scoped favorites" on public.favorites;
drop policy if exists "Users can remove own scoped favorites" on public.favorites;
drop policy if exists "Users can read own scoped watch progress" on public.watch_progress;
drop policy if exists "Users can add own scoped watch progress" on public.watch_progress;
drop policy if exists "Users can update own scoped watch progress" on public.watch_progress;
drop policy if exists "Users can delete own scoped watch progress" on public.watch_progress;
delete from public.favorites where profile_id is not null;
delete from public.watch_progress where profile_id is not null;
drop index if exists public.favorites_account_scope_unique;
drop index if exists public.favorites_profile_scope_unique;
drop index if exists public.watch_progress_account_scope_unique;
drop index if exists public.watch_progress_profile_scope_unique;
alter table public.favorites drop column if exists profile_id;
alter table public.watch_progress drop column if exists profile_id;
alter table public.favorites add constraint favorites_user_id_content_type_content_id_key unique(user_id,content_type,content_id);
alter table public.watch_progress add constraint watch_progress_user_id_content_type_content_id_key unique(user_id,content_type,content_id);
create policy "Users can read own favorites" on public.favorites for select to authenticated using ((select auth.uid())=user_id);
create policy "Users can add own favorites" on public.favorites for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Users can remove own favorites" on public.favorites for delete to authenticated using ((select auth.uid())=user_id);
create policy "Users can read own watch progress" on public.watch_progress for select to authenticated using ((select auth.uid())=user_id);
create policy "Users can add own watch progress" on public.watch_progress for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Users can update own watch progress" on public.watch_progress for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Users can delete own watch progress" on public.watch_progress for delete to authenticated using ((select auth.uid())=user_id);
