# Mars Mission Fund — Specification Index

> **Read this file first.**
> This is the authoritative index of all specifications governing the Mars Mission Fund platform.
> Before implementing any task, identify which specs govern the affected domain and read them in layer order (L1 → L4).

---

## Workshop Context

Mars Mission Fund is a **sample application for a coding workshop** — a fictional product used to teach software engineering practices.
These specifications are written to production standard as a deliberate part of the exercise: participants learn to work with real-world specification patterns, architectural trade-offs, and cross-cutting concerns.

**What is real (impacts the local demo)**:

- Tech stack choices, architecture patterns, and CQRS/Event Sourcing (L3-001, L3-008).
- Frontend standards, component architecture, and brand tokens (L2-001, L3-005).
- Domain workflows and acceptance criteria that drive implementation (L4 specs).
- Code quality gates, testing standards, and linting (L2-002, L3-007).
- Audit event schema and event store design (L3-006).

**What is theatre (production-realistic but not implemented locally)**:

- Multi-environment deployment (staging, production) — local Docker only.
- Disaster recovery, failover, on-call rotations, and SLA enforcement (L3-003).
- Penetration testing, security incident response, and breach notification (L3-002).
- PCI DSS compliance processes, GDPR operational workflows (L3-002, L3-006).
- Data residency, cross-border transfers, and tiered storage automation (L3-004, L3-006).
- External provider integrations (KYC, payment gateway, email, search) — stubbed or mocked.
- Secrets management service, certificate management — environment variables for local dev.

The specifications are intentionally production-grade.
They serve as working documentation for the demo and as templates demonstrating how real-world specs should be structured.
Each spec includes a **Local demo scope** note identifying what matters for the workshop.

---

## Agent Protocol

1. **Before any implementation task**, read this index to identify governing specs.
1. **Read specs top-down**: L1 → L2 → relevant L3 → relevant L4. Higher layers take precedence.
1. **Never contradict a higher-layer spec.** If a lower-layer spec conflicts with a higher one, flag it as a blocking issue and reference both documents.
1. **Cross-reference dependencies.** Each spec lists what it depends on and what depends on it. Follow these links to ensure changes don't break downstream specs.
1. **Check rate of change.** Specs with a slow rate of change require change request approval before modification. Specs with a fast rate of change can be updated with standard review.

---

## Specification Hierarchy

### L1 — Strategic (changes quarterly or at major pivots)

| Spec ID | Document                        | Purpose                                                                                                                                                                                  | Status   |
| ------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| L1-001  | `product-vision-and-mission.md` | Root document. Defines why we exist, who we serve, what we build, and what we don't. All other specs must align with the vision, mission, principles, and scope boundaries defined here. | Approved |

**Governance**: Changes to L1 require product leadership approval and trigger a review of all downstream specs for alignment.

---

### L2 — Standards (changes monthly or at standard reviews)

| Spec ID | Document                   | Purpose                                                                                                                                                                                                                                                                                                                                                | Depends On                      | Status   |
| ------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- | -------- |
| L2-001  | `standards/brand.md`       | How the MMF brand system (colours, typography, voice, motion) is applied within the product. References the HTML brand guidelines as the source of truth for design tokens. Specifies product-specific application rules, component-to-token mappings, accessibility requirements, and voice-in-product patterns. Does not duplicate brand guidelines. | L1-001, Brand Guidelines (HTML) | Approved |
| L2-002  | `standards/engineering.md` | The engineering constitution. Codifies non-negotiable technical decisions: security-first architecture, parameterised queries only, encryption standards, testing requirements, code quality gates, and dependency management policies. All L3 and L4 specs inherit these constraints.                                                                 | L1-001                          | Approved |

**Governance**: Changes to L2 require engineering and design leadership review. Changes to L2-002 trigger a review of all L3 specs.

---

### L3 — Technical (changes at sprint level / technology decisions)

