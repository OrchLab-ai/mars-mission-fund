-- migrate:up
CREATE TABLE campaigns (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                    TEXT UNIQUE NOT NULL,
  title                   TEXT NOT NULL,
  summary                 TEXT NOT NULL,
  description             TEXT NOT NULL,
  alignment_statement     TEXT NOT NULL,
  category                TEXT NOT NULL,
  tags                    TEXT[] NOT NULL DEFAULT '{}',
  status                  TEXT NOT NULL,
  hero_image_url          TEXT,
  min_funding_target_usd  BIGINT NOT NULL,
  max_funding_cap_usd     BIGINT NOT NULL,
  current_amount_usd      BIGINT NOT NULL DEFAULT 0,
  contributor_count       INTEGER NOT NULL DEFAULT 0,
  deadline                TIMESTAMPTZ,
  launched_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- migrate:down
DROP TABLE campaigns;
