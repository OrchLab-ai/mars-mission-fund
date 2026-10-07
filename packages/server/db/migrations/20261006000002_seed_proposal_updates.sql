-- migrate:up
INSERT INTO proposal_updates (id, proposal_id, author_id, title, body, created_at)
VALUES
  (
    '00000000-0003-0000-0000-000000000001',
    '00000000-0001-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'Prototype build is underway',
    'The first prototype is on the bench and the crew is testing the core loop.' || E'\n' || 'Next up: a second round of testing with early backers.',
    '2026-09-20 10:00:00+00'
  ),
  (
    '00000000-0003-0000-0000-000000000002',
    '00000000-0001-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'Halfway to the first milestone',
    'Materials have arrived and assembly is on schedule. We will share photos once the first batch is done.',
    '2026-10-01 14:30:00+00'
  );

-- migrate:down
DELETE FROM proposal_updates
WHERE id IN (
  '00000000-0003-0000-0000-000000000001',
  '00000000-0003-0000-0000-000000000002'
);
