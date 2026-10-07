-- migrate:up
CREATE TABLE proposal_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES accounts(id),
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proposal_updates_title_length CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  CONSTRAINT proposal_updates_body_length CHECK (char_length(btrim(body)) BETWEEN 1 AND 5000)
);

CREATE INDEX idx_proposal_updates_proposal_id_created_at
  ON proposal_updates (proposal_id, created_at DESC, id DESC);

-- migrate:down
DROP TABLE proposal_updates;
