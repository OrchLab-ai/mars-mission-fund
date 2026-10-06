-- migrate:up
ALTER TABLE campaigns ADD COLUMN cancellation_requested_at timestamptz;

-- migrate:down
ALTER TABLE campaigns DROP COLUMN cancellation_requested_at;
