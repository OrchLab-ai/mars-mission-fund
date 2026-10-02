-- migrate:up
ALTER TABLE campaigns RENAME TO proposals;
ALTER TABLE campaign_team_members RENAME TO proposal_team_members;
ALTER TABLE campaign_milestones RENAME TO proposal_milestones;
ALTER TABLE campaign_stretch_goals RENAME TO proposal_stretch_goals;
ALTER TABLE campaign_audit_log RENAME TO proposal_audit_log;
ALTER TABLE campaign_audit_events RENAME TO proposal_audit_events;

ALTER TABLE proposal_team_members RENAME COLUMN campaign_id TO proposal_id;
ALTER TABLE proposal_milestones RENAME COLUMN campaign_id TO proposal_id;
ALTER TABLE proposal_stretch_goals RENAME COLUMN campaign_id TO proposal_id;
ALTER TABLE proposal_audit_log RENAME COLUMN campaign_id TO proposal_id;
ALTER TABLE proposal_audit_events RENAME COLUMN campaign_id TO proposal_id;
ALTER TABLE audit_log RENAME COLUMN campaign_id TO proposal_id;
ALTER TABLE milestone_evidence RENAME COLUMN campaign_id TO proposal_id;
ALTER TABLE notifications RENAME COLUMN campaign_id TO proposal_id;

-- Constraint and index names
ALTER TABLE proposals RENAME CONSTRAINT campaigns_pkey TO proposals_pkey;
ALTER TABLE proposals RENAME CONSTRAINT campaigns_slug_key TO proposals_slug_key;
ALTER TABLE proposals RENAME CONSTRAINT campaigns_created_by_fkey TO proposals_created_by_fkey;
ALTER TABLE proposals RENAME CONSTRAINT campaigns_creator_id_fkey TO proposals_creator_id_fkey;
ALTER TABLE proposals RENAME CONSTRAINT campaigns_reviewer_id_fkey TO proposals_reviewer_id_fkey;
ALTER TABLE proposal_team_members RENAME CONSTRAINT campaign_team_members_pkey TO proposal_team_members_pkey;
ALTER TABLE proposal_team_members RENAME CONSTRAINT campaign_team_members_campaign_id_fkey TO proposal_team_members_proposal_id_fkey;
ALTER TABLE proposal_milestones RENAME CONSTRAINT campaign_milestones_pkey TO proposal_milestones_pkey;
ALTER TABLE proposal_milestones RENAME CONSTRAINT campaign_milestones_campaign_id_fkey TO proposal_milestones_proposal_id_fkey;
ALTER TABLE proposal_stretch_goals RENAME CONSTRAINT campaign_stretch_goals_pkey TO proposal_stretch_goals_pkey;
ALTER TABLE proposal_stretch_goals RENAME CONSTRAINT campaign_stretch_goals_campaign_id_fkey TO proposal_stretch_goals_proposal_id_fkey;
ALTER TABLE proposal_audit_log RENAME CONSTRAINT campaign_audit_log_pkey TO proposal_audit_log_pkey;
ALTER TABLE proposal_audit_log RENAME CONSTRAINT campaign_audit_log_actor_id_fkey TO proposal_audit_log_actor_id_fkey;
ALTER TABLE proposal_audit_log RENAME CONSTRAINT campaign_audit_log_campaign_id_fkey TO proposal_audit_log_proposal_id_fkey;
ALTER TABLE proposal_audit_events RENAME CONSTRAINT campaign_audit_events_pkey TO proposal_audit_events_pkey;
ALTER TABLE proposal_audit_events RENAME CONSTRAINT campaign_audit_events_actor_id_fkey TO proposal_audit_events_actor_id_fkey;
ALTER TABLE proposal_audit_events RENAME CONSTRAINT campaign_audit_events_campaign_id_fkey TO proposal_audit_events_proposal_id_fkey;
ALTER TABLE audit_log RENAME CONSTRAINT audit_log_campaign_id_fkey TO audit_log_proposal_id_fkey;
ALTER TABLE milestone_evidence RENAME CONSTRAINT milestone_evidence_campaign_id_fkey TO milestone_evidence_proposal_id_fkey;
ALTER TABLE notifications RENAME CONSTRAINT notifications_campaign_id_fkey TO notifications_proposal_id_fkey;
ALTER INDEX idx_campaign_audit_log_campaign_id RENAME TO idx_proposal_audit_log_proposal_id;

-- Stored string values that the application now writes with the new name
UPDATE proposal_audit_events SET event_type = replace(event_type, 'campaign', 'proposal') WHERE event_type LIKE '%campaign%';
UPDATE audit_log SET event_type = replace(event_type, 'campaign', 'proposal') WHERE event_type LIKE '%campaign%';
UPDATE audit_events SET action = replace(action, 'campaign', 'proposal') WHERE action LIKE '%campaign%';
UPDATE audit_events SET event_type = replace(event_type, 'campaign', 'proposal') WHERE event_type LIKE '%campaign%';
UPDATE audit_events SET resource_type = 'proposal' WHERE resource_type = 'campaign';
UPDATE notifications SET type = replace(type, 'campaign', 'proposal') WHERE type LIKE '%campaign%';

