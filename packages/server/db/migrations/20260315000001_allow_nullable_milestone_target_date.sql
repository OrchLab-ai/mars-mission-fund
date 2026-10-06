-- migrate:up
ALTER TABLE campaign_milestones ALTER COLUMN target_date DROP NOT NULL;

-- migrate:down
UPDATE campaign_milestones SET target_date = CURRENT_DATE WHERE target_date IS NULL;
ALTER TABLE campaign_milestones ALTER COLUMN target_date SET NOT NULL;
