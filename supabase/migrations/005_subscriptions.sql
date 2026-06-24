-- Subscriptions table — tracks paid plan status per user.
-- Managed by admins via service role (Supabase dashboard or future Khalti webhook).
-- Regular users can only SELECT their own row.

CREATE TABLE IF NOT EXISTS subscriptions (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        REFERENCES auth.users NOT NULL UNIQUE,
  plan               text        NOT NULL DEFAULT 'free',  -- 'free' | 'standard'
  sessions_per_month int         NOT NULL DEFAULT 1,       -- 1=free, 3=standard
  active_until       timestamptz,                          -- NULL = free, date = paid until
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription (to gate features client-side)
CREATE POLICY "users_read_own_subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can write (bypasses RLS entirely — no explicit policy needed)

-- To manually activate a user after WhatsApp payment, run in Supabase SQL editor:
-- INSERT INTO subscriptions (user_id, plan, sessions_per_month, active_until)
-- VALUES ('<user-uuid>', 'standard', 3, now() + interval '30 days')
-- ON CONFLICT (user_id) DO UPDATE
--   SET plan = 'standard', sessions_per_month = 3,
--       active_until = now() + interval '30 days', updated_at = now();
