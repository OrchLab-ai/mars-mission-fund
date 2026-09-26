# Tech Stack

> **Spec ID:** L3-008
> **Version:** 0.5.0
> **Status:** Approved
> **Rate of change:** Slow (changes at major technology decisions)
> **Depends on:** L1-001, L2-002, L3-001
> **Depended on by:** All L3 and L4 specs (technology baseline)

---

## Purpose

> **Local demo scope**: The runtime, frontend (except PostHog), backend (except PostHog), validation, authentication, linting, data access, local development, and testing choices (except MSW) are **real** — they are installed and used in the local demo.
> PostHog, Stripe, Veriff, AWS SES, AWS S3, AWS Secrets Manager, Aurora, CloudWatch, ECS/ECR/CloudFront/EventBridge, Terraform, and the deployment pipeline are **production design only** — they are not installed or configured in the demo.
> Sections describing them are labelled below. The local demo uses Docker Compose for PostgreSQL and environment variables for secrets.

This document enumerates the technology choices for the Mars Mission Fund platform.
It serves as the single source of truth for languages, frameworks, libraries, infrastructure, and tooling.

---

## Runtime & Language

| Technology | Version       | Purpose                                 |
| ---------- | ------------- | --------------------------------------- |
| Node.js    | 22.x LTS      | Server and build runtime                |
| npm        | 10.x          | Package management                      |
| TypeScript | Latest stable | Primary language (frontend and backend) |

---

## Frontend

| Technology                   | Version       | Purpose                                                                                                                                                                                                                                                       |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React                        | 19.x          | Single-page application (SPA) framework                                                                                                                                                                                                                       |
| Vite                         | Latest stable | Build tool and dev server                                                                                                                                                                                                                                     |
| TanStack Query (React Query) | v5            | Server state management (data fetching, caching, mutations)                                                                                                                                                                                                   |
| React Router                 | v7            | Client-side routing                                                                                                                                                                                                                                           |
| Tailwind CSS                 | v4            | CSS reset and global normalisation layer; Tailwind v4 is used for CSS reset and normalisation only — component-level styling is mostly done via inline `React.CSSProperties` objects with `var()` references on Tier 2 semantic tokens; Tailwind utility classes are used sparingly (e.g. responsive grid layouts) |
| PostHog (posthog-js)         | Latest stable | Feature flags, product analytics, and web analytics (production design only — not installed in the demo)                                                                                                                                                     |

---

## Backend

| Technology             | Version       | Purpose                                               |
| ---------------------- | ------------- | ----------------------------------------------------- |
| Express                | 5.x           | HTTP server framework                                 |
| Pino                   | Latest stable | Structured JSON logging                               |
| pino-http              | Latest stable | HTTP request logging middleware                       |
| pino-pretty            | Latest stable | Human-readable log output (development only)          |
| PostHog (posthog-node) | Latest stable | Server-side feature flag evaluation and event capture (production design only — not installed in the demo) |

---

## Feature Flags & Product Operations

> **Local demo note**: Production design only — not present in the local demo.

| Technology   | Purpose                                                                           |
| ------------ | --------------------------------------------------------------------------------- |
| PostHog      | Unified platform for feature flags, product analytics, and web analytics          |
| posthog-js   | Client-side SDK — feature flags, analytics, and session replay                    |
| posthog-node | Server-side SDK — feature flag evaluation and event capture from backend services |

PostHog is the single platform for all feature flag management and product analytics.
Feature flags are runtime-configurable without deployment (see [Architecture](L3-001), Section 9).

---

## Developer Observability

| Technology     | Purpose                                               |
| -------------- | ----------------------------------------------------- |
| Pino           | Structured JSON application logging                   |
| AWS CloudWatch | Infrastructure metrics, log aggregation, and alerting |

Pino handles structured application logging (see Backend section).
CloudWatch provides infrastructure-level metrics, centralised log storage, and alerting.
Together they form the developer observability stack, complementing PostHog's product analytics.

> **Local demo note**: The demo uses Pino (via `pino-http` and a Pino logger in the audit helper) writing to stdout; CloudWatch is production design only.

---

## Validation

| Technology | Purpose                                                        |
| ---------- | -------------------------------------------------------------- |
| Zod        | Runtime schema validation; shared schemas live in `packages/shared` and are used by the server and client |

---

## Authentication

| Technology   | Purpose                                                      |
| ------------ | ------------------------------------------------------------ |
| jsonwebtoken | Stateless JWT generation and validation (demo auth stub)     |
| bcryptjs     | Password hashing for demo account credentials (seed SQL)     |

---

## Payments

> **Local demo note**: Production design only — no Stripe package is installed. Payment actions are console-logged stubs (see [ADR-0003](../adrs/0003-stubbed-integrations.md)).

