-- migrate:up
-- NOTE: Multi-role support and account state machine (Pending Verification →
-- Active → Deactivated → Deleted) are out of scope for this demo stub.
-- role column holds the primary role value only.
CREATE TABLE accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  display_name   TEXT,
  bio            TEXT,
  role           TEXT NOT NULL DEFAULT 'Backer',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- migrate:down
DROP TABLE accounts;
