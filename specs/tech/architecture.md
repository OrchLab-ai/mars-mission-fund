# Architecture

> **Spec ID**: L3-001
> **Version**: 0.7
> **Status**: Approved
> **Rate of Change**: Sprint-level / tech decisions
> **Depends On**: L1-001 (Product Vision & Mission), L2-002 (Engineering Standard), L3-008 (Tech Stack)
> **Depended On By**: L3-002 (tech/security.md), L3-003 (tech/reliability.md), L3-004 (tech/data-management.md), L3-005 (tech/frontend.md), L3-006 (tech/audit.md), L4-002 (domain/campaign.md), L4-004 (domain/payments.md)

---

## 1. Purpose

> **Local demo scope**: REST API design (URL-path versioning under `/v1`, the `{ "data": ... }` success envelope, and the error response format) is **real** — the local demo implements it.
> The local demo is a single Express app (`packages/server/`) organised by feature folder (`auth/`, `campaigns/`, `users/`, `notifications/`); route handlers validate input with Zod and call SQL query functions (`queries.ts`) directly against PostgreSQL via `pg`.
> There is **no** CQRS, event store, read models, process managers, ports/adapters (hexagonal) layer, API gateway, or feature flag framework (no PostHog) in the demo — those sections describe the production design.
> Multi-environment deployment, infrastructure topology diagrams, and service discovery are also production design only.
> The local demo uses `docker-compose.dev.yml` to start the PostgreSQL database only; the Express server is run separately with `npm run dev:server` from the repo root (or `npm run dev` inside `packages/server/`) — it is not part of the Docker Compose stack.

This spec defines the system architecture for Mars Mission Fund: service boundaries, data model overview, inter-service communication patterns, infrastructure topology, deployment strategy, and cross-cutting technical frameworks (ADRs, feature flags, linting).

**What this spec governs**:

- High-level system structure and service decomposition.
- Inter-service communication contracts and patterns.
- Infrastructure and deployment topology.
- Technology selection registry and ADR process.
- Feature flag framework.
- Linting and formatting rulesets.
- API versioning scheme and error response format.

**What this spec does NOT cover**:

- Threat models and security controls — see [Security](L3-002).
- Availability targets, failover, and disaster recovery — see [Reliability](L3-003).
- Data classification, retention, and lifecycle — see [Data Management](L3-004).
- Frontend component architecture and browser support — see [Frontend Standards](L3-005).
- Audit event schemas and log retention — see [Audit](L3-006).

---

## 2. Inherited Constraints

This spec inherits all constraints from the [Engineering Standard](L2-002).
The following sections are directly implemented or referenced by this spec:

| L2-002 Section                     | Constraint                                                                    | How This Spec Implements It                                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 Encryption                     | TLS 1.3 minimum; AES-256 at rest for sensitive data                           | Section 5 (Infrastructure) defines where termination occurs; [Security](L3-002) defines the certificate and key management details |
| 1.2 Data Access                    | Parameterised queries only; data access layer required                        | Section 4 (Data Model) defines the data access layer pattern                                                                       |
| 1.3 Secrets Management             | Secrets via dedicated service, injected at runtime                            | Section 8 (Technology Selection Registry) records the chosen secrets management service                                            |
| 1.5 Authentication & Authorisation | Every endpoint authenticated; no anonymous internal calls                     | Section 6.3 (Service Identity) defines the service identity mechanism                                                              |
| 2.4 Abstraction Requirement        | External dependencies behind internal interfaces                              | Section 3.3 (External Integration Adapters) defines the adapter pattern for external integrations                                  |
| 3.1 Decision Rights                | ADR process for multi-service architectural decisions                         | Section 7 (ADR Process) defines the full process                                                                                   |
| 4.1 Code Quality                   | Linting and formatting rulesets per language                                  | Section 10 (Linting & Formatting) defines rulesets                                                                                 |
| 4.5 Deployment Gates               | Feature flags as default for user-facing changes                              | Section 9 (Feature Flag Framework) defines the framework                                                                           |
| 5.1 Versioning                     | All APIs versioned from day one                                               | Section 6.1 (Synchronous Communication) defines the scheme                                                                         |
| 5.3 Error Response Contract        | Consistent error format with error code, message, correlation ID              | Section 6.1 (Error Response Format) defines the format                                                                             |
| 7.1 Environment Parity             | Dev, staging, production structurally identical                               | Section 5 (Infrastructure) defines the environment topology                                                                        |
| 7.2 Configuration                  | Runtime config via environment variables; feature flags via dedicated service | Sections 5 and 9                                                                                                                   |
| 7.4 Deployments                    | Automated, reproducible, reversible within 15 minutes                         | Section 5.3 (Deployment Pipeline)                                                                                                  |

