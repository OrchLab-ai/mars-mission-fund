-- migrate:up

-- Tables
ALTER TABLE campaigns RENAME TO proposals;
ALTER TABLE campaign_team_members RENAME TO proposal_team_members;
ALTER TABLE campaign_milestones RENAME TO proposal_milestones;
ALTER TABLE campaign_stretch_goals RENAME TO proposal_stretch_goals;
ALTER TABLE campaign_updates RENAME TO proposal_updates;
ALTER TABLE campaign_audit_log RENAME TO proposal_audit_log;
ALTER TABLE campaign_audit_events RENAME TO proposal_audit_events;

-- Columns
ALTER TABLE proposal_team_members RENAME COLUMN campaign_id TO proposal_id;
ALTER TABLE proposal_milestones RENAME COLUMN campaign_id TO proposal_id;
ALTER TABLE proposal_stretch_goals RENAME COLUMN campaign_id TO proposal_id;
ALTER TABLE proposal_updates RENAME COLUMN campaign_id TO proposal_id;
ALTER TABLE proposal_audit_log RENAME COLUMN campaign_id TO proposal_id;
ALTER TABLE proposal_audit_events RENAME COLUMN campaign_id TO proposal_id;
ALTER TABLE milestone_evidence RENAME COLUMN campaign_id TO proposal_id;
ALTER TABLE notifications RENAME COLUMN campaign_id TO proposal_id;
ALTER TABLE audit_log RENAME COLUMN campaign_id TO proposal_id;

-- Primary key / unique constraints
ALTER TABLE proposals RENAME CONSTRAINT campaigns_pkey TO proposals_pkey;
ALTER TABLE proposals RENAME CONSTRAINT campaigns_slug_key TO proposals_slug_key;
ALTER TABLE proposal_team_members RENAME CONSTRAINT campaign_team_members_pkey TO proposal_team_members_pkey;
ALTER TABLE proposal_milestones RENAME CONSTRAINT campaign_milestones_pkey TO proposal_milestones_pkey;
ALTER TABLE proposal_stretch_goals RENAME CONSTRAINT campaign_stretch_goals_pkey TO proposal_stretch_goals_pkey;
ALTER TABLE proposal_updates RENAME CONSTRAINT campaign_updates_pkey TO proposal_updates_pkey;
ALTER TABLE proposal_audit_log RENAME CONSTRAINT campaign_audit_log_pkey TO proposal_audit_log_pkey;
ALTER TABLE proposal_audit_events RENAME CONSTRAINT campaign_audit_events_pkey TO proposal_audit_events_pkey;

-- Foreign key constraints
ALTER TABLE proposals RENAME CONSTRAINT campaigns_created_by_fkey TO proposals_created_by_fkey;
ALTER TABLE proposals RENAME CONSTRAINT campaigns_creator_id_fkey TO proposals_creator_id_fkey;
ALTER TABLE proposals RENAME CONSTRAINT campaigns_reviewer_id_fkey TO proposals_reviewer_id_fkey;
ALTER TABLE proposal_team_members RENAME CONSTRAINT campaign_team_members_campaign_id_fkey TO proposal_team_members_proposal_id_fkey;
ALTER TABLE proposal_milestones RENAME CONSTRAINT campaign_milestones_campaign_id_fkey TO proposal_milestones_proposal_id_fkey;
ALTER TABLE proposal_stretch_goals RENAME CONSTRAINT campaign_stretch_goals_campaign_id_fkey TO proposal_stretch_goals_proposal_id_fkey;
ALTER TABLE proposal_updates RENAME CONSTRAINT campaign_updates_campaign_id_fkey TO proposal_updates_proposal_id_fkey;
ALTER TABLE proposal_audit_log RENAME CONSTRAINT campaign_audit_log_actor_id_fkey TO proposal_audit_log_actor_id_fkey;
ALTER TABLE proposal_audit_log RENAME CONSTRAINT campaign_audit_log_campaign_id_fkey TO proposal_audit_log_proposal_id_fkey;
ALTER TABLE proposal_audit_events RENAME CONSTRAINT campaign_audit_events_actor_id_fkey TO proposal_audit_events_actor_id_fkey;
ALTER TABLE proposal_audit_events RENAME CONSTRAINT campaign_audit_events_campaign_id_fkey TO proposal_audit_events_proposal_id_fkey;
ALTER TABLE milestone_evidence RENAME CONSTRAINT milestone_evidence_campaign_id_fkey TO milestone_evidence_proposal_id_fkey;
ALTER TABLE notifications RENAME CONSTRAINT notifications_campaign_id_fkey TO notifications_proposal_id_fkey;
ALTER TABLE audit_log RENAME CONSTRAINT audit_log_campaign_id_fkey TO audit_log_proposal_id_fkey;

