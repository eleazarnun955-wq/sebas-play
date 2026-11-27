-- Keep Android and Roku profile favorites/watch progress synchronized in realtime.
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites, public.watch_progress, public.family_profile_favorites, public.family_profile_watch_progress;