---

## 3. Service Boundaries & Responsibilities

The system is decomposed into services aligned with the L4 domain boundaries.
Each service owns its data, exposes a well-defined API, and communicates with other services through the patterns defined in Section 6.

### 3.1 Domain Services

| Service          | Governing Spec     | Responsibilities                                                                                                     |
| ---------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Account Service  | [Account](L4-001)  | User registration, authentication, profile management, role assignment, session management, account recovery         |
| Campaign Service | [Campaign](L4-002) | Project submission, review pipeline, campaign lifecycle, milestone tracking, deadline enforcement, fund settlement   |
| Donor Service    | [Donor](L4-003)    | Project discovery, recommendations, contribution flow orchestration, impact reporting, donor relationship management |
| Payment Service  | [Payments](L4-004) | Payment gateway integration, tokenisation, escrow, disbursement, refunds, reconciliation, tax receipts               |
| KYC Service      | [KYC](L4-005)      | Identity verification, document handling, sanctions screening, verification lifecycle                                |

### 3.2 Shared / Platform Services

| Service                                    | Responsibilities                                                                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API Gateway                                | Request routing, rate limiting, authentication token validation, correlation ID injection, TLS termination                                                          |
| Notification Service                       | Email, push, and in-app notification delivery; template management; delivery tracking                                                                               |
| Audit Service                              | Append-only event ingestion, storage, and query — see [Audit](L3-006). Event sourcing provides a natural audit trail; the Audit Service reads from the event store. |
| Search Service                             | Full-text search over campaigns, projects, and public profiles — backed by PostgreSQL full-text search over CQRS read models. No external search provider required. |
| Feature Flag & Analytics Service (PostHog) | Feature flags, product analytics, and web analytics — see Section 9                                                                                                 |
| Secrets Management Service                 | Secret storage, injection, and rotation — see Section 8                                                                                                             |

> **Local demo note**: None of these platform services exist as separate components in the demo.
> Express middleware handles what the demo needs: `helmet`, `cors`, JSON parsing, a correlation ID header (`x-correlation-id`), `pino-http` request logging, and JWT verification per route.
> Search is a `ILIKE` match on campaign title and summary, not full-text search over read models.

### 3.3 External Integration Adapters

Per [Engineering Standard](L2-002), Section 2.4, every external dependency is accessed through an internal adapter interface.

| Adapter                 | External Provider                                                                           | Consuming Services            |
| ----------------------- | ------------------------------------------------------------------------------------------- | ----------------------------- |
| Payment Gateway Adapter | Stripe (per L3-008)                                                                         | Payment Service               |
| KYC Provider Adapter    | Veriff (not integrated in the demo — KYC is hard-coded as verified)                            | KYC Service                   |
| Email Delivery Adapter  | AWS SES                                                                                     | Notification Service          |
| Object Storage Adapter  | AWS S3 (per L3-008 — S3 used for frontend assets, audit cold storage, and document uploads) | KYC Service, Campaign Service |

Each adapter exposes an internal interface contract.
The concrete provider implementation is swappable without changes to consuming code.

> **Local demo note**: The demo has no adapter interfaces. Payment, KYC, and refund behaviour are inline stubs marked `DEMO STUB` in the route and query code, and email is not sent (see [ADR-0003](../adrs/0003-stubbed-integrations.md)).

---

## 4. Data Model Overview

### 4.1 Data Ownership

Each domain service owns its data store.
No service reads from or writes to another service's data store directly.
Cross-service data access occurs only through published API contracts or consumed events.

Detailed data classification, retention, and lifecycle policies are defined in [Data Management](L3-004).

### 4.2 Data Access Layer

Per [Engineering Standard](L2-002), Section 1.2, all data access goes through a data access layer that enforces:

- Parameterised queries exclusively (no string concatenation in query construction).
- Access control validation (the calling identity has permission to access the requested resource).
- Structured logging of all data access operations (resource ID, action, actor — never raw PII).

The data access layer uses raw SQL via pg (parameterised queries) — no ORM or query builder.

### 4.3 Data Model Diagram

Data model will emerge as domain requirements are discovered and implemented.
Entity-relationship diagram to be added once core aggregates are stabilised.

---

