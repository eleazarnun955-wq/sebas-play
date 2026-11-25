-- Clients cannot read or mutate device-pairing data directly.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='device_pairing_sessions' and policyname='Deny direct client access') then
    create policy "Deny direct client access" on public.device_pairing_sessions
      for all to anon, authenticated using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='paired_devices' and policyname='Deny direct client access') then
    create policy "Deny direct client access" on public.paired_devices
      for all to anon, authenticated using (false) with check (false);
  end if;
end $$;
