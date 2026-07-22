do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'episodes'
  ) then
    alter publication supabase_realtime add table public.episodes;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'episode_deletions'
  ) then
    alter publication supabase_realtime add table public.episode_deletions;
  end if;
end
$$;
