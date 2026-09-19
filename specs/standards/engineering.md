# Engineering Standard

> **Spec ID**: L2-002
> **Version**: 1.0
> **Status**: Approved
> **Rate of Change**: Monthly / standard reviews
> **Depends On**: L1-001 (Product Vision & Mission)
> **Depended On By**: L3-001 (tech/architecture.md), L3-002 (tech/security.md), L3-003 (tech/reliability.md), L3-004 (tech/data-management.md), L3-005 (tech/frontend.md), L3-006 (tech/audit.md), L3-007 (tech/markdown.md), L3-008 (tech/tech-stack.md), L4-004 (domain/payments.md), L4-005 (domain/kyc.md)

---

## Purpose

> **Local demo scope**: Engineering values, quality gates, testing standards, and API contract rules are **real** — they govern the local demo code. Multi-team dynamics, bar-raiser reviews, on-call expectations, and cross-team resource allocation are theatre for the workshop setting. The security invariants apply to all code written for the demo.

This document is the engineering constitution for Mars Mission Fund.
It defines the non-negotiable constraints that every L3 and L4 spec inherits, and the values that give those constraints meaning.

The litmus test for whether a rule belongs here: **would violating it be a fundamental engineering failure regardless of which feature, service, or domain it occurs in?**
If yes, it's in this document.
If it only applies in certain contexts, it belongs in an L3 or L4 spec.

Detailed implementation guidance — specific technology choices, architecture patterns, threat models, frontend frameworks — lives in the L3 specs that depend on this document.
This standard defines the playing field.
L3 and L4 specs play on it.

---

## 0. Our Engineering Values

Engineering decisions at Mars Mission Fund are guided by six value positions.
These are not aspirations — they are trade-offs we have deliberately chosen, with consequences we accept.
Each position sits on a spectrum of valid alternatives; we've chosen the position that fits our context as a security-critical financial platform with a small, high-trust team building a product-first experience.

