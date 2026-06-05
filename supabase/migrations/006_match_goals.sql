create table public.match_goals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  minute integer not null check (minute >= 0 and minute <= 130),
  stoppage_minute integer check (stoppage_minute is null or (stoppage_minute >= 0 and stoppage_minute <= 30)),
  period smallint not null check (period >= 1 and period <= 5),
  team text not null check (team in ('home', 'away')),
  player_name text not null,
  goal_type text not null default 'goal'
    check (goal_type in ('goal', 'own_goal', 'penalty')),
  home_score_after integer not null check (home_score_after >= 0),
  away_score_after integer not null check (away_score_after >= 0),
  sort_order integer not null,
  created_at timestamptz not null default now(),
  unique (match_id, sort_order)
);

create index match_goals_match_idx on public.match_goals (match_id, sort_order);

alter table public.match_goals enable row level security;

create policy "Match goals are viewable by authenticated users"
  on public.match_goals for select to authenticated using (true);
