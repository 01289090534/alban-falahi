-- Reduce idle shop-push Edge Function calls.
-- Keep the existing 30-second schedule and the repeat_pending behavior.
-- Skip the HTTP call unless at least one recent pending order has a branch.
-- Backup of the previous live cron command:
-- docs/ops/backups/shop-push-cron-before-optimization-2026-10-28.txt

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobid = 1
      AND active = true
      AND schedule = '30 seconds'
  ) THEN
    PERFORM cron.alter_job(
      job_id := 1,
      command := $cron$
        SELECT CASE
          WHEN EXISTS (
            SELECT 1
            FROM public.orders
            WHERE status = 'pending'
              AND branch_id IS NOT NULL
              AND created_at >= now() - interval '24 hours'
          )
          THEN net.http_post(
            url := 'https://qxwvuxkbcghbkztjrzon.supabase.co/functions/v1/shop-push',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || (
                SELECT decrypted_secret
                FROM vault.decrypted_secrets
                WHERE name = 'shop_push_cron_secret'
              )
            ),
            body := '{"action":"repeat_pending"}'::jsonb,
            timeout_milliseconds := 10000
          )
        END AS request_id;
      $cron$
    );
  ELSE
    RAISE EXCEPTION 'Expected active shop-push cron jobid 1 on a 30-second schedule; refusing to change an unexpected job.';
  END IF;
END
$migration$;
