# Reliability

> **Spec ID**: L3-003
> **Version**: 1.0
> **Status**: Approved
> **Rate of Change**: Sprint-level / tech decisions
> **Depends On**: L2-002 (standards/engineering.md), L3-001 (tech/architecture.md)
> **Depended On By**: L3-006, L4-004

---

## Purpose

> **Local demo scope**: Health check contracts and the graceful degradation principles are **real** — the local demo implements health endpoints and handles dependency failures cleanly. Everything else in this spec is theatre: availability targets, SLAs, failover, disaster recovery, on-call rotations, backup verification, and alerting escalation. The local demo runs on a single machine with no redundancy.

This spec governs the availability, resilience, and recoverability of the Mars Mission Fund platform.
It defines how the system behaves when things go wrong — from a single dependency timeout to a full region failure.

**What this spec covers**:

- Availability targets and SLA definitions.
- Failover and redundancy strategies.
- Disaster recovery planning (RPO, RTO).
- Backup policies and verification.
- Circuit breaker and bulkhead patterns for external dependency failures.
- Health check contracts.
- Graceful degradation modes.
- Alerting thresholds and escalation policies.
- Incident classification and response procedures.

**What this spec does NOT cover**:

- Security controls and threat modelling — see [Security](L3-002).
- Data classification and retention policies — see [Data Management](L3-004).
- Audit log integrity and immutability — see [Audit](L3-006).
- Specific infrastructure provider selection — see [Architecture](L3-001).

---

## Inherited Constraints

This spec inherits and implements the following constraints from the [Engineering Standard](L2-002):

- **Section 4.5 — Deployment Gates**: Every deployment must have a rollback plan executable within 15 minutes.
  Database migrations must be backward-compatible.
- **Section 6.3 — Health Checks**: Every service must expose liveness and readiness endpoints.
  Health checks are unauthenticated.
- **Section 6.4 — Metrics**: Every service must emit the four golden signals (request rate, error rate, latency, saturation).
- **Section 6.5 — Alerting Baseline**: Every service must define alerts for error rate spikes, latency breaches, and health check failures.
  This spec defines the thresholds and escalation policies that [Engineering Standard](L2-002), Section 6.5 references.
- **Section 7.1 — Environment Parity**: Development, staging, and production environments must be structurally identical.
- **Section 7.4 — Deployments**: Every deployment is automated, reproducible, and reversible.

---

## 1. Availability Targets and SLA Definitions

The [Product Vision & Mission](L1-001) sets a success metric of "100% uptime for financial flows."
In practice, "100%" means the platform's financial surfaces must meet or exceed 99.99% measured availability per calendar month.

### 1.1 Tiered Availability Targets

| Tier                         | Description                                        | Availability Target | Max Monthly Downtime | Examples                                                                                   |
| ---------------------------- | -------------------------------------------------- | ------------------- | -------------------- | ------------------------------------------------------------------------------------------ |
| Tier 1 — Financial Critical  | Flows involving money movement                     | 99.99%              | ~4.3 minutes         | Payment processing, escrow operations, disbursements, refunds                              |
| Tier 2 — Core Platform       | Flows required for primary user journeys           | 99.95%              | ~21.9 minutes        | Authentication, proposal browsing, donor contributions (non-payment steps), KYC submission |
| Tier 3 — Supporting Services | Flows that enhance experience but are not blocking | 99.9%               | ~43.8 minutes        | Search, recommendations, notifications, impact dashboards, reporting                       |

### 1.2 Measurement

- Availability is measured as the percentage of successful requests (HTTP 2xx/3xx) divided by total requests, excluding planned maintenance windows.
- Planned maintenance windows must be announced at least 72 hours in advance and may not exceed 60 minutes per month.
- Tier 1 services may not have planned maintenance windows — all maintenance must be performed with zero-downtime deployment techniques.

### 1.3 SLA vs SLO vs SLI

| Term                          | Definition                                                          | Owner                               |
| ----------------------------- | ------------------------------------------------------------------- | ----------------------------------- |
| SLI (Service Level Indicator) | The metric being measured (e.g., request success rate, latency p99) | Engineering team owning the service |
| SLO (Service Level Objective) | The internal target for each SLI (the targets in Section 1.1)       | Engineering leadership              |
| SLA (Service Level Agreement) | The external commitment to users, with consequences for breach      | Product and business leadership     |

