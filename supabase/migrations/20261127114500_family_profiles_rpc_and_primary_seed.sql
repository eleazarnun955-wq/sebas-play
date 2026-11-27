-- SEBAS PLAY 14.0 family profile API.
-- Applied to the linked Supabase project on 2026-11-27.
alter table public.family_profiles
  add column if not exists is_primary boolean not null default false;

create unique index if not exists family_profiles_one_primary_per_user
  on public.family_profiles(user_id) where is_primary;

create or replace function public.list_my_family_profiles()
returns table(id uuid, display_name text, avatar_url text, is_primary boolean, created_at timestamptz)
language sql security definer
set search_path = public, private, pg_temp
as $$
  select fp.id, fp.display_name, fp.avatar_url, fp.is_primary, fp.created_at
  from public.family_profiles fp
  where fp.user_id = auth.uid()
  order by fp.is_primary desc, fp.created_at asc;
$$;

create or replace function public.create_my_family_profile(p_display_name text, p_avatar_url text default null)
returns uuid
language plpgsql security definer
set search_path = public, private, pg_temp
as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión.'; end if;
  if char_length(btrim(coalesce(p_display_name, ''))) < 1 or char_length(btrim(p_display_name)) > 40 then
    raise exception 'El nombre debe tener entre 1 y 40 caracteres.';
  end if;
  if (select count(*) from public.family_profiles where user_id = auth.uid()) >= 6 then
    raise exception 'Puedes tener hasta 6 perfiles por cuenta.';
  end if;
  insert into public.family_profiles(user_id, display_name, avatar_url, is_primary)
  values(auth.uid(), btrim(p_display_name), nullif(btrim(coalesce(p_avatar_url,'')),''), false)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.rename_my_family_profile(p_profile_id uuid, p_display_name text)
returns boolean
language plpgsql security definer
set search_path = public, private, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión.'; end if;
  if char_length(btrim(coalesce(p_display_name, ''))) < 1 or char_length(btrim(p_display_name)) > 40 then
    raise exception 'El nombre debe tener entre 1 y 40 caracteres.';
  end if;
  update public.family_profiles
     set display_name = btrim(p_display_name), updated_at = now()
   where id = p_profile_id and user_id = auth.uid() and is_primary = false;
  if not found then raise exception 'No se pudo cambiar el perfil. La cuenta principal está protegida.'; end if;
  return true;
end;
$$;

create or replace function public.delete_my_family_profile(p_profile_id uuid)
returns boolean
language plpgsql security definer
set search_path = public, private, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión.'; end if;
  delete from public.family_profiles
   where id = p_profile_id and user_id = auth.uid() and is_primary = false;
  if not found then raise exception 'No se pudo eliminar el perfil. La cuenta principal está protegida.'; end if;
  return true;
end;
$$;

create or replace function public.ensure_primary_family_profile()
returns trigger
language plpgsql security definer
set search_path = public, private, pg_temp
as $$
begin
  insert into public.family_profiles(user_id, display_name, is_primary)
  values(new.id, coalesce(nullif(btrim(new.raw_user_meta_data->>'name'),''), nullif(split_part(new.email,'@',1),''), 'Cuenta principal'), true)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_family_profile on auth.users;
create trigger on_auth_user_created_family_profile
  after insert on auth.users
  for each row execute procedure public.ensure_primary_family_profile();

insert into public.family_profiles(user_id, display_name, is_primary)
select u.id,
       coalesce(nullif(btrim(u.raw_user_meta_data->>'name'),''), nullif(split_part(u.email,'@',1),''), 'Cuenta principal'),
       true
from auth.users u
where not exists (select 1 from public.family_profiles fp where fp.user_id = u.id);

revoke all on function public.ensure_primary_family_profile() from public, anon, authenticated;
revoke all on function public.list_my_family_profiles() from public, anon;
revoke all on function public.create_my_family_profile(text,text) from public, anon;
revoke all on function public.rename_my_family_profile(uuid,text) from public, anon;
revoke all on function public.delete_my_family_profile(uuid) from public, anon;
grant execute on function public.list_my_family_profiles() to authenticated;
grant execute on function public.create_my_family_profile(text,text) to authenticated;
grant execute on function public.rename_my_family_profile(uuid,text) to authenticated;
grant execute on function public.delete_my_family_profile(uuid) to authenticated;
