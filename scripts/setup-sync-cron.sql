-- Run once per Supabase project (production, dev friendlies, etc.).
-- Replace values before executing in Supabase → SQL Editor.
--
-- Production example:
--   sync_app_url → https://your-wc-app.vercel.app
--   cron_secret  → same as CRON_SECRET on that deployment
--
-- Dev friendlies example:
--   sync_app_url → dev deployment URL (with LIVESCORE_COMPETITION_ID=537 on the app)
--   cron_secret  → DEV_CRON_SECRET for that deployment

select vault.create_secret('https://your-app.example.com', 'sync_app_url');

select vault.create_secret('replace-with-cron-secret', 'cron_secret');

-- Verify scheduled job (optional)
-- select jobid, jobname, schedule, command from cron.job where jobname = 'sync-wc-results';
