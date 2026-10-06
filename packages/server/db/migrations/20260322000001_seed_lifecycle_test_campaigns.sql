-- migrate:up
-- Seed five campaigns for campaign-lifecycle E2E tests
-- creator@example.com UUID: 22222222-2222-2222-2222-222222222222

INSERT INTO campaigns (
  id, slug, title, summary, description, alignment_statement,
  category, tags, status, hero_image_url,
  min_funding_target_usd, max_funding_cap_usd, current_amount_usd,
  contributor_count, deadline, launched_at, creator_id, submitted_at
) VALUES
  (
    '00000000-0014-0000-0000-000000000014',
    'mars-lifecycle-submitted',
    'Mars Lifecycle Submitted',
    'A test campaign in Submitted status for lifecycle E2E testing.',
    '<p>This campaign tests the approval flow for the campaign lifecycle E2E suite.</p>',
    'Supports testing the reviewer approval workflow end-to-end.',
    'Life Support & Crew Health',
    ARRAY['e2e', 'lifecycle', 'submitted'],
    'Submitted',
    'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200',
    10000000, 50000000, 0,
    0, '2027-12-31 23:59:59+00', NULL,
    '22222222-2222-2222-2222-222222222222',
    NOW()
  ),
  (
    '00000000-0015-0000-0000-000000000015',
    'mars-lifecycle-approved',
    'Mars Lifecycle Approved',
    'A test campaign in Approved status for lifecycle E2E testing.',
    '<p>This campaign tests the creator launch flow for the campaign lifecycle E2E suite.</p>',
    'Supports testing the creator launch workflow end-to-end.',
    'Power & Energy',
    ARRAY['e2e', 'lifecycle', 'approved'],
    'Approved',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200',
    10000000, 50000000, 0,
    0, '2027-12-31 23:59:59+00', NULL,
    '22222222-2222-2222-2222-222222222222',
    NOW()
  ),
  (
    '00000000-0016-0000-0000-000000000016',
    'mars-lifecycle-reject-test',
    'Mars Lifecycle Reject Test',
    'A test campaign in Submitted status for rejection E2E testing.',
    '<p>This campaign tests the reviewer rejection flow for the campaign lifecycle E2E suite.</p>',
    'Supports testing the reviewer rejection workflow end-to-end.',
    'In-Situ Resource Utilisation',
    ARRAY['e2e', 'lifecycle', 'reject'],
    'Submitted',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200',
    10000000, 50000000, 0,
    0, '2027-12-31 23:59:59+00', NULL,
    '22222222-2222-2222-2222-222222222222',
    NOW()
  ),
  (
    '00000000-0017-0000-0000-000000000017',
    'mars-lifecycle-settlement',
    'Mars Lifecycle Settlement',
    'A test campaign in Settlement status for milestone evidence E2E testing.',
    '<p>This campaign tests the milestone evidence and admin verification flow for the campaign lifecycle E2E suite.</p>',
    'Supports testing the milestone verification workflow end-to-end.',
    'Power & Energy',
    ARRAY['e2e', 'lifecycle', 'settlement'],
    'Settlement',
    'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200',
    10000000, 50000000, 10000000,
    5, '2027-06-30 23:59:59+00', '2026-01-01 00:00:00+00',
    '22222222-2222-2222-2222-222222222222',
    NOW()
  ),
  (
    '00000000-0018-0000-0000-000000000018',
    'mars-lifecycle-cancel',
    'Mars Lifecycle Cancel',
    'A test campaign in Live status for cancellation E2E testing.',
    '<p>This campaign tests the cancellation request flow for the campaign lifecycle E2E suite.</p>',
    'Supports testing the cancellation workflow end-to-end.',
    'In-Situ Resource Utilisation',
    ARRAY['e2e', 'lifecycle', 'cancel'],
    'Live',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200',
    10000000, 50000000, 5000000,
    3, '2027-12-31 23:59:59+00', '2026-02-01 00:00:00+00',
    '22222222-2222-2222-2222-222222222222',
    NOW()
  )
ON CONFLICT DO NOTHING;

-- Milestones for each campaign (one per campaign, minimum required by UI)
INSERT INTO campaign_milestones (
  id, campaign_id, title, description, target_date, funding_pct,
  verification_criteria, status, sort_order
) VALUES
  (
    '00000000-0014-0001-0000-000000000001',
    '00000000-0014-0000-0000-000000000014',
    'Phase 1: Design',
    'Complete the initial design phase.',
    '2027-03-31',
    50,
    'Design documents reviewed and approved.',
    'Pending',
    0
  ),
  (
    '00000000-0015-0001-0000-000000000001',
    '00000000-0015-0000-0000-000000000015',
    'Phase 1: Prototype',
    'Build the initial prototype.',
    '2027-03-31',
    50,
    'Working prototype demonstrated.',
    'Pending',
    0
  ),
  (
    '00000000-0016-0001-0000-000000000001',
    '00000000-0016-0000-0000-000000000016',
    'Phase 1: Research',
    'Complete background research.',
    '2027-03-31',
    50,
    'Research report delivered.',
    'Pending',
    0
  ),
  -- Settlement campaign: Pending milestone
  (
    '00000000-0017-0001-0000-000000000001',
    '00000000-0017-0000-0000-000000000017',
    'Phase 1: Hardware Delivery',
    'Deliver the first hardware batch.',
    '2026-06-30',
    50,
    'Hardware units shipped and received.',
    'Pending',
    0
  ),
  -- Settlement campaign: Submitted milestone (evidence already provided)
  (
    '00000000-0017-0002-0000-000000000002',
    '00000000-0017-0000-0000-000000000017',
    'Phase 2: Integration Testing',
    'Complete integration testing of all subsystems.',
    '2026-09-30',
    50,
    'All integration tests pass with documented results.',
    'Submitted',
    1
  ),
  (
    '00000000-0018-0001-0000-000000000001',
    '00000000-0018-0000-0000-000000000018',
    'Phase 1: Deployment',
    'Deploy initial system.',
    '2027-06-30',
    100,
    'System operational.',
    'Pending',
    0
  )