| Technology        | Purpose                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| Stripe            | Payment gateway — tokenisation, authorisation, capture, refunds, payouts |
| @stripe/stripe-js | Client-side Stripe Elements integration                                  |
| stripe (Node SDK) | Server-side Stripe API interaction (behind adapter abstraction)          |

---

## Identity Verification (KYC)

| Technology | Purpose                                                                    |
| ---------- | -------------------------------------------------------------------------- |
| Veriff     | Third-party identity verification provider (production design only — the demo hard-codes KYC as verified) |

---

## Email

> **Local demo note**: Production design only — the demo sends no email; notifications are rows in the `notifications` table shown in the app.

| Technology | Purpose                                       |
| ---------- | --------------------------------------------- |
| AWS SES    | Transactional and notification email delivery |

---

## Search

Campaign discovery search is served by **PostgreSQL full-text search** over CQRS read models.
No external search provider is required.

> **Local demo note**: The demo has no full-text search or read models; campaign search is a case-insensitive `ILIKE` match on title and summary in `packages/server/src/campaigns/queries.ts`.

---

## API Documentation

| Technology         | Purpose                                      |
| ------------------ | -------------------------------------------- |
| OpenAPI 3.1        | API specification format                     |
| swagger-jsdoc      | Generate OpenAPI spec from JSDoc annotations |
| swagger-ui-express | Serve interactive API docs                   |

> **Local demo note**: `swagger-jsdoc` and `swagger-ui-express` are installed in `packages/server` but not wired up; the demo serves no API docs.

---

## Secrets Management

| Technology            | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| AWS Secrets Manager   | Secret storage, injection, and rotation (production design only) |
| Environment variables | Secret injection for local development               |

---

## Object Storage

> **Local demo note**: Production design only — not present in the local demo.

| Technology | Purpose                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| AWS S3     | Frontend static assets (CloudFront origin), audit cold storage, KYC document uploads, campaign media |

---

## Linting & Formatting

| Technology           | Purpose                       |
| -------------------- | ----------------------------- |
| ESLint (flat config) | TypeScript linting            |
| Prettier             | Code formatting               |
| markdownlint-cli2    | Markdown linting (per L3-007) |

---

## Database & Data Access

| Technology            | Purpose                                   |
| --------------------- | ----------------------------------------- |
| AWS Aurora PostgreSQL | Primary relational database (production); PostgreSQL 16 via Docker Compose in the demo |
| pg                    | Database driver (raw SQL queries, no ORM) |
| DBMate                | SQL schema migrations                     |

---

## Local Development

`docker-compose.dev.yml` provides the local development backing services.

### Docker Compose

- Runs `postgres:16-alpine` on port **5432** for local development.
- Only the database is managed by Docker Compose; the Express server is run separately (see below).

### Database Migrations (DBMate)

- DBMate applies migrations from `packages/server/db/migrations/`.
- Invoke via a local DBMate install or:

  ```sh
  docker run --rm --network host \
    -e DATABASE_URL="postgres://..." \
    -v "$(pwd)/packages/server/db:/db" \
    ghcr.io/amacneil/dbmate up
  ```

- Migration file naming convention: `YYYYMMDDHHMMSS_<snake_case_description>.sql`
  (e.g. `20260301120000_create_campaigns.sql`).

### Express Server

Run separately from Docker Compose:

```sh
npm run dev:server
```

### Server Directory Layout

```text
packages/server/
├── db/
│   ├── migrations/    # DBMate SQL migrations (schema and seed data)
│   └── schema.sql     # Schema dump maintained by DBMate
└── src/
    ├── app.ts         # Express app factory (middleware and routers)
    ├── index.ts       # Server entry point
    ├── auth/          # Login, logout, and current-user routes
    ├── campaigns/     # Campaign routes, SQL queries, audit helper
    ├── db/            # PostgreSQL connection pool
    ├── middleware/    # Auth, role checks, correlation ID, request logging, error handling
    ├── notifications/ # In-app notification routes
    ├── users/         # User profile and admin user routes
    └── __tests__/     # Integration tests (Vitest + SuperTest)
```

---

## Testing

| Technology                | Version       | Purpose                                          |
| ------------------------- | ------------- | ------------------------------------------------ |
| Vitest                    | Latest stable | Unit and integration test runner                 |
| SuperTest                 | Latest stable | HTTP assertion library for API tests             |
| @testing-library/react    | Latest stable | React component testing utilities                |
| MSW (Mock Service Worker) | Latest stable | API mocking for frontend tests (target — not installed in the demo) |
| Playwright                | Latest stable | End-to-end browser tests (root `e2e/` directory) |

### Playwright CI Requirements

