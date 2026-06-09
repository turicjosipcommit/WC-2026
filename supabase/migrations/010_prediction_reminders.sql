-- Tracks prediction reminder emails so cron runs do not send duplicates.

create table public.prediction_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  sent_at timestamptz not null default now(),
  unique (user_id, match_id)
);

create index prediction_reminders_match_id_idx
  on public.prediction_reminders (match_id);

alter table public.prediction_reminders enable row level security;