SLOs must be stricter than SLAs.
The gap between SLO and SLA is the error budget — the margin within which the team can deploy, experiment, and take calculated risks.

**External SLA**: The platform commits to **99% availability** (measured monthly) across all user-facing services.
This gives a substantial error budget gap — for example, a Tier 1 service with a 99.99% SLO and a 99% SLA has an error budget of ~0.99% of monthly request volume before the external commitment is breached.

---

## 2. Failover Strategies

### 2.1 Failover Architecture

> **Decision**: Active-passive failover topology.
> Active-passive is simpler to reason about and avoids the data consistency challenges of active-active.
> Given the scale of this platform, the marginally higher failover time is acceptable.
> Note: the local demo does not implement failover — this is theatre for production readiness documentation.

### 2.2 Failover Requirements

- **Automatic detection**: Failover must be triggered automatically — no human intervention required to detect a failure and initiate recovery.
- **Failover time**: Tier 1 services must complete failover within 60 seconds.
  Tier 2 services within 5 minutes.
  Tier 3 services within 15 minutes.
- **Data consistency**: Failover must not result in data loss for committed transactions.
  In-flight transactions at the moment of failure must be recoverable or safely failed with appropriate user notification.
- **Failback**: After a failover event, returning to the primary must be a controlled, tested operation — not an automatic bounce-back.

### 2.3 Redundancy Requirements

- No single point of failure exists for Tier 1 or Tier 2 services.
- Every Tier 1 service runs a minimum of two independent instances at all times.
- Database and persistent storage for Tier 1 services must have synchronous or near-synchronous replication.

---

## 3. Disaster Recovery

### 3.1 RPO and RTO Targets

| Tier                         | RPO (Recovery Point Objective)                | RTO (Recovery Time Objective) |
| ---------------------------- | --------------------------------------------- | ----------------------------- |
| Tier 1 — Financial Critical  | 0 (zero data loss for committed transactions) | 15 minutes                    |
| Tier 2 — Core Platform       | 5 minutes                                     | 30 minutes                    |
| Tier 3 — Supporting Services | 1 hour                                        | 4 hours                       |

### 3.2 Disaster Recovery Plan Requirements

- A documented disaster recovery plan must exist for every Tier 1 and Tier 2 service.
- The plan must include: trigger conditions, step-by-step recovery procedures, communication templates, and responsible parties.
- DR plans must be reviewed and updated at least quarterly.

### 3.3 DR Testing

- Full disaster recovery drills must be conducted at least quarterly for Tier 1 services and semi-annually for Tier 2 services.
- DR drills must be conducted in a production-equivalent environment (per [Engineering Standard](L2-002), Section 7.1).
- Drill results (actual RPO, actual RTO, issues discovered) must be documented and any gaps remediated before the next drill.

---

## 4. Backup Policies

Backup implementation must coordinate with the data classification and retention policies defined in [Data Management](L3-004).

### 4.1 Backup Frequency

| Data Type                  | Backup Frequency                         | Retention Period                                                                |
| -------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------- |
| Financial transaction data | Continuous (real-time replication)       | As defined in [Data Management](L3-004) — minimum 7 years for financial records |
| User account data          | Every 6 hours                            | As defined in [Data Management](L3-004)                                         |
| Proposal data              | Every 6 hours                            | As defined in [Data Management](L3-004)                                         |
| Audit logs                 | Continuous (append-only, replicated)     | As defined in [Audit](L3-006)                                                   |
| Application configuration  | On every change (version-controlled)     | Indefinite (in version control)                                                 |
| Infrastructure state       | On every change (infrastructure-as-code) | Indefinite (in version control)                                                 |

### 4.2 Backup Integrity

- Every backup must be verified via automated integrity checks (checksum validation) immediately after creation.
- Backup restoration must be tested at least monthly for Tier 1 data and quarterly for Tier 2 data.
- A backup that has not been tested is not a backup — it is a hope.

### 4.3 Backup Security

- Backups must be encrypted at rest using the same encryption standards as live data (AES-256, per [Engineering Standard](L2-002), Section 1.1).
- Backup access must be restricted to authorised personnel and logged in the audit trail (per [Audit](L3-006)).
- Backups must be stored in a geographically separate location from the primary data.

---

## 5. Circuit Breaker Patterns

External dependencies will fail.
The question is not *if* but *when* and *how gracefully* the platform handles it.

