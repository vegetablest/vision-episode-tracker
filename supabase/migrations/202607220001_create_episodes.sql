create table public.episodes (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  payload jsonb not null,
  revision integer not null check (revision > 0),
  status text not null check (status in ('ongoing', 'completed', 'voided')),
  occurred_on date not null,
  start_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index episodes_user_id_updated_at_idx on public.episodes(user_id, updated_at desc);

alter table public.episodes enable row level security;
revoke all on public.episodes from anon;
grant select, insert, update, delete on public.episodes to authenticated;

create policy "read own episodes" on public.episodes
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "insert own episodes" on public.episodes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "update own episodes" on public.episodes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "delete own episodes" on public.episodes
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.sync_episode(episode_data jsonb)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.episodes (
    id, user_id, payload, revision, status, occurred_on, start_at, created_at, updated_at
  ) values (
    (episode_data->>'id')::uuid,
    (select auth.uid()),
    episode_data,
    (episode_data->>'revision')::integer,
    episode_data->>'status',
    (episode_data->>'occurredOn')::date,
    (episode_data->>'startAt')::timestamptz,
    (episode_data->>'createdAt')::timestamptz,
    (episode_data->>'updatedAt')::timestamptz
  )
  on conflict (id) do update set
    payload = excluded.payload,
    revision = excluded.revision,
    status = excluded.status,
    occurred_on = excluded.occurred_on,
    start_at = excluded.start_at,
    updated_at = excluded.updated_at
  where public.episodes.user_id = (select auth.uid())
    and (public.episodes.revision, public.episodes.updated_at) < (excluded.revision, excluded.updated_at);
$$;

revoke all on function public.sync_episode(jsonb) from public, anon;
grant execute on function public.sync_episode(jsonb) to authenticated;

create table public.episode_deletions (
  episode_id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  revision integer not null check (revision > 0),
  updated_at timestamptz not null
);

alter table public.episode_deletions enable row level security;
revoke all on public.episode_deletions from anon;
grant select, insert, update on public.episode_deletions to authenticated;

create policy "read own episode deletions" on public.episode_deletions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own episode deletions" on public.episode_deletions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own episode deletions" on public.episode_deletions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.sync_episode_deletion(target_id uuid, target_revision integer, target_updated_at timestamptz)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.episode_deletions (episode_id, user_id, revision, updated_at)
  values (target_id, (select auth.uid()), target_revision, target_updated_at)
  on conflict (episode_id) do update set
    revision = excluded.revision,
    updated_at = excluded.updated_at
  where public.episode_deletions.user_id = (select auth.uid())
    and (public.episode_deletions.revision, public.episode_deletions.updated_at) < (excluded.revision, excluded.updated_at);

  delete from public.episodes
  where id = target_id and user_id = (select auth.uid())
    and (revision, updated_at) < (target_revision, target_updated_at);
end;
$$;

revoke all on function public.sync_episode_deletion(uuid, integer, timestamptz) from public, anon;
grant execute on function public.sync_episode_deletion(uuid, integer, timestamptz) to authenticated;

create or replace function public.sync_episode(episode_data jsonb)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.episodes (
    id, user_id, payload, revision, status, occurred_on, start_at, created_at, updated_at
  )
  select
    (episode_data->>'id')::uuid,
    (select auth.uid()),
    episode_data,
    (episode_data->>'revision')::integer,
    episode_data->>'status',
    (episode_data->>'occurredOn')::date,
    (episode_data->>'startAt')::timestamptz,
    (episode_data->>'createdAt')::timestamptz,
    (episode_data->>'updatedAt')::timestamptz
  where not exists (
    select 1 from public.episode_deletions
    where episode_id = (episode_data->>'id')::uuid
      and user_id = (select auth.uid())
      and (revision, updated_at) >= ((episode_data->>'revision')::integer, (episode_data->>'updatedAt')::timestamptz)
  )
  on conflict (id) do update set
    payload = excluded.payload,
    revision = excluded.revision,
    status = excluded.status,
    occurred_on = excluded.occurred_on,
    start_at = excluded.start_at,
    updated_at = excluded.updated_at
  where public.episodes.user_id = (select auth.uid())
    and (public.episodes.revision, public.episodes.updated_at) < (excluded.revision, excluded.updated_at);
$$;
