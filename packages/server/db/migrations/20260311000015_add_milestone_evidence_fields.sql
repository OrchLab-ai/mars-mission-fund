-- migrate:up
ALTER TABLE campaign_milestones
  ADD COLUMN evidence_description TEXT,
  ADD COLUMN evidence_url         TEXT,
  ADD COLUMN evidence_submitted_at TIMESTAMPTZ,
  ADD COLUMN feedback             TEXT;

-- migrate:down
ALTER TABLE campaign_milestones
  DROP COLUMN IF EXISTS evidence_description,
  DROP COLUMN IF EXISTS evidence_url,
  DROP COLUMN IF EXISTS evidence_submitted_at,
  DROP COLUMN IF EXISTS feedback;
