-- migrate:up
CREATE TABLE proposal_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES accounts(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_updates_proposal_id_created_at
  ON proposal_updates (proposal_id, created_at DESC);

-- migrate:down
DROP TABLE IF EXISTS proposal_updates;
