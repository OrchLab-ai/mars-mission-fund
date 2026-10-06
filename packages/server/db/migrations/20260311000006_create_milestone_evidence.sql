-- migrate:up
CREATE TABLE milestone_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES campaign_milestones(id),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  submitted_by UUID NOT NULL REFERENCES accounts(id),
  evidence_type TEXT NOT NULL,
  evidence_url TEXT NOT NULL,
  description TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_milestone_evidence_milestone_id ON milestone_evidence (milestone_id);

-- migrate:down
DROP TABLE IF EXISTS milestone_evidence;
