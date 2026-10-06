-- migrate:up
ALTER TABLE campaigns
  ADD COLUMN creator_id uuid REFERENCES accounts(id),
  ADD COLUMN risk_disclosures text[] NOT NULL DEFAULT '{}';

-- migrate:down
ALTER TABLE campaigns
  DROP COLUMN risk_disclosures,
  DROP COLUMN creator_id;