### 5.1 Circuit Breaker Requirements

Every call to an external dependency (payment gateways, KYC providers, email services, search infrastructure) must be wrapped in a circuit breaker.

Circuit breakers must implement three states:

| State         | Behaviour                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------- |
| **Closed**    | Requests pass through normally. Failures are counted.                                           |
| **Open**      | Requests fail immediately without calling the dependency. A fallback response is returned.      |
| **Half-Open** | A limited number of probe requests are allowed through to test if the dependency has recovered. |

### 5.2 Circuit Breaker Configuration

> **Note**: Specific threshold values should be tuned per dependency based on observed behaviour.
> The following are starting defaults:

| Parameter                      | Default                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| Failure threshold to open      | 5 consecutive failures or >50% failure rate over 30 seconds |
| Open duration before half-open | 30 seconds                                                  |
| Half-open probe count          | 3 requests                                                  |
| Success threshold to close     | 3 consecutive successes in half-open state                  |
| Call timeout                   | 5 seconds for Tier 1 dependencies, 10 seconds for Tier 2/3  |

### 5.3 Bulkhead Isolation

External dependency calls must be isolated so that a failure in one dependency does not exhaust the resources (threads, connections, memory) available for other operations.

- Each external dependency must have its own connection pool with defined limits.
- Queue depth limits must be set to prevent unbounded request queueing.
- Resource exhaustion in one dependency integration must not cascade to other services.

---

## 6. Health Check Contract

Implements [Engineering Standard](L2-002), Section 6.3.

### 6.1 Endpoint Specification

Every service must expose the following health check endpoints:

| Endpoint            | Purpose                                                                        | Authentication                                         |
| ------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `GET /health/live`  | Liveness — confirms the process is running and can accept TCP connections      | None (per [Engineering Standard](L2-002), Section 5.4) |
| `GET /health/ready` | Readiness — confirms the service and its critical dependencies are functioning | None                                                   |

### 6.2 Response Format

```json
{
  "status": "healthy | degraded | unhealthy",
  "service": "<service-name>",
  "version": "<deployed-version>",
  "timestamp": "<ISO 8601>",
  "checks": [
    {
      "name": "<dependency-name>",
      "status": "healthy | degraded | unhealthy",
      "latency_ms": 12,
      "message": "<optional human-readable detail>"
    }
  ]
}
```

### 6.3 Health Check Rules

- Liveness checks must not test downstream dependencies — they confirm only that the process is responsive.
- Readiness checks must test all critical dependencies (database, cache, essential external services).
- Health checks must complete within 5 seconds.
  A health check that times out is treated as unhealthy.
- Health checks must not have side effects (no writes, no state mutations).
- A service reporting `degraded` is still accepting traffic but operating with reduced capability (e.g., a non-critical dependency is unavailable).

---

## 7. Graceful Degradation Modes

When a dependency fails, the platform must degrade gracefully rather than fail completely.
Users must receive clear communication about what is and is not available.

### 7.1 Degradation Scenarios

| Scenario                              | Impact                           | Degradation Behaviour                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Payment gateway down**              | Cannot process new contributions | Display maintenance message on contribution flow. Existing proposal pages remain browsable. Queue contribution intents for retry when gateway recovers (with user consent). Queued intents expire after **2 minutes** — if the gateway has not recovered, the user is notified that their contribution was not processed and invited to try again later. |
| **KYC provider unreachable**          | Cannot verify new identities     | Allow account creation to proceed. Queue KYC verification. Restrict actions requiring verified identity until verification completes. Notify user of delay.                                                                                                                                                                                              |
| **Search infrastructure unavailable** | Cannot search proposals          | Fall back to category browsing and curated collections. Hide search UI or display "temporarily unavailable" message. All other platform functions continue normally.                                                                                                                                                                                     |
| **Email/notification service down**   | Cannot send notifications        | Queue notifications for retry. Critical notifications (payment confirmations, security alerts) must have a secondary delivery channel or be surfaced in-app.                                                                                                                                                                                             |
| **Database read replica down**        | Read performance degraded        | Route reads to primary (with increased latency). Monitor primary load. Alert immediately for capacity planning.                                                                                                                                                                                                                                          |
| **Cache layer down**                  | Response times increase          | Serve requests directly from database. Accept higher latency. Apply rate limiting if database load approaches capacity.                                                                                                                                                                                                                                  |

### 7.2 Degradation Principles