-- Indexes
ALTER INDEX idx_campaign_audit_log_campaign_id RENAME TO idx_proposal_audit_log_proposal_id;

-- Seed data: fix user-facing copy that referred to the "campaign" entity by name.
-- (Generic English usage, e.g. a wind-tunnel *test campaign*, is left as-is.)
UPDATE proposals SET description = replace(description, 'this campaign funds', 'this proposal funds')
WHERE id IN (
  '00000000-0002-0000-0000-000000000002',
  '00000000-0007-0000-0000-000000000007'
);
UPDATE proposals SET description = replace(description, 'This campaign funds', 'This proposal funds')
WHERE id = '00000000-0010-0000-0000-000000000010';

UPDATE proposals SET
  summary = replace(summary, 'A test campaign', 'A test proposal'),
  description = replace(
    replace(description, 'This campaign tests', 'This proposal tests'),
    'campaign lifecycle E2E suite', 'proposal lifecycle E2E suite'
  )
WHERE id IN (
  '00000000-0014-0000-0000-000000000014',
  '00000000-0015-0000-0000-000000000015',
  '00000000-0016-0000-0000-000000000016',
  '00000000-0017-0000-0000-000000000017',
  '00000000-0018-0000-0000-000000000018'
);

UPDATE notifications SET
  type = 'proposal.approved',
  title = 'Proposal Approved',
  message = 'Your proposal "Mars Lifecycle Submitted" has been approved.'
WHERE id = '00000000-0014-0099-0000-000000000099';

-- migrate:down

UPDATE notifications SET
  type = 'campaign.approved',
  title = 'Campaign Approved',
  message = 'Your campaign "Mars Lifecycle Submitted" has been approved.'
WHERE id = '00000000-0014-0099-0000-000000000099';

UPDATE proposals SET
  summary = replace(summary, 'A test proposal', 'A test campaign'),
  description = replace(
    replace(description, 'This proposal tests', 'This campaign tests'),
    'proposal lifecycle E2E suite', 'campaign lifecycle E2E suite'
  )
WHERE id IN (
  '00000000-0014-0000-0000-000000000014',
  '00000000-0015-0000-0000-000000000015',
  '00000000-0016-0000-0000-000000000016',
  '00000000-0017-0000-0000-000000000017',
  '00000000-0018-0000-0000-000000000018'
);

UPDATE proposals SET description = replace(description, 'This proposal funds', 'This campaign funds')
WHERE id = '00000000-0010-0000-0000-000000000010';
UPDATE proposals SET description = replace(description, 'this proposal funds', 'this campaign funds')
WHERE id IN (
  '00000000-0002-0000-0000-000000000002',
  '00000000-0007-0000-0000-000000000007'
);

ALTER INDEX idx_proposal_audit_log_proposal_id RENAME TO idx_campaign_audit_log_campaign_id;

