-- migrate:up
CREATE TABLE campaign_audit_events (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id    uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  event_type     text NOT NULL,
  actor_id       uuid REFERENCES accounts(id),
  previous_state text,
  new_state      text NOT NULL,
  metadata       jsonb NOT NULL DEFAULT '{}',
  occurred_at    timestamptz NOT NULL DEFAULT now()
);

-- migrate:down
DROP TABLE campaign_audit_events;
