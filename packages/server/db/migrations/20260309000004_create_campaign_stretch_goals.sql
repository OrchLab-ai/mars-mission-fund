-- migrate:up
CREATE TABLE campaign_stretch_goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  target_usd   BIGINT NOT NULL,
  description  TEXT NOT NULL,
  deliverables TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

-- migrate:down
DROP TABLE campaign_stretch_goals;
