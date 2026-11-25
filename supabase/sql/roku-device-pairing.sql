-- Additive, private device-pairing storage for SEBAS PLAY PRO 5.0.
-- Access is intentionally restricted to the Edge Function service role.
create table if not exists public.device_pairing_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null unique,
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint device_pairing_sessions_code_hash_format check (code_hash ~ '^[a-f0-9]{64}$'),
  constraint device_pairing_sessions_expiry check (expires_at > created_at)
);
create index if not exists device_pairing_sessions_user_created_idx on public.device_pairing_sessions(user_id, created_at desc);
create index if not exists device_pairing_sessions_pending_idx on public.device_pairing_sessions(expires_at) where redeemed_at is null;
create table if not exists public.paired_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_name text not null check (length(btrim(device_name)) between 1 and 80),
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at timestamptz,
  constraint paired_devices_token_hash_format check (token_hash ~ '^[a-f0-9]{64}$')
);
create index if not exists paired_devices_user_active_idx on public.paired_devices(user_id, created_at desc) where revoked_at is null;
alter table public.device_pairing_sessions enable row level security;
alter table public.paired_devices enable row level security;
revoke all on table public.device_pairing_sessions from anon, authenticated;
revoke all on table public.paired_devices from anon, authenticated;
grant all on table public.device_pairing_sessions to service_role;
grant all on table public.paired_devices to service_role;
