-- migrate:up
CREATE TABLE audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   TEXT NOT NULL,
  campaign_id  UUID REFERENCES campaigns(id),
  milestone_id UUID REFERENCES campaign_milestones(id),
  actor_id     TEXT NOT NULL,
  payload      JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- migrate:down
DROP TABLE IF EXISTS audit_log;
