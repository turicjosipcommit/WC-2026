-- Reschedule results sync from every 5 minutes to every minute.

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
  '* * * * *',
  $$select public.invoke_sync_results_cron();$$
);
