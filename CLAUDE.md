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

## Common Commands

### Development

```bash
./scripts/run-local.sh          # Start full local env (Docker Postgres + migrations + both dev servers)
./scripts/run-docker.sh         # Same as above but entirely in Docker (only requires Docker)
npm run dev                     # Frontend dev server only (port 5173)
npm run dev:server              # Backend dev server only (port 3001)
```

### CI Checks (run before pushing)

```bash
./scripts/ci-check.sh           # Mirrors CI pipeline locally — run this before pushing
./scripts/e2e-check-docker.sh   # Full CI checks + E2E tests, entirely in Docker (only requires Docker)
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
./scripts/e2e-check.sh                    # Full E2E flow: starts DB, backend, runs Playwright, tears down
```

- Client tests: Vitest + Testing Library + jsdom (`packages/client/src/**/*.test.tsx`)
- Server tests: Vitest + SuperTest (`packages/server/src/__tests__/**/*.test.ts`)
- E2E tests: Playwright, Chromium only (`e2e/*.spec.ts`)

### Database

```bash
docker compose -f docker-compose.dev.yml up -d   # Start local PostgreSQL
export DATABASE_URL="postgresql://mmf:mmf@localhost:5432/mmf?sslmode=disable"
docker run --rm --network host -e DATABASE_URL="${DATABASE_URL}" -v "$(pwd)/packages/server/db:/db" ghcr.io/amacneil/dbmate up  # Run migrations
```

Migrations: `packages/server/db/migrations/` (managed by dbmate)
Schema: `packages/server/db/schema.sql`

## Architecture

- **Hexagonal architecture** (Ports & Adapters) on the backend with repository pattern
- **CQRS / Event Sourcing** for proposal management and audit trails
- **JWT authentication** with bcrypt password hashing; role-based access (Backer, Creator, Admin)
- Frontend proxies `/v1` requests to backend (Vite proxy config)
- API routes: `/v1/auth/*`, `/v1/users/*`, `/v1/proposals/*`

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
