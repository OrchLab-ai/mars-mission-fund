# Learnings

Tips and gotchas discovered by previous agents. Read this before starting work.

## Tooling & Config

### Prettier and markdownlint MD049 conflict

- Prettier normalises Markdown emphasis to `_text_` (underscores), but markdownlint MD049 (configured to "asterisk") requires `*text*`.
- Running `prettier --write .` on `.md` files after fixing MD049 violations will silently revert them.
- Resolution: `**/*.md` is in `.prettierignore` so Prettier never touches Markdown files. Markdownlint is the single source of truth for `.md` style.

### Vitest v4 requires `defineConfig` from `vitest/config`

- Using `/// <reference types="vitest" />` alone with `defineConfig` from `vite` causes TS2769 in `vite.config.ts` ("test does not exist in type 'UserConfigExport'").
- Resolution: Import `defineConfig` from `vitest/config` instead of `vite`. This pulls in Vitest's module augmentation that adds `test` to Vite's `UserConfig` interface.

### @testing-library/jest-dom v6 with Vitest requires `/vitest` import

- Importing `@testing-library/jest-dom` in a Vitest setup file causes `ReferenceError: expect is not defined` because the default entry tries to extend Jest's global `expect`.
- Resolution: Use `import '@testing-library/jest-dom/vitest'` instead, which uses Vitest's `expect` API. This entry point is available in v6+.

### Root vitest exclude must cover `packages/**`

- The root `vite.config.ts` `test.exclude` must include `packages/**` to prevent the frontend test runner from finding workspace package tests (e.g. `packages/server/src/__tests__/proposals.test.ts`).

## Server Patterns

### Express factory app pattern

- The app is built as a factory function `createApp(pool: Pool): Express` that accepts the database pool via dependency injection. This pattern is required so tests can pass a mock pool without side effects from real DB connections or port binding.

### NodeNext requires `.js` extensions on TypeScript imports

- The server `tsconfig.json` uses `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`. This requires **`.js` file extensions on all TypeScript import paths**, even though the actual source files are `.ts` (e.g. `import { createApp } from '../app.js'`). Omitting the extension causes a runtime `ERR_MODULE_NOT_FOUND`.

### Mocking pg QueryResult in Vitest

- Casting `{ rows: [], rowCount: 0 }` as `QueryResult` causes TS2352. Resolution: remove the cast — `mockResolvedValueOnce` accepts `unknown`, so no cast is needed.

### Server vitest config overrides root

- Running `vitest run` from `packages/server/` picks up the root `vite.config.ts` which sets `environment: 'jsdom'`. Resolution: `packages/server/vitest.config.ts` sets `environment: 'node'` to override.

## Client-Server Integration Patterns

### Port mismatch between Vite proxy and server

- Vite's `server.proxy` target port must exactly match the `PORT` value in `packages/server/.env`. These can drift silently, causing all API calls to fail.
- Always verify both values are identical. A `.env.example` with the canonical port keeps developers and CI in sync.

### camelCase transformation for API responses

- DB columns use `snake_case` (e.g. `min_funding_target_usd`). All API JSON responses must use `camelCase`. The server aliases column names directly in SQL `SELECT` clauses (e.g. `min_funding_target_usd AS "minFundingTargetUsd"`).
- Shared Zod schemas in `@mmf/shared` must use camelCase field names to match the API responses.

### Nested entity queries for proposal detail

- The proposal detail endpoint (`GET /api/proposals/:slug`) fetches milestones, stretch goals, team members, and updates via separate SQL queries, then assembles them in application code.
- This avoids complex multi-table JOINs and keeps each query simple and independently testable.

### Mock data removal enables reliable error-state testing

- The client API layer previously caught all fetch errors and returned inline mock data. This masked real server errors and made E2E tests unable to verify error states.
- Resolution: re-throw errors instead. The UI renders loading/error states using React state.

## Token & Design System Patterns

### Split-property token naming convention

- Each type-scale entry in the brand spec expands into five CSS variables: `--type-*-size`, `--type-*-weight`, `--type-*-leading`, `--type-*-spacing`, and `--type-*-family`. Components apply each property individually — there is no shorthand.
- The `-family` tokens map each scale entry to the relevant `--font-*` identity token (e.g. `--type-hero-family: var(--font-display)`).

### Responsive hero type scaling is a named exception, not a violation

