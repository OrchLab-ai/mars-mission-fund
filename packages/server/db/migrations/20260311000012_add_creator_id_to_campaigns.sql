-- migrate:up
-- creator_id already added by 20260311000009; just seed data
UPDATE campaigns
SET creator_id = '22222222-2222-2222-2222-222222222222'
WHERE status IN ('Approved', 'Live', 'Funded')
  AND creator_id IS NULL;

-- migrate:down
-- no-op (creator_id owned by 20260311000009)
