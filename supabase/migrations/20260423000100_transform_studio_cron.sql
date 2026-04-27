-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Transform Studio — pg_cron Watchdog
--
-- PREREQUISITES (run in Supabase dashboard → Database → Extensions first):
--   1. Enable extension: pg_cron
--   2. Enable extension: pg_net
--
-- ALSO REQUIRED (set in Supabase dashboard → Database → Configuration):
--   app.supabase_url  = 'https://[your-project].supabase.co'
--   app.service_role_key = '[your-service-role-key]'
--
-- Run this file from supabase/migrations/ after confirming both extensions
-- are active. It will create a cron job that retries any transform job stuck
-- in 'processing' status for more than 5 minutes.
-- ─────────────────────────────────────────────────────────────────────────────

-- Schedule the watchdog: runs every minute
SELECT cron.schedule(
  'transform-retry-stuck-jobs',
  '* * * * *',
  $$
  SELECT net.http_post(
    url    := current_setting('app.supabase_url') || '/functions/v1/transform-process-zone',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body   := jsonb_build_object(
      'jobId',   id,
      'zone',    current_step,
      'isRetry', true
    )
  )
  FROM public.transform_jobs
  WHERE status = 'processing'
    AND updated_at < now() - interval '5 minutes';
  $$
);
