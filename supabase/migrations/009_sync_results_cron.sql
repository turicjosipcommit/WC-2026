-- Scheduled results sync via pg_cron + pg_net.
-- Configure vault secrets once per Supabase project (Dashboard → SQL):
--
--   select vault.create_secret('https://your-app.example.com', 'sync_app_url');
--   select vault.create_secret('your-cron-secret', 'cron_secret');
--
-- sync_app_url: deployed Next.js app (no trailing slash)
-- cron_secret: must match CRON_SECRET on the app

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function public.invoke_sync_results_cron()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  app_url text;
  cron_secret text;
begin
  select decrypted_secret
  into app_url
  from vault.decrypted_secrets
  where name = 'sync_app_url'
  limit 1;

  select decrypted_secret
  into cron_secret
  from vault.decrypted_secrets
  where name = 'cron_secret'
  limit 1;

  if app_url is null or cron_secret is null then
    raise notice 'sync-wc-results skipped: configure vault secrets sync_app_url and cron_secret';
    return;
  end if;

  perform net.http_post(
    url := rtrim(app_url, '/') || '/api/internal/sync-results',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', cron_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;

revoke all on function public.invoke_sync_results_cron() from public;
grant execute on function public.invoke_sync_results_cron() to postgres;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'sync-wc-results'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end;
$$;

select cron.schedule(
  'sync-wc-results',
  '*/5 * * * *',
  $$select public.invoke_sync_results_cron();$$
);
