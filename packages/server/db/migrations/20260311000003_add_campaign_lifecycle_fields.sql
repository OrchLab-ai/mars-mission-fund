-- migrate:up
ALTER TABLE campaigns
  ADD COLUMN created_by UUID REFERENCES accounts(id),
  ADD COLUMN reviewer_id UUID REFERENCES accounts(id),
  ADD COLUMN rejection_rationale TEXT,
  ADD COLUMN approval_notes TEXT,
  ADD COLUMN submitted_at TIMESTAMPTZ;

-- migrate:down
ALTER TABLE campaigns
  DROP COLUMN submitted_at,
  DROP COLUMN approval_notes,
  DROP COLUMN rejection_rationale,
  DROP COLUMN reviewer_id,
  DROP COLUMN created_by;
