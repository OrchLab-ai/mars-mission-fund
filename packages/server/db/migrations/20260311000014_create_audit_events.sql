-- migrate:up
CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT NOW(),
  level text NOT NULL DEFAULT 'AUDIT',
  correlation_id text,
  service text,
  message text,
  event_type text,
  actor_id uuid,
  actor_type text,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  outcome text,
  previous_state jsonb,
  new_state jsonb,
  rationale text
);

-- migrate:down
DROP TABLE audit_events;
