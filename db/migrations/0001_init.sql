-- Drefit: initial Postgres schema (replaces the 14 Appwrite collections).
--
-- Conventions
--   * id is TEXT so Appwrite document ids ($id) import unchanged and every
--     reference (userId, postId, workoutId, referredBy, ...) keeps working.
--   * created_at / updated_at mirror Appwrite's $createdAt / $updatedAt. The
--     app-level createdAt attribute (posts, comments, messages, reminderLog,
--     referrals) maps onto created_at as well.
--   * Appwrite datetime attributes are timestamptz; JSON-encoded attributes
--     (exercisesJson, limitationsJson, planJson) stay TEXT, exactly as the
--     app reads and writes them.
--   * Idempotent and non-destructive: only CREATE ... IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS users (
  id                               TEXT PRIMARY KEY,
  created_at                       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                       TIMESTAMPTZ NOT NULL DEFAULT now(),
  name                             TEXT NOT NULL DEFAULT '',
  email                            TEXT NOT NULL,
  password                         TEXT NOT NULL,           -- bcrypt hash (carried over from Appwrite)
  role                             TEXT,
  subscription_status              TEXT,
  subscription_id                  TEXT,
  subscription_current_period_end  TIMESTAMPTZ,
  trial_ends_at                    TIMESTAMPTZ,
  fitness_goal                     TEXT,
  fitness_level                    TEXT,
  dietary_preference               TEXT,
  schedule                         TEXT,
  password_reset_token_hash        TEXT,
  password_reset_expires           TIMESTAMPTZ,
  notifications_enabled            BOOLEAN DEFAULT true,
  phone                            TEXT,
  whatsapp_opt_in                  BOOLEAN DEFAULT false,
  reminder_hour                    INTEGER CHECK (reminder_hour BETWEEN 0 AND 23),
  referral_code                    TEXT,
  referred_by                      TEXT,
  days_per_week                    INTEGER CHECK (days_per_week BETWEEN 1 AND 7),
  equipment                        TEXT,
  limitations_json                 TEXT,
  limitations_note                 TEXT
);
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_unique ON users (referral_code);
CREATE INDEX IF NOT EXISTS users_referred_by_idx ON users (referred_by);
CREATE INDEX IF NOT EXISTS users_whatsapp_opt_in_idx ON users (whatsapp_opt_in);
CREATE INDEX IF NOT EXISTS users_subscription_status_idx ON users (subscription_status);
CREATE INDEX IF NOT EXISTS users_reset_token_idx ON users (password_reset_token_hash);

