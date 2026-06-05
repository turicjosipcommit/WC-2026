-- Ensure matches uses livescore_event_id (no-op on fresh installs).
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'matches'
      and column_name = 'sofascore_event_id'
  ) then
    alter table public.matches
      rename column sofascore_event_id to livescore_event_id;
  end if;
end $$;