These value positions were identified using the [Campbell Method Engineering Values Assessment](https://www.campbellmethod.com/resources/engineering-values-assessment), a framework for mapping engineering culture across six fundamental spectrums.

### 0.1 Product First — Experience Obsession

**Spectrum**: [Company Primary Focus](https://www.campbellmethod.com/resources/engineering-values-assessment/spectrums/focus) — ranges from Technology First (breakthrough invention) through Product First and Customer Obsessed to Market Focused (competitive edge).

**Our position**: Product First.
The total user experience is the primary source of value.
The product's elegance, simplicity, integration, and feel are paramount.
Design has a seat at the table.
"Good enough" is never approved for user-facing surfaces.

**What this means for engineering**: Design review has veto power on UI implementations.
Prototype testing is required before full implementation of experience-critical features.
Internal APIs serving user-facing flows receive the same care as external ones.

**Trade-offs we accept**: We may be slower to iterate.
We may dismiss valid feedback that conflicts with the product vision.
We invest more in fit and finish than competitors who ship faster.

### 0.2 Don't Reinvent — Smart Assembly

**Spectrum**: [Execution & Build Strategy](https://www.campbellmethod.com/resources/engineering-values-assessment/spectrums/execution) — ranges from Full Control (own the full stack) through Invent & Simplify and Don't Reinvent to Buy, Don't Build (integrate solutions).

**Our position**: Don't Reinvent.
Our engineering time is precious and should only be spent on our competitive advantage.
We use best-of-breed open-source and managed services for everything that isn't core to what makes Mars Mission Fund unique.
We are not a technology vendor — we don't invent new infrastructure.
But we are an engineering organisation, not a systems integrator.

**What this means for engineering**: Heavy reliance on high-quality open-source and cloud-native managed services.
The key decision is which tool to use, not whether to build it.
Build-vs-buy reviews default to buy unless there is a defined trigger demanding innovation (see Section 2).

**Trade-offs we accept**: Vendor lock-in.
Dependency on external roadmaps and pricing.
Limited differentiation on infrastructure.
We build on the same foundations as competitors — our differentiation is in the product layer, not the platform layer.

### 0.3 Empowered Autonomy — Trust Experts

**Spectrum**: [Decision-Making Pace](https://www.campbellmethod.com/resources/engineering-values-assessment/spectrums/pace) — ranges from Analyse & Deliberate (measure twice, cut once) through Seek Consensus and Empowered Autonomy to Bias for Action (ship and learn).

**Our position**: Empowered Autonomy.
The person closest to the problem is best equipped to solve it.
Leadership sets context and goals (the what and why); teams own the how.
Minimal approval chains.
Clear ownership structures.
We hire smart people and trust their judgement — within the boundaries this standard defines.

**What this means for engineering**: Small, autonomous teams with full ownership.
Decisions pushed down to where the information is.
The standards in this document provide the high support that matches our high expectations.
If you think a standard is wrong, challenge it through a change request — don't ignore it.

**Trade-offs we accept**: Potential inconsistency across teams.
Duplicated effort.
This model requires an extremely high and consistent hiring bar — it fails with mediocre teams.

### 0.4 High Standards — Standards Force Invention

**Spectrum**: [Quality and Standards](https://www.campbellmethod.com/resources/engineering-values-assessment/spectrums/quality) — ranges from Meticulous Craft (quality is the product) through High Standards and Pragmatic Quality to Ship and Iterate (learn from production).

**Our position**: High Standards.
High standards are a forcing function to invent.
The goal isn't perfectionism — it's using constraints to force the team to find simpler, more scalable solutions.
When a standard feels like it's blocking you, that's the signal to find a better approach, not to lower the bar.
Leaders constantly raise the bar and reject work that doesn't meet it.
Rework cycles are expected and budgeted, not failures.

**What this means for engineering**: Bar-raiser reviews on every significant PR.
Standards applied to everything: code, documents, specs, meeting preparation.
The standard is often "is this scalable to 100x?" and "is this the simplest solution?"
Mediocrity is not tolerated.
"Good enough" is rejected.

**Trade-offs we accept**: A culture that can feel sharp-edged.
Burnout risk if the bar always feels impossibly high.
The possibility of getting stuck if the team can't find the inventive solution.
We mitigate these through our Coach & Support leadership model.

### 0.5 Selfless — Company Over Team

**Spectrum**: [Collaboration Model](https://www.campbellmethod.com/resources/engineering-values-assessment/spectrums/collaboration) — ranges from Internal Competition (compete to innovate) through Siloed Autonomy and Selfless to One-Team (succeed together).

**Our position**: Selfless.
Do what is best for the company, not your team or yourself.
Best-for-the-company wins every argument.
Engineers give candid feedback on other teams' work.
Managers give their best engineer to higher-priority projects when needed.
Resources flow to where the company needs them, not where teams want to keep them.

**What this means for engineering**: Cross-team contributions to shared infrastructure are expected, not optional.
If another team needs your service modified for a company-priority feature, that takes precedence over your team's roadmap.
No empire-building.
No knowledge hoarding.
Success is defined as "the company won."

**Trade-offs we accept**: Difficult to measure and reward individual team performance.
May inadvertently reward weak managers by taking resources from strong teams.
Requires high maturity and psychological safety to execute without resentment.

### 0.6 Coach & Support — Develop People

**Spectrum**: [Leadership Model](https://www.campbellmethod.com/resources/engineering-values-assessment/spectrums/leadership) — ranges from Dive Deep & Audit (trust but verify) through Coach & Support and Empower & Delegate to Provide Cover (shield the team).

**Our position**: Coach & Support.
A manager's job is to make their team members successful.
Leaders are facilitators, career guides, and performance coaches.
One-on-ones focus on growth, well-being, and removing blockers.
Psychological safety is non-negotiable.
Learning from failure is how we improve.

**What this means for engineering**: Code review is teaching, not gatekeeping.
We leave things in a better condition than we found them — every PR, every spec, every architectural decision should make the next person's (or agent's) job easier.
This principle manifests as clear naming, thorough documentation, explicit cross-references in specs, and choosing the option that's more legible to newcomers.

**Trade-offs we accept**: May be slower for short-term results.
Doesn't work well for low performers who need directive management.
Requires leaders who are both technically strong and skilled coaches.

### Value Coherence

These six positions form a reinforcing system:

- *Empowered Autonomy* requires *High Standards* — you can only trust experts to decide independently if the standards are clear enough that "independent" doesn't mean "inconsistent."
- *Don't Reinvent* supports *Selfless* — when teams use the same best-of-breed tools, knowledge transfers naturally and people move across teams without relearning infrastructure.
- *Coach & Support* sustains *High Standards* — you can maintain a high bar without creating a harsh culture because leaders develop people rather than just gatekeeping.
- *Product First* drives *High Standards* — experience obsession means the quality bar is set by user perception, not engineering convenience.
- *Selfless* enables *Empowered Autonomy* — teams can make fast local decisions because shared values ensure those decisions align with company direction.

---

## 1. Security Invariants

**Values served**: High Standards, Product First

On a financial platform, security is not a feature — it is the product.
These invariants are absolute.
No exception process exists for violating them.
If a design cannot satisfy these constraints, the design is wrong.

Detailed threat models, control matrices, and compliance mappings live in `tech/security.md`.
This section defines the invariants that `tech/security.md` must implement and that all other specs must respect.

### 1.1 Encryption

All data is encrypted in transit using TLS 1.3 (minimum).
No exceptions for internal service-to-service communication.

All sensitive data is encrypted at rest using AES-256.
"Sensitive" is defined in the data classification scheme in `tech/data-management.md`, but at minimum includes: personal identifiable information, financial data, authentication credentials, and KYC documents.

### 1.2 Data Access

All database queries use parameterised queries or prepared statements.
String concatenation in SQL or query construction is prohibited under all circumstances — including scripts, migrations, and one-off administrative tasks.

Raw SQL is never written in application code.
All data access goes through a data access layer that enforces parameterisation, logging, and access control.

### 1.3 Secrets Management

Secrets (API keys, database credentials, encryption keys, signing certificates) are never stored in source code, configuration files committed to version control, log output, error messages, or client-side code.

All secrets are managed through a dedicated secrets management service and injected via environment variables at runtime.
The specific service is defined in `tech/architecture.md`.

### 1.4 Input Validation

All external input is validated, sanitised, and type-checked at the system boundary before any processing.
"External" means: user input, API requests, webhook payloads, file uploads, URL parameters, and any data originating outside the trust boundary.

Content Security Policy (CSP) headers are mandatory on all web responses.
The specific policy is defined in `tech/security.md`.

File uploads are validated for type, size, and content.
Uploaded files are never served from the same domain as the application.

### 1.5 Authentication & Authorisation

Every API endpoint and every service-to-service call is authenticated and authorised.
There are no anonymous internal endpoints.
"It's only called by our own services" is not a security model.

Multi-factor authentication is required for all financial actions and all administrative operations.
The MFA implementation (TOTP, WebAuthn) is defined in `tech/security.md`.

### 1.6 Dependency Security

Every dependency (direct and transitive) is scanned for known vulnerabilities on every build.
Critical CVEs (CVSS 9.0+) must be patched or mitigated within 24 hours of disclosure.
High CVEs (CVSS 7.0–8.9) within 7 days.

No dependency may be added without a review of its licence, maintenance status, and security history.
Abandoned packages (no commits in 12 months, no maintainer response to issues) are not permitted.

### 1.7 Logging & Auditability

Every state mutation in the system is logged with a timestamp, actor identity, action performed, and affected resource.
Logs are append-only and immutable.
No mechanism exists to delete or modify audit log entries.

Sensitive data is never logged.
Log entries use resource identifiers, not raw personal data.

The full audit logging architecture is defined in `tech/audit.md`.
This invariant establishes that audit logging is not optional for any service or domain.

---

## 2. Build vs. Own

**Values served**: Don't Reinvent, High Standards

Engineering time is spent on what makes Mars Mission Fund unique.
For everything else, we use best-of-breed tools and accept the trade-offs that come with external dependencies.

### 2.1 Decision Framework

Every significant technology decision must pass through this framework.
"Significant" means: introducing a new service, library, or infrastructure component; building functionality that could be replaced by an existing solution; or replacing an existing tool.

| Question                                                                                                                                         | If Yes                                                                       | If No                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| Is this capability core to our competitive advantage — the product experience, proposal curation, or donor relationship that differentiates MMF? | Evaluate building. Proceed to build-quality assessment.                      | Default to integrate or buy.                           |
| Does an open-source or SaaS solution exist that solves ≥80% of the requirement?                                                                  | Use it. Engineer the remaining 20% as integration, not reimplementation.     | Evaluate building. Document why the market gap exists. |
| Does integrating the third-party solution expand our PCI DSS scope or introduce an unacceptable trust boundary?                                  | This is a valid trigger to build. Document the security rationale.           | Integrate.                                             |
| Does the external solution's roadmap, pricing model, or licence create an existential risk to the platform?                                      | Evaluate alternatives first. If none exist, build with an abstraction layer. | Integrate.                                             |
| Can we wrap the external solution behind an interface that allows replacement without changing consuming code?                                   | Required for all integrations. Proceed.                                      | Design the abstraction layer before integrating.       |

### 2.2 What We Build

The competitive advantage of Mars Mission Fund lives in: the proposal curation and review pipeline, the donor matching and impact reporting experience, the product experience layer, and the trust and transparency mechanisms that differentiate us from generic crowdfunding.
Engineering time is concentrated here.

### 2.3 What We Don't Build

We do not build: payment processing (integrate Stripe/Adyen), identity verification infrastructure (integrate a KYC provider), email delivery, search infrastructure, hosting/compute, CI/CD pipelines, monitoring/alerting platforms, or any other capability where mature, well-maintained solutions exist.
We configure, integrate, and operate these — we don't reinvent them.

### 2.4 Abstraction Requirement

Every external dependency must be accessed through an internal interface (adapter, gateway, or service wrapper) that the rest of the codebase consumes.
No application code should reference a vendor SDK directly.
This allows replacement of the underlying provider without changing consuming code.

### 2.5 Vendor Evaluation Criteria

When selecting between external solutions, evaluate in this priority order:

1. **Security posture** — Does it meet our security invariants? Does it narrow or widen our compliance scope?
1. **Fitness for purpose** — Does it solve the actual problem, not an adjacent one?
1. **Operational maturity** — Active maintenance, responsive to CVEs, clear deprecation policy, transparent incident history.
1. **Integration surface** — Clean API, good documentation, supports our abstraction requirement.
1. **Community and ecosystem** — Healthy contributor base, ecosystem of plugins/extensions, low risk of abandonment.
1. **Total cost of ownership** — Licensing, integration engineering, ongoing maintenance, migration cost if we leave.

---

## 3. Ownership & Decision Authority

**Values served**: Empowered Autonomy, Selfless

The person closest to the problem decides — within the boundaries this standard defines.
Decisions are pushed down to where the information is.
But autonomy operates in service of the company, not the team.

### 3.1 Decision Rights

| Decision Type                                           | Authority                                                   | Escalation                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| Implementation approach within a spec                   | Engineer who owns the work                                  | None required                                                        |
| Technology selection within the Build vs. Own framework | Team that will operate the technology                       | Peer review from one engineer outside the team                       |
| API contract changes affecting other teams              | Owning team, with mandatory notification to consuming teams | If consuming teams object, resolve at engineering leadership level   |
| New external dependency introduction                    | Team lead, with vendor evaluation documented                | Security review required for dependencies that handle sensitive data |
| Architectural decisions affecting multiple services     | Owning team proposes, architecture review validates         | Defined in `tech/architecture.md` (ADR process)                      |
| Changes to this standard (L2)                           | Engineering leadership                                      | Requires review of all L3 specs for alignment                        |

### 3.2 Autonomy Within Standards

Engineers are free to make any technical decision that does not violate a standard defined in this document or the L3/L4 specs governing their domain.
This freedom is the point — the standards exist to make autonomy safe, not to constrain creativity.

If an engineer believes a standard is wrong, the correct response is to propose a change request to the standard — not to ignore it.
Standards evolve.
Ignoring them erodes the trust that makes autonomy possible.

### 3.3 Company Over Team

When team priorities conflict with company priorities, company priorities win.
Specifically:

- If a company-priority feature requires modifications to your team's service, that work takes precedence over your team's roadmap.
  Negotiate timeline, not whether.
- Contributions to shared infrastructure, libraries, and platform capabilities are expected of every team.
  This is not optional good citizenship — it is part of the job.
- Knowledge hoarding is a values violation.
  Documentation, clear interfaces, and cross-team legibility are not overhead — they are how Selfless operates in practice.
- When architectural disagreements arise between teams, the resolution criterion is "what is best for Mars Mission Fund," not "what is best for my team."

### 3.4 Code Review & Approval

Every change requires at least one approving review before merge.
The reviewer must be someone other than the author.

For changes affecting security surfaces (authentication, authorisation, payment flows, data access, encryption), a second reviewer with domain expertise in security is required.

Reviews are teaching opportunities, not gatekeeping checkpoints.
Reviewers explain the "why" behind requested changes.
Authors explain the "why" behind their approach.
The goal is shared understanding, not compliance.

Bar-raiser principle: at least one reviewer on every significant PR actively asks "is this the simplest solution?" and "would this scale to 100x?"
Accepting mediocre work is a High Standards violation.

---

## 4. Quality Gates

**Values served**: High Standards, Coach & Support

These gates apply to every line of code, every spec, every deployment.
They are not bureaucratic overhead — they are the forcing function that drives invention.
When a gate blocks you, the correct response is to find a better approach, not to request an exemption.

Rework cycles are expected and budgeted.
Rejecting work that doesn't meet the bar is normal, not adversarial.
The Coach & Support leadership model ensures this happens with respect and growth orientation.

### 4.1 Code Quality

All code must pass automated linting and formatting checks before review.
The specific rulesets are defined per language in `tech/architecture.md`, but the principle is: formatting is never a review discussion.
Automate it.

All code must be type-safe.
Dynamic typing is permitted only where the language requires it.
Where type systems are available, they are mandatory and configured at their strictest practical level.

### 4.2 Test Coverage

All new code must include tests.
The minimum coverage thresholds are:

| Layer                          | Minimum Coverage                          | Type                     |
| ------------------------------ | ----------------------------------------- | ------------------------ |
| Business logic / domain        | 90%                                       | Unit tests               |
| API endpoints                  | 100% of documented contracts              | Integration tests        |
| Payment flows                  | 100% of success and failure paths         | Integration + end-to-end |
| Authentication / authorisation | 100% of roles and permission combinations | Integration tests        |
| UI components                  | 80%                                       | Unit + snapshot tests    |

Coverage is measured on new and changed code, not retroactively applied to legacy code.
Legacy code coverage is improved incrementally — every PR that touches legacy code must leave test coverage higher than it found it.

### 4.3 The "Better Than We Found It" Rule

Every PR must leave the codebase in a better state than the author found it.
This is the Coach & Support value made concrete.
It manifests as:

- Improved naming or documentation in code you touched, even if your PR is about something else.
- Updated or added comments explaining non-obvious decisions.
- Removal of dead code, unused imports, or stale TODOs encountered during the work.
- Spec cross-references added where they were missing.

This is a review criterion.
Reviewers should ask: "does this PR leave things better for the next person?"

### 4.4 Pre-Merge Checklist

Every PR must satisfy these gates before merge.
CI enforces what it can; reviewers enforce the rest.

| Gate                                | Enforced By                     | Applies To                         |
| ----------------------------------- | ------------------------------- | ---------------------------------- |
| All tests pass                      | CI (automated)                  | All PRs                            |
| Lint and format clean               | CI (automated)                  | All PRs                            |
| Type checks pass                    | CI (automated)                  | All PRs                            |
| Dependency vulnerability scan clean | CI (automated)                  | All PRs                            |
| Test coverage thresholds met        | CI (automated)                  | All PRs                            |
| At least one approving review       | Git platform                    | All PRs                            |
| Security reviewer approved          | Git platform + process          | Security-surface PRs               |
| No secrets in code or config        | CI (automated, secret scanning) | All PRs                            |
| "Better than we found it" check     | Reviewer (manual)               | All PRs                            |
| Spec alignment verified             | Reviewer (manual)               | PRs implementing spec requirements |

### 4.5 Deployment Gates

No deployment without a rollback plan.
Every deployment must document: what is being deployed, how to verify it's working, and how to roll back within 15 minutes if it isn't.

Feature flags are the default deployment mechanism for user-facing changes.
Ship dark, verify, enable incrementally.
The feature flag framework is defined in `tech/architecture.md`.

Production deployments to financial flows (payment processing, escrow, disbursement) require a second approval from an engineer who did not author the change.

---

## 5. API & Interface Contracts

**Values served**: High Standards, Product First

Every interface is a product surface.
Internal APIs receive the same care as external ones — because today's internal API is tomorrow's integration point, and because *Product First* means the developer experience of consuming an API is part of the overall experience we obsess over.

### 5.1 Versioning

All APIs are versioned from day one.
The versioning scheme (URL path, header, or content negotiation) is defined in `tech/architecture.md`.
This standard requires that a scheme exists and is applied consistently.

Breaking changes require a new version.
The previous version must continue to function for a defined deprecation period (minimum 90 days for external APIs, minimum 30 days for internal APIs).

### 5.2 Backward Compatibility

Within a version, changes must be backward compatible.
Specifically:

- New fields may be added to responses.
- New optional parameters may be added to requests.
- Existing fields must not be removed, renamed, or have their type changed.
- Existing behaviour must not change for the same inputs.

If a change cannot satisfy these constraints, it requires a new version.

### 5.3 Error Response Contract

All APIs must use a consistent error response format.
The specific format is defined in `tech/architecture.md`, but must include:

- A machine-readable error code (not just an HTTP status code).
- A human-readable message suitable for display (respecting the voice-in-product patterns from `standards/brand.md`).
- A correlation ID linking the error to the request trace.
- Sufficient context for the caller to understand what went wrong and how to fix it, without leaking internal implementation details or sensitive data.

### 5.4 Authentication

Every API endpoint (internal and external) requires authentication.
The authentication mechanism is defined in `tech/security.md`.
This standard establishes that unauthenticated endpoints do not exist in the Mars Mission Fund system, with the sole exception of the health check endpoint required by `tech/reliability.md`.

### 5.5 Documentation

Every API must have machine-readable documentation (OpenAPI/Swagger or equivalent) that is generated from or validated against the actual implementation.
Documentation that can drift from the implementation is not documentation — it is a liability.

---

## 6. Observability Baseline

**Values served**: High Standards, Empowered Autonomy

Empowered Autonomy creates a specific need for strong observability.
When teams make independent decisions, the consequences of those decisions must be visible system-wide.
Observability is not optional — it is how we make autonomy accountable.

The full audit logging architecture is defined in `tech/audit.md`.
The alerting and incident response architecture is defined in `tech/reliability.md`.
This section defines the baseline that every service must meet.

### 6.1 Structured Logging

All services emit structured logs (JSON format).
Every log entry must include:

| Field            | Description                                                                     |
| ---------------- | ------------------------------------------------------------------------------- |
| `timestamp`      | ISO 8601 with timezone                                                          |
| `level`          | Standard levels: DEBUG, INFO, WARN, ERROR                                       |
| `correlation_id` | Unique ID that follows a request across all services it touches                 |
| `service`        | Name of the emitting service                                                    |
| `message`        | Human-readable description of the event                                         |
| `context`        | Structured metadata relevant to the event (resource IDs, action type, duration) |

Sensitive data (PII, financial data, credentials) must never appear in log entries.
Use resource identifiers, not raw data.

### 6.2 Correlation IDs

Every request entering the system is assigned a unique correlation ID at the edge.
This ID propagates through every service-to-service call, every database query, every external API call, and every log entry.
A single correlation ID must be sufficient to reconstruct the complete request path across all services.

### 6.3 Health Checks

Every service exposes a health check endpoint that reports:

- **Liveness**: "this process is running and can accept requests."
- **Readiness**: "this service and its critical dependencies are functioning correctly."

Health checks are the one exception to the "every endpoint requires authentication" rule.
They must be accessible to the orchestration layer without credentials.

### 6.4 Metrics

Every service emits metrics for:

| Metric       | Description                                                  |
| ------------ | ------------------------------------------------------------ |
| Request rate | Requests per second, by endpoint and status code             |
| Error rate   | Errors per second, by endpoint and error type                |
| Latency      | p50, p95, p99 response times, by endpoint                    |
| Saturation   | Resource utilisation (CPU, memory, connections, queue depth) |

These are the four golden signals.
Additional domain-specific metrics are defined in the relevant L3 and L4 specs.

### 6.5 Alerting Baseline

Every service must define alerts for:

- Error rate exceeding baseline by 2x for 5 minutes.
- p99 latency exceeding SLA threshold for 5 minutes.
- Health check failures for 3 consecutive checks.
- Dependency health check failures.

Alert thresholds and escalation policies are defined in `tech/reliability.md`.
This standard establishes that alerting is not optional for any service.

---

## 7. Environment & Configuration

**Values served**: Don't Reinvent, High Standards

We use standard infrastructure tooling.
We don't build custom deployment pipelines when established ones exist.
Configuration is explicit, environment-aware, and never hardcoded.

### 7.1 Environment Parity

Development, staging, and production environments must be structurally identical.
Same services, same network topology, same configuration shape.
The only differences are: scale (fewer replicas in dev), data (synthetic data in non-production), and secrets (different credentials per environment).

"Works on my machine" is not an acceptable state.
If it doesn't work in the CI environment, it doesn't work.

### 7.2 Configuration

All runtime configuration is provided via environment variables.
No configuration is hardcoded in application code or committed to version control (except for default values in development).

Feature flags are managed through a dedicated feature flag service.
They are not environment variables — they are runtime-configurable without deployment.
The specific service is defined in `tech/architecture.md`.

### 7.3 Secrets

Secrets are injected at runtime from a secrets management service.
They are never:

- Committed to version control (even in encrypted form in application repositories).
- Passed as command-line arguments (visible in process listings).
- Written to disk (except by the secrets management agent itself).
- Logged, even at DEBUG level.

Secret rotation must be possible without application redeployment.
The application must handle secret rotation gracefully (re-read on expiry, not crash).

### 7.4 Deployments

Every deployment is automated.
No manual steps between "merge to main" and "running in production" except explicit approval gates defined in Section 4.5.

Every deployment is reproducible.
Given the same commit hash and configuration, the deployment produces identical artefacts.

Every deployment is reversible.
Rollback to the previous version must be possible within 15 minutes with no data loss.
If a change includes a database migration, the migration must be backward-compatible (the previous application version must function against the new schema).

---

## Change Log

| Date       | Version | Author | Summary                                                                                                                                                                                                                                                                                     |
| ---------- | ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| March 2026 | 1.0     | —      | Initial draft. Engineering values (six spectrum positions from Campbell Method Engineering Values Assessment), security invariants, build-vs-own framework, ownership and decision authority, quality gates, API contract standards, observability baseline, environment and configuration. |

---

*This standard governs all engineering at Mars Mission Fund.
Every L3 and L4 spec inherits these constraints.
For the value framework that informs these standards, see the [Campbell Method Engineering Values Assessment](https://www.campbellmethod.com/resources/engineering-values-assessment).*