| Spec ID | Document                  | Purpose                                                                                                                                                                                                                                         | Depends On                     | Status   |
| ------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------- |
| L3-001  | `tech/architecture.md`    | System architecture, service boundaries, data model, infrastructure design, deployment topology, and inter-service communication patterns.                                                                                                      | L1-001, L2-002, L3-008         | Approved |
| L3-002  | `tech/security.md`        | Threat model, control matrix, authentication/authorisation architecture, encryption standards, compliance mapping (PCI DSS, GDPR, Australian Privacy Act). Implements the "Security as Foundation" principle from L1-001.                       | L1-001, L2-002, L3-001         | Approved |
| L3-003  | `tech/reliability.md`     | Availability targets, failover strategies, disaster recovery, backup policies, circuit breakers, health checks, and degradation modes.                                                                                                          | L2-002, L3-001                 | Approved |
| L3-004  | `tech/data-management.md` | Data classification scheme, retention policies, data lifecycle, anonymisation rules, backup and recovery, data access patterns, and migration strategies.                                                                                       | L2-002, L3-001, L3-002         | Approved |
| L3-005  | `tech/frontend.md`        | Frontend architecture, component library standards, performance budgets, accessibility (WCAG 2.1 AA minimum), responsive breakpoints, animation performance constraints, and browser support matrix. Implements brand tokens defined in L2-001. | L2-001, L2-002, L3-001         | Approved |
| L3-006  | `tech/audit.md`           | Audit logging architecture, immutable event streams, what gets logged, retention periods, access controls on audit data, regulatory reporting, and anomaly detection. Implements the "Transparency as Currency" principle from L1-001.          | L1-001, L2-002, L3-001, L3-002 | Approved |
| L3-007  | `tech/markdown.md`        | Markdown authorship standard: one-sentence-per-line rule, heading and list conventions, linter configuration (markdownlint). Governs all `.md` files in the repository.                                                                         | L2-002                         | Approved |
| L3-008  | `tech/tech-stack.md`      | Enumerates all technology choices: languages, frameworks, libraries, infrastructure, and tooling. Single source of truth for the platform's technology baseline.                                                                                | L1-001, L2-002, L3-001         | Approved |

**Governance**: Changes to L3 specs require engineering review. Changes to L3-001 (architecture) or L3-002 (security) trigger review of all dependent L3 and L4 specs.

---

### L4 — Domain (changes per feature / per release)

| Spec ID | Document             | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                   | Depends On                             | Status   |
| ------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | -------- |
| L4-001  | `domain/account.md`  | The full account lifecycle: registration, onboarding, email verification, password policies, SSO integration, profile management, role assignment, session management, notification preferences, account recovery, account deactivation, and data portability. Onboarding is a phase within this lifecycle, not a separate concern.                                                                                       | L2-001, L3-002, L3-005, L4-005         | Approved |
| L4-002  | `domain/proposal.md` | Full proposal lifecycle: project submission, review pipeline, approval/rejection, live proposal management, funding progress tracking, milestone definition and verification, stretch goals, deadline enforcement, proposal completion, proposal failure handling, and fund settlement. Origination is a phase within this lifecycle, not a separate concern.                                                             | L1-001, L2-001, L3-001, L3-006, L4-004 | Approved |
| L4-003  | `domain/donor.md`    | The complete donor-side bounded context: project discovery and search, recommendation engine, curated collections, category browsing, contribution flow (references L4-004), ongoing donor relationship management, contribution history, impact reporting, milestone notifications, cumulative impact dashboards, and repeat engagement patterns. Implements the "Accessibility Over Exclusivity" principle from L1-001. | L1-001, L2-001, L3-005, L4-002, L4-004 | Approved |
| L4-004  | `domain/payments.md` | Payment processing: gateway integration (Stripe), tokenisation, PCI DSS scope management (SAQ-A), escrow mechanics, milestone-based disbursement, multi-approval disbursement workflows, refund handling, currency support, transaction reconciliation, tax receipt generation, and financial reporting.                                                                                                                  | L2-002, L3-001, L3-002, L3-004, L3-006 | Approved |
| L4-005  | `domain/kyc.md`      | Identity verification: KYC document upload, automated verification checks, sanctions screening, manual review workflows, verification status lifecycle, re-verification triggers, jurisdictional requirements, and data retention rules specific to identity documents.                                                                                                                                                   | L2-002, L3-002, L3-004, L3-006         | Approved |

**Governance**: Changes to L4 specs follow standard feature review. Changes that affect interfaces between domain specs require review of all connected specs (check "Depends On" chains).

---

### Tooling

Operational references and CLI cheat-sheets.
These are not numbered specs and do not participate in the L1–L4 dependency hierarchy.

| Document            | Purpose                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| `adrs/`             | Architecture Decision Records capturing technology and structural choices. ADR-0001: npm workspaces monorepo; ADR-0002: audit log demo simplification; ADR-0003: stubbed integrations. |
| `tooling/github.md` | CLI reference for managing GitHub milestones, issues, and PRs via `gh`. |
| `learnings.md`      | Accumulated gotchas, environment quirks, and workarounds discovered during implementation; updated by agents at milestone close. |

---

## Dependency Graph (Summary)

