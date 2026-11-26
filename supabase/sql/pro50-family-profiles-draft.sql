-- DRAFT ONLY — do not apply to production yet.
-- Family profiles require moving personal-library access behind the Edge Function.
-- This file is intentionally stored under supabase/sql (not migrations) until
-- app + Roku + Edge Function are updated and reviewed together.
--
-- Preconditions verified against current project:
--   profiles.id -> auth.users.id (one auth profile per account)
--   favorites unique(user_id, content_type, content_id)
--   watch_progress unique(user_id, content_type, content_id)
--   paired_devices has user_id and token_hash, but no profile_id
--
-- The existing favorites/watch_progress policies authorize the entire account.
-- They MUST be replaced before child PIN profiles can be considered isolated.
-- Never expose family_profile_secrets or allow clients to update PIN counters.

begin;

create table if not exists public.family_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  avatar_key text not null default 'default' check (char_length(avatar_key) <= 40),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_profiles_user_id_id_unique unique (user_id, id)
);

create unique index if not exists family_profiles_one_default_per_user
  on public.family_profiles(user_id) where is_default;

create table if not exists public.family_profile_secrets (
  profile_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  pin_salt text,
  pin_hash text,
  pin_iterations integer not null default 310000
    check (pin_iterations between 100000 and 1000000),
  failed_attempts integer not null default 0
    check (failed_attempts between 0 and 10),
  locked_until timestamptz,
  updated_at timestamptz not null default now(),
  constraint family_profile_secrets_profile_owner_fk
    foreign key (user_id, profile_id)
    references public.family_profiles(user_id, id) on delete cascade,
  constraint family_profile_pin_pair_check
    check ((pin_salt is null and pin_hash is null) or
           (pin_salt is not null and pin_hash is not null))
);

insert into public.family_profiles(user_id, display_name, is_default)
select u.id, 'Principal', true
from auth.users u
where not exists (
  select 1 from public.family_profiles fp
  where fp.user_id = u.id and fp.is_default
);

alter table public.favorites add column if not exists profile_id uuid;
update public.favorites f
set profile_id = fp.id
from public.family_profiles fp
where fp.user_id = f.user_id and fp.is_default and f.profile_id is null;
alter table public.favorites alter column profile_id set not null;
alter table public.favorites
  add constraint favorites_user_profile_fk
  foreign key (user_id, profile_id)
  references public.family_profiles(user_id, id) on delete cascade;
alter table public.favorites
  drop constraint if exists favorites_user_id_content_type_content_id_key;
create unique index if not exists favorites_user_profile_content_unique
  on public.favorites(user_id, profile_id, content_type, content_id);

alter table public.watch_progress add column if not exists profile_id uuid;
update public.watch_progress w
set profile_id = fp.id
from public.family_profiles fp
where fp.user_id = w.user_id and fp.is_default and w.profile_id is null;
alter table public.watch_progress alter column profile_id set not null;
alter table public.watch_progress
  add constraint watch_progress_user_profile_fk
  foreign key (user_id, profile_id)
  references public.family_profiles(user_id, id) on delete cascade;
alter table public.watch_progress
  drop constraint if exists watch_progress_user_id_content_type_content_id_key;
create unique index if not exists watch_progress_user_profile_content_unique
  on public.watch_progress(user_id, profile_id, content_type, content_id);

alter table public.paired_devices add column if not exists profile_id uuid;
update public.paired_devices d
set profile_id = fp.id
from public.family_profiles fp
where fp.user_id = d.user_id and fp.is_default and d.profile_id is null;
alter table public.paired_devices alter column profile_id set not null;
alter table public.paired_devices
  add constraint paired_devices_user_profile_fk
  foreign key (user_id, profile_id)
  references public.family_profiles(user_id, id) on delete cascade;

alter table public.device_pairing_sessions add column if not exists profile_id uuid;
update public.device_pairing_sessions s
set profile_id = fp.id
from public.family_profiles fp
where fp.user_id = s.user_id and fp.is_default and s.profile_id is null;
alter table public.device_pairing_sessions alter column profile_id set not null;
alter table public.device_pairing_sessions
  add constraint device_pairing_sessions_user_profile_fk
  foreign key (user_id, profile_id)
  references public.family_profiles(user_id, id) on delete cascade;

alter table public.family_profiles enable row level security;
alter table public.family_profile_secrets enable row level security;

drop policy if exists "Users can read own family profiles" on public.family_profiles;
create policy "Users can read own family profiles"
  on public.family_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own family profiles" on public.family_profiles;
create policy "Users can create own family profiles"
  on public.family_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own family profiles" on public.family_profiles;
create policy "Users can update own family profiles"
  on public.family_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- PIN hashes and lockout counters are server-only.
revoke all on public.family_profile_secrets from anon, authenticated;
revoke all on public.family_profile_secrets from public;
grant all on public.family_profile_secrets to service_role;

-- Favorites and progress must not remain directly readable across sibling
-- profiles. The application must switch these operations to the protected
-- Edge Function before enabling this migration in production.
-- Do not apply this draft until the Edge Function and both clients are ready.

commit;
