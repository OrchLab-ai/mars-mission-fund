# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mars Mission Fund (MMF) — a crowdfunding platform. npm workspaces monorepo with three packages:

- `packages/client/` — React 19 + Vite 6 + Tailwind CSS 4 frontend
- `packages/server/` — Express 5 + PostgreSQL 16 backend
- `packages/shared/` — Shared TypeScript types and Zod schemas

## Workflow Preferences

- **Minimize manual approval interruptions.** Many Bash commands match an auto-approved pattern in `.claude/settings.json`. However auto approval breaks when:
  - Chaining commands with `&&` (the combined string won't match individual patterns)
  - Using `cat <<'EOF'` or heredocs (triggers quoted-newline detection)
  - Embedding newlines followed by `#`-prefixed lines in arguments (hides args from permission checks)
  - Any command structure that obscures what's actually being run
  Use separate Bash tool calls for each command instead.

## Where You Are Running

In the workshop you run inside `claude-container`, and the app is **already running**:
the frontend on port 5173, the API on port 3001, PostgreSQL at the `db` host
(`DATABASE_URL` is set). Do not start a second copy of either server, and do not
use Docker — there is no Docker inside the container.

```bash
start-app.sh --restart          # Restart both dev servers (also reinstalls deps if the lockfile changed)
tail -n 50 /workspace/logs/server.log   # API log; vite.log alongside it
dbmate -d packages/server/db/migrations up   # Apply new migrations to the running database
```

Save Playwright MCP screenshots to `/screenshots` — that folder is shared with the host.

## Common Commands

### Development (outside the workshop container)

```bash
./scripts/run-local.sh          # Start full local env (Docker Postgres + migrations + both dev servers)
npm run dev                     # Frontend dev server only (port 5173)
npm run dev:server              # Backend dev server only (port 3001)
```

### CI Checks (run before pushing)

```bash
./scripts/ci-check.sh           # Mirrors CI pipeline locally — run this before committing
./scripts/run-e2e.sh            # Playwright E2E against its own throwaway database (works in the container)
./scripts/e2e-check-docker.sh   # Full CI checks + E2E tests, entirely in Docker (host only)
```

Individual checks from that script:

```bash
npm run build -w @mmf/shared && npx tsc -b --noEmit && npx tsc --noEmit -p packages/server/tsconfig.json  # Type-check
npm run lint                    # ESLint
npm run format:check            # Prettier check
npm run lint:md                 # Markdown lint
npm run build                   # Build all workspaces
npm run test:coverage           # Unit tests with coverage
```

### Testing

```bash
npm run test                              # All unit tests
npm run test:coverage                     # With coverage (80% threshold enforced)
npx vitest run packages/client/src/components/Button.test.tsx  # Single test file
npx vitest run --reporter=verbose -w packages/client            # All client tests verbose
npm run test:e2e                          # Playwright E2E (auto-starts frontend; backend must be running)
./scripts/run-e2e.sh                      # Full E2E flow on an isolated database: migrates, starts backend, runs Playwright, drops it
```

- Client tests: Vitest + Testing Library + jsdom (`packages/client/src/**/*.test.tsx`)
- Server tests: Vitest + SuperTest (`packages/server/src/__tests__/**/*.test.ts`)
- E2E tests: Playwright, Chromium only (`e2e/*.spec.ts`)

### Database

In the workshop container the database is already up and migrated; apply new migrations with
`dbmate -d packages/server/db/migrations up`. Outside it, `./scripts/run-local.sh` starts
PostgreSQL from `docker-compose.dev.yml` and migrates it.

Migrations: `packages/server/db/migrations/` (managed by dbmate)
Schema: `packages/server/db/schema.sql`

## Architecture

- **Simple layered server**: Express routes call SQL query functions directly (no CQRS, event store or ports/adapters — the specs describe those as the production design, not what is built)
- **Audit trail**: plain `INSERT`s into audit tables from route handlers
- **JWT authentication** with bcrypt password hashing; role-based access (Backer, Creator, Admin)
- Frontend proxies `/v1` requests to backend (Vite proxy config)
- API routes: `/v1/auth/*`, `/v1/users/*`, `/v1/campaigns/*`

### Path Aliases

Client uses `@/*` → `src/*` (configured in tsconfig + vite)

## Specifications

All implementation must align with the layered spec system in `specs/`. Read `specs/README.md` first — it defines the hierarchy (L1 strategic → L2 standards → L3 technical → L4 domain workflows) and the agent protocol for reading/applying specs.

## Code Style

- Prettier: single quotes, no semicolons, 2-space indent, 100 char width, trailing commas in ES5
- ESLint 9 flat config with React + React Hooks rules
- TypeScript strict mode in all packages
- Pre-push hook runs `./scripts/ci-check.sh` automatically

## Git Conventions

- Never commit directly to `main` (pre-push hook enforces this)
- Git hooks installed via `npm prepare`

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | (required) |
| `JWT_SECRET` | JWT signing key | (required) |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
