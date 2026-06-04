-- Extra time and penalty predictions for knockout matches

alter table public.matches
  add column home_score_90 integer,
  add column away_score_90 integer,
  add column home_score_et integer,
  add column away_score_et integer,
  add column home_score_pen integer,
  add column away_score_pen integer,
  add column went_to_extra_time boolean not null default false,
  add column went_to_penalties boolean not null default false;

alter table public.predictions
  add column pred_et_home integer check (pred_et_home is null or (pred_et_home >= 0 and pred_et_home <= 20)),
  add column pred_et_away integer check (pred_et_away is null or (pred_et_away >= 0 and pred_et_away <= 20)),
  add column pred_pen_home integer check (pred_pen_home is null or (pred_pen_home >= 0 and pred_pen_home <= 20)),
  add column pred_pen_away integer check (pred_pen_away is null or (pred_pen_away >= 0 and pred_pen_away <= 20)),
  add column et_points_awarded integer,
  add column pen_points_awarded integer;

-- Backfill 90-minute scores from existing final scores
update public.matches
set
  home_score_90 = home_score,
  away_score_90 = away_score
where home_score is not null and away_score is not null;
