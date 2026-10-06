# MARS MISSION FUND

## Product Vision & Mission

Crowdfunding the Next Giant Leap

The strategic foundation document for a secure crowdfunding platform that channels collective capital toward the missions, technologies, and teams taking humanity to Mars.

---

### Spec Ecosystem Context

This is the L1 Strategic spec. It is the root document in the Mars Mission Fund specification hierarchy. All other specs inherit from and must align with the vision, mission, principles, and scope boundaries defined here. See `specs/README.md` for the full specification index.

| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| SPEC ID        | L1-001                                                |
| DOCUMENT       | Product Vision & Mission                              |
| VERSION        | 1.3                                                   |
| STATUS         | Approved                                              |
| CLASSIFICATION | Internal                                              |
| RATE OF CHANGE | Slow — revised quarterly or at major strategic pivots |
| DEPENDS ON     | None (root document)                                  |
| DEPENDED ON BY | All L2, L3, and L4 specs                              |
| DATE           | March 2026                                            |

---

## 1. Product Vision

### 1.1 Vision Statement

Mars Mission Fund exists to become the world's most trusted platform for collectively funding humanity's journey to Mars — turning everyday investors into mission backers who power the engineering, science, and infrastructure that will make interplanetary life possible.

### 1.2 The Problem We Solve

Space exploration has historically been the domain of nation-states and a handful of billionaire-backed ventures. The result is a bottleneck: brilliant teams with viable Mars-enabling technologies struggle to find funding, while millions of people who care deeply about humanity's future have no meaningful way to contribute capital toward specific missions.

Mars Mission Fund bridges this gap by creating a secure, transparent, and purpose-built crowdfunding platform exclusively focused on Mars-bound projects. We give capital a direction and give ambition a launchpad.

### 1.3 Who We Serve

| Persona                 | Description                                                                | Primary Need                                                                    |
| ----------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Mission Backers         | Individuals who want to fund specific Mars projects with as little as $50  | Transparency, trust, and a tangible connection to the mission they fund         |
| Project Creators        | Engineers, scientists, and teams building Mars-enabling technology         | A credible platform to raise capital, gain visibility, and prove viability      |
| Institutional Partners  | Space agencies, research institutions, and corporate sponsors              | Due diligence, compliance, and aggregated deal flow for strategic co-investment |
| Platform Administrators | Internal team responsible for curation, compliance, and platform integrity | Efficient review workflows, robust access control, and audit trails             |

### 1.4 Strategic Principles

- **Security as Foundation:** Every line of code, every workflow, every integration is built on a security-first architecture. In a financial platform, trust is not a feature — it is the product. See: `tech/security.md`
- **Transparency as Currency:** Backers see exactly where their money goes. Projects report milestones publicly. The platform itself is auditable and explainable. See: `tech/audit.md`
- **Accessibility Over Exclusivity:** A $50 contribution and a $50,000 institutional commitment both matter. The platform democratises access to space funding. See: `domain/donor.md`
- **Curation Over Volume:** We are not a marketplace for everything. Every project is reviewed, vetted, and approved before going live. Quality over quantity. See: `domain/campaign.md`
- **Bold but Responsible:** Our brand is bold and optimistic, but our financial systems are cautious and compliant. We speak like engineers who dream big and build carefully. See: `standards/brand.md`

---

## 2. Product Mission

### 2.1 Mission Statement

To build and operate a secure, regulation-ready crowdfunding platform that enables vetted Mars-mission projects to raise capital from a global community of backers — with institutional-grade security, transparent governance, and an experience that makes complex financial participation feel as immediate as a countdown to launch.

### 2.2 Core Workflows

The platform is organised around three core transactional workflows. Each is summarised here at the strategic level; detailed acceptance criteria, state machines, and interface contracts are defined in the corresponding domain specs.

#### Workflow 1: Campaign Lifecycle

*Detailed spec: `domain/campaign.md`*

Project creators submit proposals containing mission objectives, team credentials, funding targets, milestone plans, and risk disclosures. Submissions enter a structured review pipeline managed by platform administrators. Approved projects become live campaigns with public funding pages, progress tracking, milestone verification, and completion or failure handling.

- Creator registers, completes identity verification (KYC), and submits a project proposal via guided form.
- Platform administrators with "Reviewer" role assess proposals against published curation criteria with full audit logging.
- Approved projects transition to "Live" status with public campaign pages. Rejected proposals receive written rationale and resubmission guidance.
- Live campaigns track funding progress, manage stretch goals, and enforce deadline rules.
- Milestone verification triggers staged fund disbursement. Campaign completion or failure triggers appropriate settlement workflows.
- All state transitions are immutable and timestamped for audit trail integrity.

#### Workflow 2: Donor Lifecycle