- The `--type-hero-size` token is fixed at 96px in the type scale, but the hero H1 uses a responsive ladder: 32px (mobile) → 48px (sm, 640px+) → 72px (lg, 1024px+) → 96px (xl, 1280px+).
- This is documented in brand.md §2.8 as "Named Exception — Hero H1 Responsive Sizing". It is the only approved responsive override of a fixed type-scale token and is implemented via media query overrides, not new scale entries.

## Monorepo Structure

### @mmf/shared package

- `packages/shared/src/index.ts` exports the shared Proposal types. Uses `"exports": { ".": "./src/index.ts" }` so bundler-mode TypeScript resolves types directly from source without a compile step.
- Re-exporting types from `packages/client/src/api/proposals.ts` preserves backward compatibility for components importing from that module.

## Auth Patterns

### Stateless JWT auth middleware

- Express middleware attaches `req.user` (decoded JWT payload) so downstream route handlers can access the current user.
- Auth secrets go in the `JWT_SECRET` env var; the token is sent as an `Authorization: Bearer` header.

### Demo user selector on login page

- The login page offers pre-populated options (email + known password) for each demo role so workshop participants can switch users without typing credentials.
- This is a workshop-only UI pattern; it must not appear in production builds.

### JWT stored in localStorage (demo deviation)

- Production auth should use HttpOnly cookies to prevent XSS token theft.
- The demo intentionally uses localStorage for transparency and ease of inspection during the workshop.
- This deviation is annotated with a "demo stub" comment in the AuthProvider.

### bcrypt hashes in seed migrations

- Demo accounts use known passwords (e.g. `password123`) stored as bcrypt hashes in seed SQL.
- These are workshop-only; never use known seed passwords in a production system.

## Proposal Lifecycle Patterns

### Three active audit write paths (demo artifact)

- The Proposal Lifecycle milestone produced three separate audit tables through parallel PR development: `proposal_audit_events` (written by `createAuditEvent` in `queries.ts`), `audit_events` (written by `writeAuditEvent` in `audit.ts`), and `audit_log` (written by `insertAuditLog` in `queries.ts`).
- A fourth table `proposal_audit_log` exists from the earliest migration but is no longer written to.
- This three-table divergence is intentional for the demo scope and is documented in ADR-0002. New code should use `writeAuditEvent` (→ `audit_events`) for consistency.

### `writeAuditEvent` is best-effort (errors swallowed)

- `writeAuditEvent` is `async` and should be `await`ed so the DB write completes before the response is sent.
- Errors inside the helper are caught and logged to stderr but not re-thrown, so an audit failure never fails the HTTP response. This makes audit writes non-fatal to the request lifecycle.

### `requireRole` accepts a single Role or an array

- `requireRole('Reviewer')` and `requireRole(['Reviewer', 'Admin'])` both work — the middleware normalises the argument to an array internally.
- Use the array form when a route should be accessible by more than one role.

### Migration version collision from parallel branches

- dbmate migrations use a timestamp-based prefix (e.g. `20260311000003`). When two branches create migrations with the same prefix number, they collide on merge.
- Resolution: renumber the PR branch migrations to the next available sequence before merging (e.g. bump `000003` → `000009`). This has happened multiple times during the Proposal Lifecycle milestone.

## Issue #115: dbmate `--no-dump-schema` is a global flag, not a subcommand flag

- `--no-dump-schema` must come BEFORE the subcommand: `dbmate --no-dump-schema ... down`, not `dbmate ... down --no-dump-schema`.
- Placing it after `down` causes exit code 2 ("flag provided but not defined"), which makes the teardown loop fail immediately on every invocation.
- Also: `dbmate down` exits with code 2 (not 0) when there are no migrations to roll back ("Error: can't rollback: no migrations have been applied"). Use `|| true` in the loop and rely on checking for "Rolled back:" in output to detect completion.

## Issue #111: Playwright browser binary missing in workspace environment

- If `npm run test:e2e` fails with "Executable doesn't exist" after a Playwright version bump, run `npx playwright install chromium` to download the new browser binaries.
- The `ci-check.sh` script does not include E2E tests — only `./scripts/e2e-check.sh` or `./scripts/e2e-check-docker.sh` run E2E tests with the full stack.
- E2E tests require a running PostgreSQL + backend + frontend stack; Docker is the simplest way to achieve this (use `./scripts/e2e-check-docker.sh`).