ON CONFLICT DO NOTHING;

-- Set evidence_description on the Submitted milestone for settlement campaign
UPDATE campaign_milestones
SET
  evidence_description = 'All integration tests have been completed successfully. Test reports attached.',
  evidence_submitted_at = NOW()
WHERE id = '00000000-0017-0002-0000-000000000002';

-- Team members for each campaign (one per campaign, minimum required by UI)
INSERT INTO campaign_team_members (
  id, campaign_id, name, role, bio, sort_order
) VALUES
  (
    '00000000-0014-0001-0001-000000000001',
    '00000000-0014-0000-0000-000000000014',
    'Alex Chen',
    'Project Lead',
    'Experienced aerospace engineer with 10 years in Mars mission planning.',
    0
  ),
  (
    '00000000-0015-0001-0001-000000000001',
    '00000000-0015-0000-0000-000000000015',
    'Maria Santos',
    'Chief Engineer',
    'Power systems specialist with expertise in renewable energy for space applications.',
    0
  ),
  (
    '00000000-0016-0001-0001-000000000001',
    '00000000-0016-0000-0000-000000000016',
    'James Park',
    'Research Director',
    'PhD in planetary science with focus on Mars regolith composition.',
    0
  ),
  (
    '00000000-0017-0001-0001-000000000001',
    '00000000-0017-0000-0000-000000000017',
    'Sarah Kim',
    'Operations Lead',
    'Expert in ISRU operations and hardware deployment.',
    0
  ),
  (
    '00000000-0018-0001-0001-000000000001',
    '00000000-0018-0000-0000-000000000018',
    'David Lee',
    'Mission Specialist',
    'Specialises in resource extraction and in-situ utilisation techniques.',
    0
  )
ON CONFLICT DO NOTHING;

-- Notification for creator@example.com: campaign approved for campaign 0014 (test 7)
INSERT INTO notifications (
  id, user_id, type, title, message, campaign_id, read
) VALUES
  (
    '00000000-0014-0099-0000-000000000099',
    '22222222-2222-2222-2222-222222222222',
    'campaign.approved',
    'Campaign Approved',
    'Your campaign "Mars Lifecycle Submitted" has been approved.',
    '00000000-0014-0000-0000-000000000014',
    false
  )
ON CONFLICT DO NOTHING;

-- migrate:down
DELETE FROM notifications WHERE id = '00000000-0014-0099-0000-000000000099';
DELETE FROM campaign_team_members WHERE campaign_id IN (
  '00000000-0014-0000-0000-000000000014',
  '00000000-0015-0000-0000-000000000015',
  '00000000-0016-0000-0000-000000000016',
  '00000000-0017-0000-0000-000000000017',
  '00000000-0018-0000-0000-000000000018'
);
DELETE FROM audit_log WHERE campaign_id IN (
  '00000000-0014-0000-0000-000000000014',
  '00000000-0015-0000-0000-000000000015',
  '00000000-0016-0000-0000-000000000016',
  '00000000-0017-0000-0000-000000000017',
  '00000000-0018-0000-0000-000000000018'
);
DELETE FROM milestone_evidence WHERE campaign_id IN (
  '00000000-0014-0000-0000-000000000014',
  '00000000-0015-0000-0000-000000000015',
  '00000000-0016-0000-0000-000000000016',
  '00000000-0017-0000-0000-000000000017',
  '00000000-0018-0000-0000-000000000018'
);
DELETE FROM campaign_milestones WHERE campaign_id IN (
  '00000000-0014-0000-0000-000000000014',
  '00000000-0015-0000-0000-000000000015',
  '00000000-0016-0000-0000-000000000016',
  '00000000-0017-0000-0000-000000000017',
  '00000000-0018-0000-0000-000000000018'
);
DELETE FROM notifications WHERE campaign_id IN (
  '00000000-0014-0000-0000-000000000014',
  '00000000-0015-0000-0000-000000000015',
  '00000000-0016-0000-0000-000000000016',
  '00000000-0017-0000-0000-000000000017',
  '00000000-0018-0000-0000-000000000018'
);
DELETE FROM campaigns WHERE id IN (
  '00000000-0014-0000-0000-000000000014',
  '00000000-0015-0000-0000-000000000015',
  '00000000-0016-0000-0000-000000000016',
  '00000000-0017-0000-0000-000000000017',
  '00000000-0018-0000-0000-000000000018'
);
