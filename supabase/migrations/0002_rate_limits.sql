-- Phase 4: DB-backed rate limiting (serverless-safe). Safe to re-run.
-- Used by the admin login (bucket 'login') and, in Phase 5, the contact form.
-- Keys are SHA-256(IP + AUTH_SECRET); raw IPs are never stored.

create table if not exists rate_limits (
  id bigserial primary key,
  bucket text not null,
  key text not null,
  created_at timestamptz default now()
);

create index if not exists rate_limits_lookup_idx
  on rate_limits (bucket, key, created_at);

-- RLS on with NO policies: only the server's secret key can read/write.
alter table rate_limits enable row level security;

-- Cleanup: the app prunes rows older than 24h occasionally. To also do it on a
-- schedule (Database > Extensions > enable pg_cron), run once:
--   select cron.schedule('rate_limits_cleanup', '17 3 * * *',
--     $$delete from rate_limits where created_at < now() - interval '1 day'$$);
