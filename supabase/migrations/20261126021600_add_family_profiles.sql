create table if not exists public.family_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  avatar_url text,
  pin_hash text,
  pin_salt text,
  pin_iterations integer,
  failed_attempts integer not null default 0 check (failed_attempts between 0 and 5),
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_profiles_pin_fields_consistent check (
    (pin_hash is null and pin_salt is null and pin_iterations is null) or
    (pin_hash is not null and pin_salt is not null and pin_iterations between 100000 and 1000000)
  )
);

create index if not exists family_profiles_user_created_idx
  on public.family_profiles(user_id, created_at);

alter table public.family_profiles enable row level security;

revoke all on table public.family_profiles from anon, authenticated;
grant all on table public.family_profiles to service_role;

-- No client role receives table access. The authenticated Edge Function uses service_role
-- only after validating the user's access token and scoping every operation by user_id.
comment on table public.family_profiles is
  'Private household profiles. PIN hashes are PBKDF2-SHA256 with per-profile random salts; raw PINs are never stored.';