-- migrate:down
UPDATE notifications SET type = replace(type, 'proposal', 'campaign') WHERE type LIKE '%proposal%';
UPDATE audit_events SET resource_type = 'campaign' WHERE resource_type = 'proposal';
UPDATE audit_events SET event_type = replace(event_type, 'proposal', 'campaign') WHERE event_type LIKE '%proposal%';
UPDATE audit_events SET action = replace(action, 'proposal', 'campaign') WHERE action LIKE '%proposal%';
UPDATE audit_log SET event_type = replace(event_type, 'proposal', 'campaign') WHERE event_type LIKE '%proposal%';
UPDATE proposal_audit_events SET event_type = replace(event_type, 'proposal', 'campaign') WHERE event_type LIKE '%proposal%';

ALTER INDEX idx_proposal_audit_log_proposal_id RENAME TO idx_campaign_audit_log_campaign_id;
ALTER TABLE notifications RENAME CONSTRAINT notifications_proposal_id_fkey TO notifications_campaign_id_fkey;
ALTER TABLE milestone_evidence RENAME CONSTRAINT milestone_evidence_proposal_id_fkey TO milestone_evidence_campaign_id_fkey;
ALTER TABLE audit_log RENAME CONSTRAINT audit_log_proposal_id_fkey TO audit_log_campaign_id_fkey;
ALTER TABLE proposal_audit_events RENAME CONSTRAINT proposal_audit_events_proposal_id_fkey TO campaign_audit_events_campaign_id_fkey;
ALTER TABLE proposal_audit_events RENAME CONSTRAINT proposal_audit_events_actor_id_fkey TO campaign_audit_events_actor_id_fkey;
ALTER TABLE proposal_audit_events RENAME CONSTRAINT proposal_audit_events_pkey TO campaign_audit_events_pkey;
ALTER TABLE proposal_audit_log RENAME CONSTRAINT proposal_audit_log_proposal_id_fkey TO campaign_audit_log_campaign_id_fkey;
ALTER TABLE proposal_audit_log RENAME CONSTRAINT proposal_audit_log_actor_id_fkey TO campaign_audit_log_actor_id_fkey;
ALTER TABLE proposal_audit_log RENAME CONSTRAINT proposal_audit_log_pkey TO campaign_audit_log_pkey;
ALTER TABLE proposal_stretch_goals RENAME CONSTRAINT proposal_stretch_goals_proposal_id_fkey TO campaign_stretch_goals_campaign_id_fkey;
ALTER TABLE proposal_stretch_goals RENAME CONSTRAINT proposal_stretch_goals_pkey TO campaign_stretch_goals_pkey;
ALTER TABLE proposal_milestones RENAME CONSTRAINT proposal_milestones_proposal_id_fkey TO campaign_milestones_campaign_id_fkey;
ALTER TABLE proposal_milestones RENAME CONSTRAINT proposal_milestones_pkey TO campaign_milestones_pkey;
ALTER TABLE proposal_team_members RENAME CONSTRAINT proposal_team_members_proposal_id_fkey TO campaign_team_members_campaign_id_fkey;
ALTER TABLE proposal_team_members RENAME CONSTRAINT proposal_team_members_pkey TO campaign_team_members_pkey;
ALTER TABLE proposals RENAME CONSTRAINT proposals_reviewer_id_fkey TO campaigns_reviewer_id_fkey;
ALTER TABLE proposals RENAME CONSTRAINT proposals_creator_id_fkey TO campaigns_creator_id_fkey;
ALTER TABLE proposals RENAME CONSTRAINT proposals_created_by_fkey TO campaigns_created_by_fkey;
ALTER TABLE proposals RENAME CONSTRAINT proposals_slug_key TO campaigns_slug_key;
ALTER TABLE proposals RENAME CONSTRAINT proposals_pkey TO campaigns_pkey;

ALTER TABLE notifications RENAME COLUMN proposal_id TO campaign_id;
ALTER TABLE milestone_evidence RENAME COLUMN proposal_id TO campaign_id;
ALTER TABLE audit_log RENAME COLUMN proposal_id TO campaign_id;
ALTER TABLE proposal_audit_events RENAME COLUMN proposal_id TO campaign_id;
ALTER TABLE proposal_audit_log RENAME COLUMN proposal_id TO campaign_id;
ALTER TABLE proposal_stretch_goals RENAME COLUMN proposal_id TO campaign_id;
ALTER TABLE proposal_milestones RENAME COLUMN proposal_id TO campaign_id;
ALTER TABLE proposal_team_members RENAME COLUMN proposal_id TO campaign_id;

ALTER TABLE proposal_audit_events RENAME TO campaign_audit_events;
ALTER TABLE proposal_audit_log RENAME TO campaign_audit_log;
ALTER TABLE proposal_stretch_goals RENAME TO campaign_stretch_goals;
ALTER TABLE proposal_milestones RENAME TO campaign_milestones;
ALTER TABLE proposal_team_members RENAME TO campaign_team_members;
ALTER TABLE proposals RENAME TO campaigns;