## 5. Infrastructure & Deployment Topology

### 5.1 Environment Topology

Per [Engineering Standard](L2-002), Section 7.1, three environments exist with structural parity:

| Environment | Purpose                                                             | Scale            | Data                             |
| ----------- | ------------------------------------------------------------------- | ---------------- | -------------------------------- |
| Development | Local and CI-based development and testing                          | Minimal replicas | Synthetic / seeded               |
| Staging     | Pre-production validation, integration testing, performance testing | Reduced replicas | Synthetic, representative volume |
| Production  | Live traffic                                                        | Full scale       | Real                             |

All environments share the same service topology, network layout, and configuration shape.
Differences are limited to scale, data, and secrets.

### 5.2 Infrastructure Diagram

Infrastructure diagram to be added once deployment topology is stabilised.
Will cover: edge layer, API gateway, services, data stores, event bus, external integrations, and observability stack.

### 5.3 Deployment Pipeline

Per [Engineering Standard](L2-002), Section 7.4:

- Every deployment is automated from merge-to-main through to production, with explicit approval gates per Section 4.5 of the [Engineering Standard](L2-002).
- Every deployment is reproducible: same commit hash and configuration produces identical artefacts.
- Rollback to the previous version is possible within 15 minutes with no data loss.
- Database migrations are backward-compatible: the previous application version must function against the new schema.

The CI/CD platform is recorded in the Technology Selection Registry (Section 8).

### 5.4 Container & Orchestration Strategy

- **Containerisation**: Single Docker container deployed to AWS ECS Fargate.
- **Deployment unit**: All domain services run within one deployment unit (monolithic deployment, modular internal architecture via hexagonal architecture per [Tech Stack](L3-008)). The local demo is a modular monolith organised by feature folder without a hexagonal ports/adapters layer.
- **Load balancing**: Behind an Application Load Balancer (ALB) for health checks, TLS termination, and request routing.
- **Frontend**: Served via CloudFront CDN with S3 origin (per [Tech Stack](L3-008)).

---

## 6. Inter-Service Communication

### 6.1 Synchronous Communication

Synchronous (request/response) communication is used when the caller requires an immediate response to proceed.

- **Protocol**: REST over HTTPS.
- **Service discovery**: Not required — all services run within a single deployment unit. If services are split in the future, ECS Service Connect (AWS Cloud Map) is the natural fit.
- **Timeout and retry policy**: Every synchronous call must define a timeout.
  Retry policies must use exponential backoff with jitter.
  Circuit breaker patterns are defined in [Reliability](L3-003).

#### API Versioning

Per [Engineering Standard](L2-002), Section 5.1, all APIs are versioned from day one.

- **Scheme**: URL path versioning (`/v1/resource`).
- **Deprecation periods**: Minimum 90 days for external APIs, 30 days for internal APIs per [Engineering Standard](L2-002), Section 5.1.

#### Success Response Envelope

All successful API responses are wrapped in a `data` envelope:

- Single-resource endpoints return `{ "data": { ... } }`.
- Collection endpoints return `{ "data": [ ... ] }`.

```json
{ "data": { "id": "...", "title": "..." } }
```

```json
{ "data": [ { "id": "...", "title": "..." }, { "id": "...", "title": "..." } ] }
```

This envelope is implemented in `packages/server/src/campaigns/routes.ts` (`res.json({ data: ... })`).

#### Field Naming Convention

- DB columns use `snake_case` (PostgreSQL convention).
- All API JSON responses use `camelCase` field names.
- The server query layer is responsible for aliasing column names before returning data to routes
  (e.g. `SELECT min_funding_target_usd AS "minFundingTargetUsd" FROM ...`).
- Shared Zod schemas in `@mmf/shared` must use camelCase to match API responses.

#### Error Response Format

Per [Engineering Standard](L2-002), Section 5.3, all APIs use a consistent error response format:

```json
{
  "error": {
    "code": "<MACHINE_READABLE_ERROR_CODE>",
    "message": "<Human-readable message suitable for display>",
    "correlation_id": "<Request correlation ID>",
    "details": {}
  }
}
```

- `code`: A stable, machine-readable identifier (e.g., `CAMPAIGN_NOT_FOUND`, `INSUFFICIENT_FUNDS`). Not an HTTP status code.
- `message`: Follows voice-in-product patterns from [Brand Standard](L2-001).
- `correlation_id`: The correlation ID assigned at the edge per [Engineering Standard](L2-002), Section 6.2.
- `details`: Optional structured context to help the caller understand and resolve the error. Must never contain internal implementation details or sensitive data.

