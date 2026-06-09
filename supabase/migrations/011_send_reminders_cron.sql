-- Scheduled prediction reminders via pg_cron + pg_net.
-- Reuses vault secrets sync_app_url and cron_secret from 009_sync_results_cron.sql.

create or replace function public.invoke_send_reminders_cron()
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
    raise notice 'send-prediction-reminders skipped: configure vault secrets sync_app_url and cron_secret';
    return;
  end if;

  perform net.http_post(
    url := rtrim(app_url, '/') || '/api/internal/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', cron_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;

revoke all on function public.invoke_send_reminders_cron() from public;
grant execute on function public.invoke_send_reminders_cron() to postgres;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'send-prediction-reminders'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end;
$$;

select cron.schedule(
  'send-prediction-reminders',
  '*/5 * * * *',
  $$select public.invoke_send_reminders_cron();$$
);
