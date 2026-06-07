create table public.sync_metadata (
  id text primary key default 'default',
  last_synced_at timestamptz not null default now()
);

insert into public.sync_metadata (id, last_synced_at)
values ('default', now())
on conflict (id) do nothing;

alter table public.sync_metadata enable row level security;

create policy "Sync metadata is viewable by authenticated users"
  on public.sync_metadata for select to authenticated using (true);
