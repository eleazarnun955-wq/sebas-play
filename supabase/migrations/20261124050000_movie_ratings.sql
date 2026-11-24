-- One rating per authenticated viewer and movie. Public totals can be added later without exposing user identities.
create table if not exists public.movie_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  rating smallint not null check (rating in (-1, 1)),
  updated_at timestamptz not null default now(),
  constraint movie_ratings_user_movie_unique unique (user_id, movie_id)
);

alter table public.movie_ratings enable row level security;

drop policy if exists "View own movie ratings" on public.movie_ratings;
create policy "View own movie ratings"
  on public.movie_ratings for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Create own movie ratings" on public.movie_ratings;
create policy "Create own movie ratings"
  on public.movie_ratings for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Update own movie ratings" on public.movie_ratings;
create policy "Update own movie ratings"
  on public.movie_ratings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists movie_ratings_movie_id_idx on public.movie_ratings(movie_id);