CREATE TABLE IF NOT EXISTS progress_logs (
  id          TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id     TEXT NOT NULL,
  weight      DOUBLE PRECISION NOT NULL,
  logged_at   TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS progress_logs_user_logged_idx ON progress_logs (user_id, logged_at DESC);

CREATE TABLE IF NOT EXISTS progress_photos (
  id            TEXT PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id       TEXT NOT NULL,
  file_id       TEXT NOT NULL,          -- stable photo id used in /api/progress/photos/[fileId]
  taken_at      TIMESTAMPTZ NOT NULL,
  blob_pathname TEXT,                   -- Vercel Blob pathname (private store); NULL until re-uploaded
  content_type  TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS progress_photos_file_id_unique ON progress_photos (file_id);
CREATE INDEX IF NOT EXISTS progress_photos_user_taken_idx ON progress_photos (user_id, taken_at DESC);

CREATE TABLE IF NOT EXISTS workouts (
  id              TEXT PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  name            TEXT NOT NULL,
  muscle_group    TEXT NOT NULL,
  duration        INTEGER NOT NULL,
  difficulty      TEXT NOT NULL,
  calories        INTEGER NOT NULL,
  goal            TEXT NOT NULL,
  exercises_json  TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS workouts_goal_idx ON workouts (goal);

CREATE TABLE IF NOT EXISTS workout_completions (
  id            TEXT PRIMARY KEY,         -- client-supplied clientId when offline-queued (idempotent)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id       TEXT NOT NULL,
  workout_id    TEXT NOT NULL,
  completed_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS workout_completions_user_workout_idx ON workout_completions (user_id, workout_id);
CREATE INDEX IF NOT EXISTS workout_completions_user_completed_idx ON workout_completions (user_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS diet_plans (
  id                  TEXT PRIMARY KEY,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  dietary_preference  TEXT NOT NULL,
  day                 TEXT NOT NULL,
  breakfast           TEXT NOT NULL,
  lunch               TEXT NOT NULL,
  dinner              TEXT NOT NULL,
  snack               TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS diet_plans_pref_idx ON diet_plans (dietary_preference);

CREATE TABLE IF NOT EXISTS community_posts (
  id          TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id     TEXT NOT NULL,
  user_name   TEXT NOT NULL,
  content     TEXT NOT NULL,
  liked_by    TEXT[] NOT NULL DEFAULT '{}'   -- user ids
);
CREATE INDEX IF NOT EXISTS community_posts_created_idx ON community_posts (created_at DESC);

CREATE TABLE IF NOT EXISTS community_comments (
  id          TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  post_id     TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  user_name   TEXT NOT NULL,
  content     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS community_comments_post_idx ON community_comments (post_id, created_at);

CREATE TABLE IF NOT EXISTS coaching_messages (
  id            TEXT PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id       TEXT NOT NULL,           -- the member whose thread this is
  sender_id     TEXT NOT NULL,
  sender_name   TEXT NOT NULL,
  is_from_admin BOOLEAN NOT NULL DEFAULT false,
  content       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS coaching_messages_user_idx ON coaching_messages (user_id, created_at);
CREATE INDEX IF NOT EXISTS coaching_messages_created_idx ON coaching_messages (created_at DESC);

CREATE TABLE IF NOT EXISTS login_attempts (
  id            TEXT PRIMARY KEY,        -- sha256(scope:key), no raw email/IP stored
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  scope         TEXT NOT NULL,
  failures      INTEGER NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL,
  locked_until  TIMESTAMPTZ
);

-- One row per Paystack reference that granted access: a payment is applied once.
CREATE TABLE IF NOT EXISTS payment_events (
  id            TEXT PRIMARY KEY,        -- derived from the reference
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reference     TEXT NOT NULL,
  user_id       TEXT NOT NULL,
  amount        INTEGER NOT NULL,
  currency      TEXT NOT NULL,
  source        TEXT NOT NULL,
  processed_at  TIMESTAMPTZ NOT NULL,
  period_end    TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS payment_events_reference_unique ON payment_events (reference);
CREATE INDEX IF NOT EXISTS payment_events_user_idx ON payment_events (user_id);

-- One row per (user, reminder type, Lagos day): the WhatsApp dedupe record.
CREATE TABLE IF NOT EXISTS reminder_log (
  id          TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id     TEXT NOT NULL,
  type        TEXT NOT NULL,
  day         TEXT NOT NULL,             -- YYYY-MM-DD (Africa/Lagos)
  status      TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS reminder_log_user_type_day_unique ON reminder_log (user_id, type, day);

-- One row per referred user: a referral is rewarded at most once.
CREATE TABLE IF NOT EXISTS referrals (
  id                 TEXT PRIMARY KEY,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  referrer_id        TEXT NOT NULL,
  referred_id        TEXT NOT NULL,
  status             TEXT NOT NULL,
  reason             TEXT,
  reference          TEXT,
  reward_days        INTEGER,
  referrer_rewarded  BOOLEAN DEFAULT false,
  referred_rewarded  BOOLEAN DEFAULT false
);
CREATE UNIQUE INDEX IF NOT EXISTS referrals_referred_unique ON referrals (referred_id);
CREATE INDEX IF NOT EXISTS referrals_referrer_status_idx ON referrals (referrer_id, status);

-- One row per user (id = user id) holding the generated first-week plan.
CREATE TABLE IF NOT EXISTS first_week_plans (
  id             TEXT PRIMARY KEY,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id        TEXT NOT NULL,
  plan_json      TEXT NOT NULL,
  rules_version  INTEGER,
  generated_at   TIMESTAMPTZ NOT NULL
);