- Users must never see a raw error page.
  Every failure mode has a designed, branded response (per [Brand Standard](L2-001)).
- Financial transactions must fail safely — a user must never be charged without confirmation of the contribution being recorded.
- The system must communicate its state honestly.
  "Something went wrong" is not acceptable.
  "Payments are temporarily unavailable — your contribution has not been charged" is.

---

## 8. Alerting and Escalation Policies

Implements [Engineering Standard](L2-002), Section 6.5.

### 8.1 Alert Severity Levels

| Severity          | Criteria                                                                   | Response Time                | Notification Channel                                         |
| ----------------- | -------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------ |
| **P1 — Critical** | Tier 1 service is down or data integrity is at risk                        | Immediate (within 5 minutes) | Page on-call engineer + escalation to engineering leadership |
| **P2 — High**     | Tier 2 service is down or Tier 1 is degraded                               | Within 15 minutes            | Page on-call engineer                                        |
| **P3 — Medium**   | Tier 3 service is down or Tier 2 is degraded, or SLO burn rate is elevated | Within 1 hour                | Notify on-call engineer via team channel                     |
| **P4 — Low**      | Non-urgent anomalies, capacity warnings, approaching thresholds            | Next business day            | Team channel notification                                    |

### 8.2 Alert Thresholds

These thresholds implement the baseline defined in [Engineering Standard](L2-002), Section 6.5:

| Condition                                               | Threshold                                          | Severity                                 |
| ------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------- |
| Error rate exceeds 2x baseline for 5 minutes            | Per-service baseline, measured over rolling 7 days | P2 (P1 if Tier 1 service)                |
| p99 latency exceeds SLO for 5 minutes                   | Per-service SLO target                             | P2 (P1 if Tier 1 service)                |
| Health check fails 3 consecutive times                  | Any service                                        | P2 (P1 if Tier 1 service)                |
| Dependency health check failure                         | Any critical dependency                            | P3 (P2 if dependency serves Tier 1 flow) |
| Error budget burn rate >2% per hour                     | Per-service monthly error budget                   | P3                                       |
| Disk/memory/CPU >85% utilisation for 15 minutes         | Any service                                        | P3                                       |
| Error budget >50% consumed with >50% of month remaining | Monthly budget calculation                         | P4                                       |

### 8.3 Escalation Policy

| Time Since Alert                  | Action                                                                    |
| --------------------------------- | ------------------------------------------------------------------------- |
| 0 minutes                         | On-call engineer paged                                                    |
| 15 minutes (P1) / 30 minutes (P2) | If not acknowledged, escalate to secondary on-call                        |
| 30 minutes (P1) / 1 hour (P2)     | If not resolved or actively mitigated, escalate to engineering leadership |
| 1 hour (P1)                       | If not resolved, incident commander engaged, status page updated          |

### 8.4 On-Call Requirements

- An on-call rotation must be maintained for all Tier 1 and Tier 2 services.
- On-call engineers must be reachable within 5 minutes and able to begin investigation within 15 minutes.
- On-call handoff must include a summary of active alerts, recent deployments, and known issues.

---

## 9. Incident Classification and Response

The [Product Vision & Mission](L1-001) sets targets of MTTD (Mean Time to Detect) < 15 minutes and MTTR (Mean Time to Resolve) < 4 hours.

### 9.1 Incident Severity Classification

| Severity  | Definition                                                                                                  | MTTD Target  | MTTR Target |
| --------- | ----------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| **SEV-1** | Complete outage of a Tier 1 service, data breach, or financial data integrity issue                         | < 5 minutes  | < 1 hour    |
| **SEV-2** | Partial outage of Tier 1, complete outage of Tier 2, or significant performance degradation affecting users | < 10 minutes | < 2 hours   |
| **SEV-3** | Tier 3 service outage, minor performance degradation, or non-critical feature failure                       | < 15 minutes | < 4 hours   |
| **SEV-4** | Cosmetic issues, minor bugs, or issues affecting a small number of users                                    | < 1 hour     | < 24 hours  |

### 9.2 Incident Response Process

1. **Detection** — Automated alerting (Section 8) or user report.
1. **Triage** — On-call engineer classifies severity and pages additional responders if needed.
1. **Mitigation** — Immediate actions to restore service (rollback, failover, feature flag disable).
   Mitigation takes priority over root cause analysis.