The Playwright E2E suite requires the following CI environment setup (introduced by issue #66):

- A `postgres:16-alpine` service must be running before the suite starts.
- DBMate migrations must run against the CI database before the test suite executes.
- Seed data is applied by the same DBMate migrations (seed files are migrations in `packages/server/db/migrations/`).
- The Express server must be started (`npm run dev:server` with `DATABASE_URL`, `JWT_SECRET`, and `PORT=3001`) before the suite runs.
- Playwright configuration lives at the repo root in `playwright.config.ts`; tests live at `e2e/*.spec.ts`.

### Quality Gates

- Unit test coverage: 90%+ for business logic / domain (target — not enforced in the demo; the only enforced coverage threshold is 80% on `src/components/ui/Button.tsx` in `packages/client/vite.config.ts`)
- Integration tests must pass
- E2E tests must pass

---

## Architecture Pattern

**Hexagonal Architecture** (Ports and Adapters) for clean separation between domain logic and infrastructure concerns.

> **Local demo note**: Production design only. The demo server is organised by feature folder; route handlers call SQL query functions directly, with no ports/adapters layer.

---

## Compute & Hosting

> **Local demo note**: Production design only, except the Local Development row. The CI workflow pulls the DBMate image from GHCR; no application images are built or pushed.

| Component                   | Technology                          | Notes                                                            |
| --------------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| Backend API                 | AWS ECS Fargate (Docker containers) | Behind Application Load Balancer (ALB)                           |
| Frontend                    | AWS CloudFront CDN                  | S3 origin for static assets                                      |
| Scheduled Tasks             | AWS EventBridge Scheduler           | Triggers ECS tasks (e.g., daily historic rates sync at 3 AM UTC) |
| Container Registry (CI)     | GHCR (GitHub Container Registry)    | Used during CI builds                                            |
| Container Registry (Deploy) | AWS ECR                             | Production container images                                      |
| Local Development           | Docker, Docker Compose              | Local environment parity                                         |

---

## Infrastructure as Code

> **Local demo note**: Production design only — not present in the local demo.

| Technology      | Version   | Purpose                                    |
| --------------- | --------- | ------------------------------------------ |
| Terraform       | >= 1.11.0 | Infrastructure provisioning and management |
| Terraform Cloud | —         | Remote state management and execution      |

---

## CI/CD

| Component | Technology     |
| --------- | -------------- |
| Pipeline  | GitHub Actions |

### Deployment Strategy

> **Local demo note**: Production design only. The demo has a single GitHub Actions workflow (`.github/workflows/ci.yml`) that type-checks, lints, builds, and tests; there is no deployment.

- Automated infrastructure deployment via Terraform
- Docker image build and push to ECR
- ECS service updates with rolling deployment
- React frontend build and S3 upload with CloudFront invalidation

### Environments

- Separate workflows for development and production (production design only)

---

## Change Log

| Date       | Author | Summary                                                                                                                                                                                                                    |
| ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-04 | Claude | Initial draft — enumerated all technology choices from architecture prompt                                                                                                                                                 |
| 2026-03-04 | —      | Promoted to Review status. Content complete; decisions backfilled into dependent specs.                                                                                                                                    |
| 2026-03-04 | —      | Expanded PostHog role to cover feature flags, product analytics, and web analytics. Added posthog-node for backend feature flag evaluation. Added Feature Flags & Product Operations and Developer Observability sections. |
| 2026-03-04 | —      | Added Stripe as payment gateway (Stripe Elements, stripe Node SDK).                                                                                                                                                        |
| 2026-03-09 | Claude | Clarified Tailwind CSS actual usage: CSS reset and normalisation layer only; component-level styling uses inline `React.CSSProperties` with `var()` semantic token references.                                             |
| 2026-03-09 | Claude | Added Local Development section: `docker-compose.dev.yml` (postgres:16-alpine), DBMate migration invocation and naming convention, Express server run-separately pattern, `server/src/` directory layout. Bumped to 0.2.0. |
| 2026-03-10 | Claude | Updated Local Development section: DBMate volume path `server/db` → `packages/server/db`; Express run command `cd server && npm run dev` → `npm run dev:server` (from repo root); Server Directory Layout root label `server/` → `packages/server/`. Bumped to 0.3.0. |
| 2026-03-10 | Claude | Added Playwright CI Requirements subsection documenting `postgres:16-alpine` service, DBMate migrations, seed script, and config/test file locations. Bumped to 0.4.0. |
| 2026-03-11 | Claude | Replaced Clerk authentication row with `jsonwebtoken` (stateless JWT generation/validation) and `bcryptjs` (password hashing) to reflect custom demo auth stub delivered in issues #93–#95. Bumped to 0.5.0. |
