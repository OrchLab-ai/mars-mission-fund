-- migrate:up
-- Seeded Submitted campaign for reviewer detail page E2E testing (reviewer.spec.ts)
-- Separate from 00000000-0011-... which is used by review-pipeline.spec.ts
INSERT INTO campaigns (
  id, slug, title, summary, description, alignment_statement,
  category, tags, status, hero_image_url,
  min_funding_target_usd, max_funding_cap_usd, current_amount_usd,
  contributor_count, deadline, launched_at, creator_id
) VALUES
  (
    '00000000-0013-0000-0000-000000000013',
    'mars-atmospheric-sampler',
    'Mars Atmospheric Sampler',
    'A lightweight instrument to collect and analyse atmospheric samples on Mars.',
    '<p>Understanding Mars atmospheric composition is vital for life support planning. This compact sampler collects air samples and analyses them for nitrogen, CO2, and trace gases.</p>',
    'Atmospheric analysis informs life support gas recycling system design for long-duration surface missions.',
    'Life Support & Crew Health',
    ARRAY['atmosphere', 'life-support', 'science'],
    'Submitted',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200',
    40000000, 120000000, 0,
    0, '2027-12-31 23:59:59+00', NULL,
    '22222222-2222-2222-2222-222222222222'
  )
ON CONFLICT DO NOTHING;

-- migrate:down
DELETE FROM notifications WHERE campaign_id = '00000000-0013-0000-0000-000000000013';
DELETE FROM campaigns WHERE id = '00000000-0013-0000-0000-000000000013';
