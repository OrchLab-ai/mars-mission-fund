-- migrate:up
-- Demo user credentials (for local development only — never use in production):
--   backer@example.com    / backer-demo-pass
--   creator@example.com   / creator-demo-pass
--   admin@example.com     / admin-demo-pass

-- DEMO STUB: Passwords below are bcrypt hashes of known, hardcoded demo values.
-- Production (L3-002) requires breach-list checking and policy enforcement at registration;
-- no user passwords should ever be pre-seeded with publicly known values.
INSERT INTO accounts (id, email, password_hash, display_name, bio, role) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'backer@example.com',
    '$2b$10$dNVIbi5kFcjf.Bjw/ug8MObzcJfrW.kjIuUbT0k.fl2ePUTYW8W8y',
    'Demo Backer',
    'A demo backer account for local development.',
    'Backer'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'creator@example.com',
    '$2b$10$EUy6.OAig2.tCj89ud9Y2.TDkfUu7vmfYW6WwOHMFBvaTie7jSYlK',
    'Demo Creator',
    'A demo creator account for local development.',
    'Creator'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'admin@example.com',
    '$2b$10$XpjM.fTwTJeYOrRHqSLYKu1fljq32mn6RTpDzRpqY0w44fP0ZhKzu',
    'Demo Administrator',
    'A demo administrator account for local development.',
    'Administrator'
  );

-- migrate:down
DELETE FROM accounts WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);
