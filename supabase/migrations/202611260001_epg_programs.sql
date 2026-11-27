-- SEBAS PLAY 13.0: electronic program guide entries for authorized live channels.
create table if not exists public.epg_programs (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.live_channels(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  source_name text,
  rights_note text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint epg_programs_valid_time check (ends_at > starts_at)
);
create index if not exists epg_programs_channel_start_idx on public.epg_programs (channel_id, starts_at);
alter table public.epg_programs enable row level security;
drop policy if exists "Published EPG or admin readable" on public.epg_programs;
create policy "Published EPG or admin readable" on public.epg_programs for select to anon, authenticated using (is_published = true or is_sebas_play_admin());
drop policy if exists "Admins insert EPG" on public.epg_programs;
create policy "Admins insert EPG" on public.epg_programs for insert to authenticated with check (is_sebas_play_admin());
drop policy if exists "Admins update EPG" on public.epg_programs;
create policy "Admins update EPG" on public.epg_programs for update to authenticated using (is_sebas_play_admin()) with check (is_sebas_play_admin());
drop policy if exists "Admins delete EPG" on public.epg_programs;
create policy "Admins delete EPG" on public.epg_programs for delete to authenticated using (is_sebas_play_admin());
grant select on public.epg_programs to anon, authenticated;
grant insert, update, delete on public.epg_programs to authenticated;
