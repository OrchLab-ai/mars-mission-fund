-- migrate:up
CREATE TABLE campaign_team_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL,
  bio          TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

-- migrate:down
DROP TABLE campaign_team_members;