### 6.2 Asynchronous Communication

Asynchronous (event-driven) communication is used when:

- The caller does not need an immediate response.
- Multiple consumers need to react to the same event.
- Temporal decoupling improves system resilience.

#### CQRS & Event Sourcing

> **Local demo note**: Production design only. The demo has no event store, read models, populators, or process managers; routes write current state directly to PostgreSQL tables and record audit rows as plain inserts (see [ADR-0002](../adrs/0002-audit-log-demo-simplification.md)).

- **Pattern**: Commands mutate state by appending events to the event store. Queries read from materialised read models. This separation allows independent scaling and optimisation of write and read paths.
- **Event Store**: PostgreSQL (Aurora) — events are append-only rows in a dedicated events table per aggregate. No separate message broker is required.
- **Event schema**: All events follow a common envelope:

```json
{
  "event_id": "<UUID>",
  "event_type": "<DOMAIN>.<ACTION>",
  "timestamp": "<ISO 8601>",
  "correlation_id": "<Request correlation ID>",
  "source_service": "<Emitting service name>",
  "payload": {}
}
```

- **Read Model Populators**: Pull events from the event store and project them into read-optimised views (PostgreSQL tables or materialised views). All populators are idempotent — replaying events produces the same read model state.
- **Process Managers**: Coordinate cross-aggregate workflows by consuming events and issuing commands. Process managers maintain their own state and are idempotent.
- **Delivery guarantees**: At-least-once. All consumers are idempotent. Consumption is pull-based — populators and process managers poll the event store for new events using a stored checkpoint.
- **Schema evolution**: Events follow backward-compatible evolution rules mirroring [Engineering Standard](L2-002), Section 5.2 (new fields may be added; existing fields must not be removed or changed).

### 6.3 Service Identity & Authentication

Per [Engineering Standard](L2-002), Section 1.5, every service-to-service call is authenticated.

- **Mechanism**: Not applicable — single deployment unit, all inter-service calls are in-process. If services are split in the future, JWT service tokens are recommended, aligning with the custom stateless JWT implementation already in use for user authentication (see [Security](L3-002) and [Tech Stack](L3-008)).
- Each service has a unique identity.
  No service impersonates another.
- Authorisation policies define which services can call which endpoints.

---

## 7. Architecture Decision Record (ADR) Process

Per [Engineering Standard](L2-002), Section 3.1, architectural decisions affecting multiple services follow a structured ADR process.

### 7.1 When an ADR Is Required

- Introducing a new service or removing an existing one.
- Changing inter-service communication patterns or protocols.
- Selecting or replacing a technology in the Technology Selection Registry.
- Modifying service boundaries or data ownership.
- Any decision that changes the interface contract between two or more services.

### 7.2 ADR Template

Each ADR is stored in `specs/adrs/` with the filename `NNNN-<short-title>.md`:

```markdown
# ADR-NNNN: <Title>

> **Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXXX
> **Date**: <YYYY-MM-DD>
> **Deciders**: <list of people involved>

## Context

What is the issue or decision we need to make? What forces are at play?

## Decision

What is the decision and why?

## Consequences

What are the positive, negative, and neutral consequences of this decision?

## Compliance

Which spec constraints (L2-002 sections, L3 constraints) does this decision satisfy or affect?
```

### 7.3 ADR Lifecycle

1. **Proposed**: Author creates the ADR and opens a PR. The PR description links to the ADR.
1. **Review**: Peer review from at least one engineer outside the proposing team, per [Engineering Standard](L2-002), Section 3.1.
1. **Accepted**: Merged to main. The decision is binding.
1. **Superseded**: A new ADR explicitly supersedes this one. The old ADR is updated with a pointer to the new one.

---

## 8. Technology Selection Registry

All approved technology choices are recorded here.
New entries require a vendor evaluation per [Engineering Standard](L2-002), Section 2.5 and an ADR per Section 7.

