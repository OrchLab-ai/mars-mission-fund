-- migrate:up
UPDATE campaigns
SET created_by = '22222222-2222-2222-2222-222222222222';

-- migrate:down
UPDATE campaigns
SET created_by = NULL;
