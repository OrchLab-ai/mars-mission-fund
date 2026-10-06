-- migrate:up
CREATE TABLE campaign_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  previous_state TEXT,
  new_state TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES accounts(id),
  rationale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_audit_log_campaign_id ON campaign_audit_log (campaign_id);

-- migrate:down
DROP TABLE IF EXISTS campaign_audit_log;