| Category                   | Technology                                                               | ADR | Notes                                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------ | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary language(s)        | TypeScript (Node.js 22.x LTS)                                            | —   | Per L3-008                                                                                                                                                                 |
| Web framework              | Express 5.x                                                              | —   | Per L3-008                                                                                                                                                                 |
| ORM / query builder        | pg (raw SQL, parameterised queries)                                      | —   | Must enforce parameterised queries per [Engineering Standard](L2-002), Section 1.2. Per L3-008                                                                             |
| API documentation          | OpenAPI 3.1 (swagger-jsdoc + swagger-ui-express)                         | —   | Machine-readable, validated against implementation per [Engineering Standard](L2-002), Section 5.5                                                                         |
| Event bus / message broker | PostgreSQL event store (CQRS/Event Sourcing — no separate broker)        | —   | Events are append-only rows in Aurora PostgreSQL. See Section 6.2.                                                                                                         |
| Container runtime          | Docker                                                                   | —   | Per L3-008                                                                                                                                                                 |
| Orchestration platform     | AWS ECS Fargate                                                          | —   | Per L3-008                                                                                                                                                                 |
| CI/CD platform             | GitHub Actions                                                           | —   | Must support automated, reproducible deployments per [Engineering Standard](L2-002), Section 7.4. Per L3-008                                                               |
| Secrets management         | AWS Secrets Manager (env vars for local dev)                             | —   | Runtime injection and rotation per [Engineering Standard](L2-002), Sections 1.3 and 7.3                                                                                    |
| Feature flag service       | PostHog                                                                  | —   | Feature flags, product analytics, and web analytics. Runtime-configurable without deployment per [Engineering Standard](L2-002), Section 7.2                               |
| Monitoring / observability | PostHog (product analytics), CloudWatch + Pino (developer observability) | —   | PostHog for user-facing analytics; CloudWatch for infrastructure metrics and alerts; Pino for structured application logging per [Engineering Standard](L2-002), Section 6 |
| Payment gateway            | Stripe                                                                   | —   | Per L3-008. See [Payments](L4-004)                                                                                                                                         |
| KYC provider               | Veriff (not integrated in the demo — KYC hard-coded as verified)         | —   | See [KYC](L4-005)                                                                                                                                                          |
| Email delivery             | AWS SES                                                                  | —   | Transactional and notification emails                                                                                                                                      |
| Search engine              | PostgreSQL full-text search (via CQRS read models)                       | —   | No external provider — search served by dedicated read models                                                                                                              |
| Object storage             | AWS S3                                                                   | —   | Per L3-008 (CloudFront S3 origin, audit cold storage)                                                                                                                      |
| Database(s)                | AWS Aurora PostgreSQL                                                    | —   | Per-service data ownership. Per L3-008                                                                                                                                     |

---

## 9. Feature Flag Framework

Per [Engineering Standard](L2-002), Sections 4.5 and 7.2:

- Feature flags are the default deployment mechanism for user-facing changes.
- Feature flags are runtime-configurable without deployment.
- Feature flags are managed through PostHog (not environment variables).

> **Local demo note**: Production design only. The demo has no feature flag service, no PostHog integration, and no flags.

### 9.1 Flag Lifecycle

| Stage         | Description                                                                              |
| ------------- | ---------------------------------------------------------------------------------------- |
| Created       | Flag registered in the feature flag service with a default-off state                     |
| Development   | Flag used to gate in-progress work; enabled only in development and staging              |
| Rollout       | Flag enabled incrementally in production (percentage-based, user-segment, or allow-list) |
| Fully enabled | Flag enabled for all users; code path without the flag is verified as unused             |
| Removed       | Flag and conditional code removed in a follow-up PR; dead code is not acceptable         |

### 9.2 Flag Naming Convention

Flags use kebab-case keys following the pattern `<domain>-<feature>`:

- `campaign-milestone-tracking`
- `donor-impact-dashboard`
- `payment-crypto-support`

### 9.3 Flag Ownership

Every flag has an owner (team or individual) and a planned removal date.
Flags that exceed their planned lifetime are flagged in a regular cleanup review.

---

## 10. Linting & Formatting

Per [Engineering Standard](L2-002), Section 4.1, all code passes automated linting and formatting checks before review.
Formatting is never a review discussion — it is automated.

### 10.1 Rulesets Per Language

| Language   | Linter               | Formatter | Configuration                      |
| ---------- | -------------------- | --------- | ---------------------------------- |
| TypeScript | ESLint (flat config) | Prettier  | `eslint.config.js`, `.prettierrc`  |
| Markdown   | markdownlint-cli2    | —         | `.markdownlint.jsonc` (per L3-007) |

### 10.2 Enforcement

- Linting and formatting checks run in CI on every PR per [Engineering Standard](L2-002), Section 4.4.
- Pre-commit hooks are available for local development but CI is the authoritative gate.
- Auto-formatting is applied on save in recommended IDE configurations.

---

## 11. Interface Contracts

