-- migrate:up
-- Seeded Submitted campaign for reviewer flow E2E testing
INSERT INTO campaigns (
  id, slug, title, summary, description, alignment_statement,
  category, tags, status, hero_image_url,
  min_funding_target_usd, max_funding_cap_usd, current_amount_usd,
  contributor_count, deadline, launched_at, creator_id
) VALUES
  (
    '00000000-0011-0000-0000-000000000011',
    'mars-soil-analyser',
    'Mars Soil Analyser',
    'A portable mass spectrometer for rapid in-situ analysis of Martian regolith composition.',
    '<p>Understanding Martian soil chemistry is critical for ISRU planning and crew safety. This portable mass spectrometer delivers field-ready mineral and organic compound analysis in under 60 seconds per sample.</p>',
    'Rapid soil analysis enables informed ISRU site selection and identifies perchlorate contamination hazards before crew arrival.',
    'In-Situ Resource Utilisation',
    ARRAY['isru', 'soil', 'spectrometer', 'science'],
    'Submitted',
    'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200',
    50000000, 150000000, 0,
    0, '2027-06-30 23:59:59+00', NULL,
    '22222222-2222-2222-2222-222222222222'
  )
ON CONFLICT DO NOTHING;

-- Seeded Rejected campaign for creator resubmit E2E testing
INSERT INTO campaigns (
  id, slug, title, summary, description, alignment_statement,
  category, tags, status, hero_image_url,
  min_funding_target_usd, max_funding_cap_usd, current_amount_usd,
  contributor_count, deadline, launched_at, creator_id, reviewer_id
) VALUES
  (
    '00000000-0012-0000-0000-000000000012',
    'mars-dust-collector',
    'Mars Dust Collector',
    'An electrostatic dust collection system to mitigate dust accumulation on solar panels and optics.',
    '<p>Martian dust storms can reduce solar panel output by 90%. This electrostatic collector uses low-power electric fields to sweep dust off surfaces autonomously, maintaining peak energy generation throughout storm seasons.</p>',
    'Preserving solar panel efficiency during dust events is essential for uninterrupted power to life support and ISRU systems.',
    'Power & Energy',
    ARRAY['dust', 'solar', 'electrostatic', 'power'],
    'Rejected',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200',
    30000000, 80000000, 0,
    0, '2027-06-30 23:59:59+00', NULL,
    '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-444444444444'
  )
ON CONFLICT DO NOTHING;

-- migrate:down
DELETE FROM notifications WHERE campaign_id IN (
  '00000000-0011-0000-0000-000000000011',
  '00000000-0012-0000-0000-000000000012'
);
DELETE FROM campaigns WHERE id IN (
  '00000000-0011-0000-0000-000000000011',
  '00000000-0012-0000-0000-000000000012'
);
