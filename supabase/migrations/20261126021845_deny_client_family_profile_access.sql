create policy "Deny direct client access to family profiles"
  on public.family_profiles
  for all
  to anon, authenticated
  using (false)
  with check (false);