This spec shares boundaries with every other L3 spec and several L4 specs.

### 11.1 Architecture <> Security (L3-002)

- This spec defines the service topology and communication patterns.
  [Security](L3-002) defines the threat model, authentication/authorisation mechanisms, and encryption implementations that operate within this topology.
- This spec defines the API Gateway as the TLS termination and token validation point.
  [Security](L3-002) defines the token format, validation rules, and MFA requirements.
- Service identity mechanism (Section 6.3) is jointly owned: this spec defines the pattern; [Security](L3-002) defines the credentials and trust model.

### 11.2 Architecture <> Reliability (L3-003)

- This spec defines the service topology and deployment pipeline.
  [Reliability](L3-003) defines availability targets, failover strategies, circuit breaker configurations, and health check contracts that apply to every service in this topology.
- The deployment rollback requirement (15 minutes, Section 5.3) is jointly owned with [Reliability](L3-003).

### 11.3 Architecture <> Data Management (L3-004)

- This spec establishes per-service data ownership (Section 4.1).
  [Data Management](L3-004) defines the data classification scheme, retention policies, anonymisation rules, and migration strategies that apply to each service's data store.
- The data access layer (Section 4.2) enforces parameterised queries and access logging.
  [Data Management](L3-004) defines what data is classified at each level and the access rules per classification.

### 11.4 Architecture <> Frontend Standards (L3-005)

- This spec defines the API Gateway and backend service contracts that the frontend consumes.
  [Frontend Standards](L3-005) defines the frontend architecture, component standards, and performance budgets for the client layer.
- The error response format (Section 6.1) is consumed by the frontend.
  [Frontend Standards](L3-005) defines how errors are presented to users, implementing the voice-in-product patterns from [Brand Standard](L2-001).

### 11.5 Architecture <> Audit (L3-006)

- This spec defines the Audit Service as a shared platform service (Section 3.2).
  [Audit](L3-006) defines the audit event schema, immutability guarantees, retention policies, and access controls.
- The event envelope (Section 6.2) provides the base structure.
  [Audit](L3-006) extends this with audit-specific fields and ingestion contracts.

---

## 12. Change Log

| Date       | Version | Author | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | ------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| March 2026 | 0.1     | —      | Initial stub. Service boundaries, communication patterns, infrastructure topology, ADR process, technology registry, feature flags, linting.                                                                                                                                                                                                                                                                                                                                                                                 |
| March 2026 | 0.2     | —      | Backfilled Technology Selection Registry with resolved choices from L3-008 (TypeScript, Express 5, pg, Docker, ECS Fargate, GitHub Actions, Aurora PostgreSQL). Resolved Open Questions 1, 7, 8, 9. Added L3-008 dependency.                                                                                                                                                                                                                                                                                                 |
| March 2026 | 0.3     | —      | Resolved all remaining open questions (2–6, 10–12). Established CQRS/Event Sourcing as core pattern (Section 6.2). Selected REST over HTTPS with URL-path versioning (Section 6.1). Selected PostHog for feature flags, product analytics, and web analytics (Sections 3.2, 8, 9). CloudWatch + Pino for developer observability (Section 8). Service discovery and service-to-service auth noted as not applicable for single deployment unit (Sections 6.1, 6.3). Filled container & orchestration strategy (Section 5.4). |
| 2026-03-09 | 0.4     | —      | Clarified local demo topology in Section 1: `docker-compose.dev.yml` starts PostgreSQL only; the Express server (`server/`) is run separately via `npm run dev` — it is not part of the Docker Compose stack.                                                                                                                                                                                                                                                                                                                  |
| 2026-03-10 | 0.5     | —      | Corrected Section 1 local demo scope note: updated Express server path from `server/` to `packages/server/` and run command to `npm run dev:server` from the repo root (or `npm run dev` inside `packages/server/`), reflecting the completed npm workspaces monorepo restructuring.                                                                                                                                                                                                                                          |
| 2026-03-10 | 0.6     | Claude | Added Success Response Envelope and Field Naming Convention subsections to Section 6.1, documenting the `{ "data": ... }` wrapper and camelCase API field naming convention introduced by issue #65.                                                                                                                                                                                                                                                                                                                         |
| 2026-03-11 | 0.7     | Claude | Updated Section 6.3 service identity note: replaced "Clerk/OIDC infrastructure" reference with the custom stateless JWT implementation used for user authentication (issue #96).                                                                                                                                                                                                                                                                                                                                             |
