alter table public.matches
  add column if not exists home_team_img text,
  add column if not exists away_team_img text;