```text
L1-001 Product Vision & Mission
│
├── L2-001 standards/brand.md
│   ├── L3-005 tech/frontend.md
│   │   ├── L4-001 domain/account.md
│   │   ├── L4-002 domain/proposal.md
│   │   └── L4-003 domain/donor.md
│   ├── L4-001 domain/account.md
│   ├── L4-002 domain/proposal.md
│   └── L4-003 domain/donor.md
│
├── L2-002 standards/engineering.md
│   ├── L3-001 tech/architecture.md
│   │   ├── L3-002 tech/security.md
│   │   │   ├── L3-004 tech/data-management.md
│   │   │   ├── L3-006 tech/audit.md
│   │   │   ├── L4-001 domain/account.md
│   │   │   ├── L4-004 domain/payments.md
│   │   │   └── L4-005 domain/kyc.md
│   │   ├── L3-003 tech/reliability.md
│   │   ├── L3-004 tech/data-management.md
│   │   │   ├── L4-004 domain/payments.md
│   │   │   └── L4-005 domain/kyc.md
│   │   ├── L3-005 tech/frontend.md
│   │   └── L3-006 tech/audit.md
│   │       ├── L4-002 domain/proposal.md
│   │       ├── L4-004 domain/payments.md
│   │       └── L4-005 domain/kyc.md
│   ├── L4-004 domain/payments.md
│   └── L4-005 domain/kyc.md
│
├── L3-006 tech/audit.md
├── L4-002 domain/proposal.md
└── L4-003 domain/donor.md
```

---

## Cross-Cutting Concerns

Some concerns span multiple specs. When working in these areas, read all referenced specs:

| Concern                      | Governing Specs                | Notes                                                                                          |
| ---------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| Payment security             | L3-002, L3-006, L4-004, L4-005 | PCI DSS compliance touches security, audit, payments, and KYC                                  |
| User data privacy            | L3-002, L3-004, L4-001, L4-005 | GDPR and Australian Privacy Act span security, data management, account, and KYC               |
| Proposal financial integrity | L3-006, L4-002, L4-004         | Escrow, milestone disbursement, and audit trail must be consistent                             |
| Donor experience             | L2-001, L3-005, L4-003, L4-004 | Brand standards, frontend standards, donor spec, and payments must deliver a cohesive flow     |
| Access control               | L3-002, L4-001, L4-002, L4-005 | RBAC model defined in security, implemented across account, proposal review, and KYC workflows |

---

## File System Layout

```text
specs/
├── README.md                          ← You are here
├── adrs/
│   ├── 0001-npm-workspaces-monorepo.md          ← ADR-0001
│   ├── 0002-audit-log-demo-simplification.md    ← ADR-0002
│   └── 0003-stubbed-integrations.md             ← ADR-0003
├── learnings.md                       ← Accumulated implementation gotchas
├── product-vision-and-mission.md      ← L1
├── standards/
│   ├── brand.md                       ← L2-001
│   └── engineering.md                 ← L2-002
├── tech/
│   ├── architecture.md                ← L3-001
│   ├── security.md                    ← L3-002
│   ├── reliability.md                 ← L3-003
│   ├── data-management.md             ← L3-004
│   ├── frontend.md                    ← L3-005
│   ├── audit.md                       ← L3-006
│   ├── markdown.md                    ← L3-007
│   └── tech-stack.md                  ← L3-008
├── tooling/
│   └── github.md                      ← GitHub CLI reference
└── domain/
    ├── account.md                     ← L4-001
    ├── proposal.md                    ← L4-002
    ├── donor.md                       ← L4-003
    ├── payments.md                    ← L4-004
    └── kyc.md                         ← L4-005
```

---

## Document Conventions

All specs in this ecosystem follow these conventions:

- **Spec ID**: Every document has a unique ID (e.g., L3-002) used for cross-referencing.
- **Frontmatter metadata**: Each spec includes spec ID, version, status, rate of change, depends-on list, and depended-on-by list.
- **Acceptance criteria**: L4 domain specs must include explicit, testable acceptance criteria for every workflow.
- **Interface contracts**: Where specs share boundaries (e.g., payments ↔ proposal), both specs must define the interface contract and reference each other.
- **Change log**: Every spec maintains a change log with date, author, and summary of changes.
- **Status values**: `Not Started` → `Draft` → `Review` → `Approved` → `Superseded`

---

## External References

| Reference        | Type          | Location                                 | Notes                                                                                                                               |
| ---------------- | ------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Brand Guidelines | Design system | `standards/mars-mission-fund-brand.html` | Source of truth for design tokens, colour palette, typography, voice & tone, motion. L2-001 references this; does not duplicate it. |

---

*This index is the entry point for all agents and contributors. Keep it current.*