*Detailed specs: `domain/donor.md`, `domain/payments.md`, `domain/kyc.md`*

The donor-side experience encompasses discovery, contribution, and ongoing relationship management. Backers find projects aligned with their interests, contribute through a secure payment flow, and maintain a long-term relationship with the missions they fund through impact reporting and engagement features.

- Backers discover campaigns via search, recommendation algorithms, curated collections, and category browsing.
- Contribution flow uses PCI DSS-compliant payment processing with tokenisation — the platform never stores raw card data.
- Funds are held in escrow until predefined milestones are met and verified by administrators.
- Backers receive milestone updates, impact reports, and mission progress notifications for projects they fund.
- Contribution history, tax receipt generation, and cumulative impact dashboards maintain the ongoing donor relationship.
- All financial transactions are encrypted in transit (TLS 1.3) and at rest (AES-256) with full reconciliation.

#### Workflow 3: Account & Identity

*Detailed specs: `domain/account.md`, `domain/kyc.md`, `tech/security.md`*

The account bounded context governs the full lifecycle of a user's relationship with the platform: creation, authentication, profile management, role assignment, session management, and account recovery or deactivation. It underpins every interaction and enforces fine-grained permissions appropriate for a financial application.

- Registration with email verification, strong password policy, and optional SSO via OAuth 2.0 / OpenID Connect.
- Multi-factor authentication (TOTP, WebAuthn) required for all financial actions and administrative operations.
- Role-based access control (RBAC) with defined roles: Backer, Creator, Reviewer, Administrator, and Super Administrator.
- KYC verification workflow with document upload, automated checks, and manual review for edge cases.
- Profile management includes notification preferences, contribution history, and downloadable tax receipts.
- Account recovery, deactivation, and data portability handled in compliance with GDPR and Australian Privacy Act.

---

## 3. Scope Boundaries

Clarity about scope is as important as ambition. These boundaries are authoritative — any spec that proposes features outside these boundaries must first update this document with an approved change request.

### 3.1 What We Are

- A secure crowdfunding platform exclusively for Mars-enabling projects.
- A curated marketplace where every project is reviewed and approved before going live.
- A transparent system where backers can track exactly how their contributions are used.
- A regulation-ready platform designed to meet PCI DSS, GDPR, and Australian Privacy Act requirements.
- An accessible platform where contributions from $50 to $50,000 are equally valued.

### 3.2 What We Are Not

- We are not a general crowdfunding platform. We exclusively fund Mars-enabling projects.
- We are not an investment platform. Contributions are donations or pledges, not equity purchases, until regulatory frameworks evolve.
- We are not a project incubator. We fund vetted projects; we do not originate or manage them.
- We are not a social network. Community features serve transparency and accountability, not engagement metrics.
- We are not a payment processor. We integrate with established payment gateways; we do not build our own.

---

## 4. Success Metrics

The platform's success is measured across five dimensions. These metrics are owned by this document; individual specs may define supporting metrics that roll up into these.

| Dimension | Key Metric                                          | Year 1 Target                                |
| --------- | --------------------------------------------------- | -------------------------------------------- |
| Trust     | Zero data breaches; 100% uptime for financial flows | Maintain through launch + 12 months          |
| Adoption  | Registered backers                                  | 50,000 backers across 20+ countries          |
| Funding   | Total capital raised through platform               | $5M cumulative in first year                 |
| Curation  | Project success rate (milestones delivered on time) | > 80% of funded projects hit first milestone |
| Security  | Mean time to detect / respond to security events    | MTTD < 15 min, MTTR < 4 hours                |

---

## 5. Specification Ecosystem

This document is the root of a four-layer specification hierarchy designed for agent-first consumption. Each layer has a distinct rate of change and scope of authority. The full index with cross-references and dependency metadata is maintained in `specs/README.md`.

| Layer | Purpose                    | Documents                                                                                                        | Rate of Change                |
| ----- | -------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| L1    | Strategic vision and scope | `product-vision-and-mission.md`                                                                                  | Quarterly / pivots            |
| L2    | Standards and principles   | `standards/brand.md`, `standards/engineering.md`                                                                 | Monthly / standard reviews    |
| L3    | Technical how-we-build     | `tech/architecture`, `security`, `reliability`, `data-management`, `frontend`, `audit`, `markdown`, `tech-stack` | Sprint-level / tech decisions |
| L4    | Domain what-we-build       | `domain/account`, `campaign`, `donor`, `payments`, `kyc`                                                         | Per feature / per release     |

**Agent protocol:** Before implementing any task, read `specs/README.md` to identify which specs govern the affected domain. Specs at lower layers must not contradict higher layers. If a conflict is detected, flag it as a blocking issue and reference both specs.

---

*Your stake. Their mission. Our planet.*