1. **Communication** — Status page update for SEV-1 and SEV-2.
   Internal stakeholder notification for all severities.
1. **Resolution** — Root cause identified and permanent fix applied.
1. **Post-Incident Review** — Blameless post-mortem conducted within 48 hours for SEV-1 and SEV-2, within 1 week for SEV-3.

### 9.3 Post-Incident Review Requirements

- Post-incident reviews are blameless.
  The goal is to improve the system, not to assign fault.
- Every review must produce: a timeline, contributing factors, what went well, what could be improved, and concrete action items with owners and due dates.
- Action items from post-incident reviews are tracked to completion.
- Recurring incidents indicate a systemic issue and must be escalated to engineering leadership for structural remediation.

---

## Interface Contracts

### With [Architecture](L3-001)

- This spec defines *what* availability and failover targets must be met.
  [Architecture](L3-001) defines *how* — the infrastructure topology, deployment model, and technology choices that achieve these targets.
- Health check endpoint paths and response format defined here must be implemented by every service defined in [Architecture](L3-001).

### With [Security](L3-002)

- Incident response for security incidents (data breaches, unauthorised access) follows the process in Section 9, with additional steps defined in [Security](L3-002).
- Backup encryption requirements (Section 4.3) implement the encryption invariants from [Engineering Standard](L2-002), Section 1.1.

### With [Data Management](L3-004)

- Backup frequency and retention (Section 4) must align with the data classification and retention policies defined in [Data Management](L3-004).
- RPO targets (Section 3.1) constrain the replication and backup strategies chosen in [Data Management](L3-004).

### With [Audit](L3-006)

- Incident response actions (Section 9) must be logged in the audit trail as defined in [Audit](L3-006).
- Backup access (Section 4.3) must be audit-logged.

### With [Payments](L4-004)

- Circuit breaker behaviour for payment gateway failures (Section 5) defines the reliability contract that [Payments](L4-004) must implement.
- Tier 1 availability targets (Section 1.1) apply to all payment flows.

### With [Engineering Standard](L2-002)

- Section 6.3 (Health Checks) — this spec defines the detailed contract.
- Section 6.5 (Alerting Baseline) — this spec defines the thresholds and escalation policies.
- Section 4.5 (Deployment Gates) — this spec defines rollback time targets that deployment processes must satisfy.

---

## Resolved Decisions

1. **Active-passive failover** — Active-passive topology selected.
   Simpler to operate and reason about; the availability trade-off is acceptable at this platform's scale.
   See Section 2.1.
1. **Error budget policy enforcement** — Yes. When the monthly error budget for a service is exhausted, non-essential deployments to that service are frozen until the budget replenishes at the start of the next calendar month.
   Exceptions: security patches and critical bug fixes (SEV-1/SEV-2 remediations) may deploy regardless of error budget status, with engineering leadership approval.
1. **Status page provider** — [Atlassian Statuspage](https://www.atlassian.com/software/statuspage).
   Widely adopted, integrates with incident management tooling, and provides subscriber notifications via email and SMS.
1. **On-call tooling** — [PagerDuty](https://www.pagerduty.com/).
   Provides paging, escalation policies, on-call scheduling, and integrates with monitoring and status page tooling.
1. **DR drill scope** — Individual service recovery only.
   Full region failover drills are disproportionately expensive and complex for the current scale.
   This decision should be revisited if the platform grows to multi-region deployment.
1. **Payment queue expiry** — 2 minutes.
   Queued contribution intents expire after 2 minutes if the payment gateway has not recovered.
   See Section 7.1 for the full degradation behaviour.
1. **SLA commitment** — 99% availability (two nines) committed externally.
   This gives a meaningful gap between the internal SLOs (Section 1.1) and the external SLA, providing a healthy error budget for deployments and experimentation.

---

## Change Log

| Date       | Version | Author | Summary                                                                                                                                                                                                                                                  |
| ---------- | ------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| March 2026 | 0.1     | —      | Initial stub. Availability targets (three tiers), failover requirements, DR plan (RPO/RTO), backup policies, circuit breaker patterns, health check contract, graceful degradation modes, alerting and escalation, incident classification and response. |
| March 2026 | 1.0     | —      | All open questions resolved. Active-passive failover, error budget freeze policy, Statuspage, PagerDuty, individual-service DR drills, 2-minute payment queue expiry, 99% external SLA. Promoted to Approved.                                            |
