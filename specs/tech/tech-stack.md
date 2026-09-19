# Tech Stack

> **Spec ID:** L3-008
> **Version:** 0.5.0
> **Status:** Approved
> **Rate of change:** Slow (changes at major technology decisions)
> **Depends on:** L1-001, L2-002, L3-001
> **Depended on by:** All L3 and L4 specs (technology baseline)

---

## Purpose

> **Local demo scope**: All technology choices in this document are **real** and used in the local demo. Cloud infrastructure (ECS Fargate, CloudFront, ECR, Terraform Cloud) is replaced by Docker Compose for local development. The local demo uses the same languages, frameworks, and libraries listed here.

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
| Tailwind CSS                 | v4            | CSS reset and global normalisation layer; Tailwind v4 is used for CSS reset and normalisation only — component-level styling is done via inline `React.CSSProperties` objects with `var()` references on Tier 2 semantic tokens, not Tailwind utility classes |
| PostHog (posthog-js)         | Latest stable | Feature flags, product analytics, and web analytics                                                                                                                                                                                                           |

---

## Backend

| Technology             | Version       | Purpose                                               |
| ---------------------- | ------------- | ----------------------------------------------------- |
| Express                | 5.x           | HTTP server framework                                 |
| Pino                   | Latest stable | Structured JSON logging                               |
| pino-http              | Latest stable | HTTP request logging middleware                       |
| pino-pretty            | Latest stable | Human-readable log output (development only)          |
| PostHog (posthog-node) | Latest stable | Server-side feature flag evaluation and event capture |

---

## Feature Flags & Product Operations

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

---

## Validation

| Technology | Purpose                                                        |
| ---------- | -------------------------------------------------------------- |
| Zod        | Runtime schema validation, shared between frontend and backend |

---

## Authentication

| Technology   | Purpose                                                      |
| ------------ | ------------------------------------------------------------ |
| jsonwebtoken | Stateless JWT generation and validation (demo auth stub)     |
| bcryptjs     | Password hashing for demo account credentials (seed SQL)     |

---

## Payments

| Technology        | Purpose                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| Stripe            | Payment gateway — tokenisation, authorisation, capture, refunds, payouts |
| @stripe/stripe-js | Client-side Stripe Elements integration                                  |
| stripe (Node SDK) | Server-side Stripe API interaction (behind adapter abstraction)          |

---

## Identity Verification (KYC)

| Technology | Purpose                                                                    |
| ---------- | -------------------------------------------------------------------------- |
| Veriff     | Third-party identity verification provider (stubbed/mocked for local demo) |

---

## Email

| Technology | Purpose                                       |
| ---------- | --------------------------------------------- |
| AWS SES    | Transactional and notification email delivery |

---

## Search

Proposal discovery search is served by **PostgreSQL full-text search** over CQRS read models.
No external search provider is required.

---

## API Documentation

| Technology         | Purpose                                      |
| ------------------ | -------------------------------------------- |
| OpenAPI 3.1        | API specification format                     |
| swagger-jsdoc      | Generate OpenAPI spec from JSDoc annotations |
| swagger-ui-express | Serve interactive API docs                   |

---

## Secrets Management

| Technology            | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| AWS Secrets Manager   | Secret storage, injection, and rotation (production) |
| Environment variables | Secret injection for local development               |

---

## Object Storage

| Technology | Purpose                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| AWS S3     | Frontend static assets (CloudFront origin), audit cold storage, KYC document uploads, proposal media |

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
| AWS Aurora PostgreSQL | Primary relational database               |
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
  (e.g. `20260301120000_create_proposals.sql`).

### Express Server

Run separately from Docker Compose:

```sh
npm run dev:server
```

### Server Directory Layout

```text
packages/server/
└── src/
    ├── proposals/     # Proposal domain handlers and routes
    ├── db/            # Database client, migration helpers, migrations/
    ├── middleware/     # Express middleware (logging, error handling)
    └── __tests__/     # Integration and unit tests
```

---

## Testing

| Technology                | Version       | Purpose                                          |
| ------------------------- | ------------- | ------------------------------------------------ |
| Vitest                    | Latest stable | Unit and integration test runner                 |
| SuperTest                 | Latest stable | HTTP assertion library for API tests             |
| @testing-library/react    | Latest stable | React component testing utilities                |
| MSW (Mock Service Worker) | Latest stable | API mocking for frontend tests                   |
| Playwright                | Latest stable | End-to-end browser tests (root `e2e/` directory) |

### Playwright CI Requirements

The Playwright E2E suite requires the following CI environment setup (introduced by issue #66):

- A `postgres:16-alpine` service must be running before the suite starts.
- DBMate migrations must run against the CI database before the test suite executes.
- A seed SQL script must be applied to the CI database before E2E tests run.
- Playwright configuration lives at `e2e/playwright.config.ts`; tests live at `e2e/*.spec.ts`.

### Quality Gates

- Unit test coverage: 90%+ for business logic / domain
- Integration tests must pass
- E2E tests must pass

---

## Architecture Pattern

**Hexagonal Architecture** (Ports and Adapters) for clean separation between domain logic and infrastructure concerns.

---

## Compute & Hosting

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

- Automated infrastructure deployment via Terraform
- Docker image build and push to ECR
- ECS service updates with rolling deployment
- React frontend build and S3 upload with CloudFront invalidation

### Environments

- Separate workflows for development and production

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
