-- WC Fantasy 2026 — single friend group, no leagues table

create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  livescore_event_id bigint not null unique,
  home_team text not null,
  away_team text not null,
  group_name text,
  stage text not null default 'Group stage',
  round_number integer,
  kickoff_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'finished', 'postponed', 'cancelled')),
  home_score integer,
  away_score integer,
  scored_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index matches_kickoff_idx on public.matches (kickoff_at);
create index matches_status_idx on public.matches (status);

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  pred_home integer not null check (pred_home >= 0 and pred_home <= 20),
  pred_away integer not null check (pred_away >= 0 and pred_away <= 20),
  points_awarded integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

create index predictions_user_idx on public.predictions (user_id);
create index predictions_match_idx on public.predictions (match_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger matches_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

create trigger predictions_updated_at
  before update on public.predictions
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "Matches are viewable by authenticated users"
  on public.matches for select to authenticated using (true);

create policy "Predictions are viewable by authenticated users"
  on public.predictions for select to authenticated using (true);

create policy "Users can insert predictions before kickoff"
  on public.predictions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and m.kickoff_at > now()
        and m.status in ('scheduled', 'postponed')
    )
  );

create policy "Users can update own predictions before kickoff"
  on public.predictions for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and m.kickoff_at > now()
        and m.status in ('scheduled', 'postponed')
    )
  );
