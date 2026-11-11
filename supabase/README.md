# Supabase setup

1. Open the Supabase Dashboard for the project, then go to **SQL Editor**.
2. Click **New query**, paste the whole contents of `supabase/migrations/0001_init.sql`, and press **Run**.
3. The migration is idempotent, so running it again is safe.

It creates the `albums`, `images` and `messages` tables, the `album_category` enum, row level security
(public can read published albums and their images only; `messages` is private), and the public
`gallery` storage bucket.

Check the result with `node --env-file=.env.local scripts/check-db.mjs`.
