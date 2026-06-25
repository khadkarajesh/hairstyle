-- Credits table — replaces subscriptions for session gating.
-- One row per user. sessions_remaining is decremented on each paid session creation.
-- Free tier (first session) does not require a credits row.
-- Managed by admins via service role after WhatsApp payment confirmation.

CREATE TABLE IF NOT EXISTS credits (
  user_id            uuid        REFERENCES auth.users NOT NULL UNIQUE,
  sessions_remaining int         NOT NULL DEFAULT 0,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

-- Users can read their own credit balance (to show remaining sessions in UI)
CREATE POLICY "users_read_own_credits" ON credits
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can write (bypasses RLS — no explicit policy needed)

-- To manually add credits after WhatsApp payment, run in Supabase SQL editor:
--
-- Starter Pack (NPR 199 · 1 session):
-- INSERT INTO credits (user_id, sessions_remaining)
-- VALUES ('<user-uuid>', 1)
-- ON CONFLICT (user_id) DO UPDATE
--   SET sessions_remaining = credits.sessions_remaining + 1, updated_at = now();
--
-- Value Pack (NPR 499 · 3 sessions):
-- INSERT INTO credits (user_id, sessions_remaining)
-- VALUES ('<user-uuid>', 3)
-- ON CONFLICT (user_id) DO UPDATE
--   SET sessions_remaining = credits.sessions_remaining + 3, updated_at = now();
--
-- Pro Pack (NPR 749 · 5 sessions):
-- INSERT INTO credits (user_id, sessions_remaining)
-- VALUES ('<user-uuid>', 5)
-- ON CONFLICT (user_id) DO UPDATE
--   SET sessions_remaining = credits.sessions_remaining + 5, updated_at = now();