ALTER TABLE audit_log RENAME CONSTRAINT audit_log_proposal_id_fkey TO audit_log_campaign_id_fkey;
ALTER TABLE notifications RENAME CONSTRAINT notifications_proposal_id_fkey TO notifications_campaign_id_fkey;
ALTER TABLE milestone_evidence RENAME CONSTRAINT milestone_evidence_proposal_id_fkey TO milestone_evidence_campaign_id_fkey;
ALTER TABLE proposal_audit_events RENAME CONSTRAINT proposal_audit_events_proposal_id_fkey TO campaign_audit_events_campaign_id_fkey;
ALTER TABLE proposal_audit_events RENAME CONSTRAINT proposal_audit_events_actor_id_fkey TO campaign_audit_events_actor_id_fkey;
ALTER TABLE proposal_audit_log RENAME CONSTRAINT proposal_audit_log_proposal_id_fkey TO campaign_audit_log_campaign_id_fkey;
ALTER TABLE proposal_audit_log RENAME CONSTRAINT proposal_audit_log_actor_id_fkey TO campaign_audit_log_actor_id_fkey;
ALTER TABLE proposal_updates RENAME CONSTRAINT proposal_updates_proposal_id_fkey TO campaign_updates_campaign_id_fkey;
ALTER TABLE proposal_stretch_goals RENAME CONSTRAINT proposal_stretch_goals_proposal_id_fkey TO campaign_stretch_goals_campaign_id_fkey;
ALTER TABLE proposal_milestones RENAME CONSTRAINT proposal_milestones_proposal_id_fkey TO campaign_milestones_campaign_id_fkey;
ALTER TABLE proposal_team_members RENAME CONSTRAINT proposal_team_members_proposal_id_fkey TO campaign_team_members_campaign_id_fkey;
ALTER TABLE proposals RENAME CONSTRAINT proposals_reviewer_id_fkey TO campaigns_reviewer_id_fkey;
ALTER TABLE proposals RENAME CONSTRAINT proposals_creator_id_fkey TO campaigns_creator_id_fkey;
ALTER TABLE proposals RENAME CONSTRAINT proposals_created_by_fkey TO campaigns_created_by_fkey;

ALTER TABLE proposal_audit_events RENAME CONSTRAINT proposal_audit_events_pkey TO campaign_audit_events_pkey;
ALTER TABLE proposal_audit_log RENAME CONSTRAINT proposal_audit_log_pkey TO campaign_audit_log_pkey;
ALTER TABLE proposal_updates RENAME CONSTRAINT proposal_updates_pkey TO campaign_updates_pkey;
ALTER TABLE proposal_stretch_goals RENAME CONSTRAINT proposal_stretch_goals_pkey TO campaign_stretch_goals_pkey;
ALTER TABLE proposal_milestones RENAME CONSTRAINT proposal_milestones_pkey TO campaign_milestones_pkey;
ALTER TABLE proposal_team_members RENAME CONSTRAINT proposal_team_members_pkey TO campaign_team_members_pkey;
ALTER TABLE proposals RENAME CONSTRAINT proposals_slug_key TO campaigns_slug_key;
ALTER TABLE proposals RENAME CONSTRAINT proposals_pkey TO campaigns_pkey;

ALTER TABLE audit_log RENAME COLUMN proposal_id TO campaign_id;
ALTER TABLE notifications RENAME COLUMN proposal_id TO campaign_id;
ALTER TABLE milestone_evidence RENAME COLUMN proposal_id TO campaign_id;
ALTER TABLE proposal_audit_events RENAME COLUMN proposal_id TO campaign_id;
ALTER TABLE proposal_audit_log RENAME COLUMN proposal_id TO campaign_id;
ALTER TABLE proposal_updates RENAME COLUMN proposal_id TO campaign_id;
ALTER TABLE proposal_stretch_goals RENAME COLUMN proposal_id TO campaign_id;
ALTER TABLE proposal_milestones RENAME COLUMN proposal_id TO campaign_id;
ALTER TABLE proposal_team_members RENAME COLUMN proposal_id TO campaign_id;

ALTER TABLE proposal_audit_events RENAME TO campaign_audit_events;
ALTER TABLE proposal_audit_log RENAME TO campaign_audit_log;
ALTER TABLE proposal_updates RENAME TO campaign_updates;
ALTER TABLE proposal_stretch_goals RENAME TO campaign_stretch_goals;
ALTER TABLE proposal_milestones RENAME TO campaign_milestones;
ALTER TABLE proposal_team_members RENAME TO campaign_team_members;
ALTER TABLE proposals RENAME TO campaigns;
