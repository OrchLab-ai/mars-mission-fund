# ADR-0004: SQLite as the Development Database

> **Status**: Accepted
> **Date**: 2026-09-12
> **Deciders**: Engineering team

## Context

Mars Mission Fund is the application used by the OrchLab workshop, where attendees clone the repository and start working inside the first twenty minutes of the day.
The database was PostgreSQL 16, supplied by a container in `docker-compose.dev.yml` and by a service container in CI.

That arrangement costs more than it returns in this setting:

- Local development needs Docker running before a single line of code executes, and the `postgres:16-alpine` pull is the one download nobody has cached.
- A workshop attendee whose Docker Desktop is in Windows-container mode cannot run a Linux image at all, so the database was an outright blocker rather than a slow start.
- CI runs a `postgres:16-alpine` service purely so that integration tests have somewhere to connect.

The application does not use PostgreSQL as a differentiator.
There is no stored procedure, no extension, no replication concern, and the full-text search that `specs/tech/tech-stack.md` describes was never implemented — campaign search is a `LIKE` over two columns.

Two questions arose:

1. Which SQLite driver: `better-sqlite3`, or the built-in `node:sqlite`?
1. How should the 58 existing `pg`-shaped call sites be migrated?

## Decision

### SQLite replaces PostgreSQL for development, test, and CI

The database is a single SQLite file. `docker-compose.dev.yml` no longer defines a database service, CI no longer starts one, and the application runs with `npm run dev` and `npm run dev:server` against a file on disk.

This is explicitly a **development and test** decision.
It does not describe a production deployment, and `specs/tech/tech-stack.md` continues to name AWS Aurora PostgreSQL as the production database.

### Driver: `better-sqlite3`

`better-sqlite3` is used rather than the built-in `node:sqlite`.

**Rationale**:

- CI pins Node `22.x`, where `node:sqlite` requires the `--experimental-sqlite` flag. Adopting it would mean raising the project's Node baseline, which is a larger change than this one and affects the container base image as well.
- `better-sqlite3` ships prebuilt binaries for Linux, macOS and Windows, so no compiler toolchain is required on a contributor's machine.
- It bundles a recent SQLite, so `RETURNING` (used in 13 places) and `ON CONFLICT` work without version caveats.
- Its synchronous API is an advantage behind the adapter described below: there is no connection pool to model, and each call wraps trivially in a resolved promise.

### The `pg` call sites are not rewritten

`packages/server/src/db/pool.ts` continues to export a `pool` object with an async `query(sql, params)` returning `{ rows, rowCount }`.
All 58 call sites keep their existing PostgreSQL-flavoured SQL and `$1`-style placeholders.
The adapter translates.

**Rationale**:

- The alternative is editing 58 call sites across the server package. Those files are the subject of the workshop's exercises, and `01-exercise-rename.md` describes the codebase as it currently reads; churning them makes the exercise instructions wrong.
- Keeping PostgreSQL-shaped SQL in the application means the production target stays the documented one. The dialect gap lives in one file that can be deleted if the database ever returns to PostgreSQL locally.
- The translations needed are few and enumerable, because the codebase uses raw `pg` with no ORM and barely touches PostgreSQL-specific syntax: `$n` placeholders, 13 `RETURNING`, 6 `NOW()`, one `ILIKE`, one `= ANY($n)`. There is no `unnest`, no `->>`, no `::` cast, and no `INTERVAL`.

### Type fidelity is the adapter's responsibility

`pg` hydrates values on the way out, and the application's types depend on it.
`CampaignRow` declares `deadline: Date | null`, `createdAt: Date` and `tags: string[]`.
SQLite returns TEXT and INTEGER only, so the adapter converts:

- Columns named `*_at`, plus `deadline`, are returned as `Date` objects.
- `tags` is stored as JSON text and parsed back to an array.

`BIGINT` needs no handling. `pg` returns 64-bit integers as strings to avoid precision loss, so the application already wraps every such read in `Number(...)` or `parseInt(...)`, and those continue to work when SQLite returns a number.

### Migrations stay with dbmate, rewritten for SQLite

dbmate supports SQLite, so the runner, `packages/server/db/migrations/`, and the `scripts/*.sh` wrappers are unchanged in shape.
The migration SQL is rewritten:

- `TIMESTAMPTZ` becomes `TEXT`, storing ISO-8601.
- `JSONB` becomes `TEXT`, read with SQLite's JSON1 functions.
- `TEXT[]` becomes `TEXT` holding JSON. There is exactly one such column, `campaigns.tags`.
- `UUID ... DEFAULT gen_random_uuid()` becomes `TEXT` with a SQLite-native UUIDv4 default expression.

`gen_random_uuid()` specifically **cannot** be handled by the adapter.
dbmate is a Go binary applying migrations through its own driver, so a function registered by the application is not available at migration time, and SQLite does not permit custom functions in a column `DEFAULT` regardless.

## Consequences

**Positive**:

- The application runs with no database container. On a machine with Node installed it runs with no Docker at all, which removes the Windows-container blocker entirely.
- CI drops its `postgres:16-alpine` service container and the three `DATABASE_URL` declarations that fed it.
- Tests get a fresh database per run at negligible cost, so test isolation improves.
- The `postgres:16-alpine` pull disappears from first-run setup.

**Negative**:

- Development no longer runs against the same engine as production. Behaviour that differs between SQLite and PostgreSQL — collation, stricter type affinity, concurrent-write behaviour — is no longer caught locally. Integration testing against PostgreSQL before a production deployment becomes a deliberate step rather than a side effect of local development.
- `01-exercise-rename.md` lists "FK constraints" among the things its rename touches. SQLite cannot drop or rename a constraint, so that part of the exercise weakens. Renaming a column still works.
- SQLite serialises writes. This is irrelevant at development and workshop scale, and would not be acceptable under production load.
- The adapter is a layer that did not exist before, and a translation bug in it looks like an application bug. It is deliberately small and directly tested for that reason.

**Neutral**:

- `specs/tech/tech-stack.md` and `specs/tech/data-management.md` are updated to describe the development database as SQLite while leaving the production target unchanged.
- `Dockerfile.e2e` installs dependencies with `npm ci --ignore-scripts`, which skips the prebuilt-binary download that `better-sqlite3` performs in a lifecycle script. That image gains an explicit rebuild step.

## Compliance

- Satisfies [Engineering Standard](../standards/engineering.md) Section 3.1: architectural decisions affecting the repository structure are recorded as ADRs.
- Satisfies [Engineering Standard](../standards/engineering.md) Section 2.5: vendor evaluation rationale is documented (`better-sqlite3` vs `node:sqlite`).
