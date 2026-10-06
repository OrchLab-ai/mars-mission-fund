-- migrate:up
CREATE TABLE campaign_milestones (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id           UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  description           TEXT NOT NULL,
  target_date           DATE NOT NULL,
  funding_pct           INTEGER NOT NULL,
  verification_criteria TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'Pending',
  sort_order            INTEGER NOT NULL DEFAULT 0
);

-- migrate:down
DROP TABLE campaign_milestones;
