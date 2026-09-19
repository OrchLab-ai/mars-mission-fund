# Audit Logging & Transparency

> **Spec ID**: L3-006
> **Version**: 0.2
> **Status**: Approved
> **Rate of Change**: Sprint-level / tech decisions
> **Depends On**: L1-001 (Product Vision & Mission), L2-002 (Engineering Standard), L3-001 (Architecture), L3-002 (Security)
> **Depended On By**: L4-002 (Proposal), L4-004 (Payments), L4-005 (KYC)

---

## 1. Purpose

> **Local demo scope**: The audit event schema, event categories, logging trigger rules, and the PostgreSQL event store integration are **real** — audit events are written as part of the CQRS/Event Sourcing pattern in the local demo. Tamper detection (hash chains), tiered storage, anomaly detection, regulatory reporting processes, and the access grant workflow are theatre. The local demo writes audit events to PostgreSQL with no archival or detection pipeline.
>
> The demo uses three audit tables added incrementally during the Proposal Lifecycle milestone: `audit_log` (legacy JSONB append-only, used for settlement and milestone events), `proposal_audit_events` (structured events with previous/new state, used for workflow transitions), and `audit_events` (spec-aligned table matching L3-006 schema, used for proposal lifecycle events). Hash chaining (SHA-256), batch tamper verification, hot/warm/cold retention tier enforcement, and anomaly-detection rules are production requirements not implemented in the demo. See [ADR-0002](../adrs/0002-audit-log-demo-simplification.md) for the full architectural decision record.

This spec governs the audit logging architecture for Mars Mission Fund: what gets logged, how audit events are structured, how they are stored immutably, who can access them, how long they are retained, and how they support regulatory compliance and anomaly detection.

This spec **implements**:

- The "Transparency as Currency" principle from the [Product Vision & Mission](L1-001).
- The logging and auditability invariants from [Engineering Standard](L2-002), Section 1.7.
- The structured logging baseline from [Engineering Standard](L2-002), Section 6.1.

This spec does **not** cover:

- Operational logging for debugging and performance monitoring — that is the observability baseline in [Engineering Standard](L2-002), Section 6.
- Alerting thresholds and incident response escalation — those are defined in [Reliability](L3-003).
- Data classification and general retention policies — those are defined in [Data Management](L3-004). This spec references that classification scheme and defines audit-specific retention periods.
- Application-level business metrics and analytics — those belong in individual L4 domain specs.

---

## 2. Inherited Constraints

From [Engineering Standard](L2-002):

- **Section 1.7 — Logging & Auditability**: Every state mutation is logged with timestamp, actor identity, action performed, and affected resource. Logs are append-only and immutable. No mechanism exists to delete or modify audit log entries. Sensitive data is never logged.
- **Section 6.1 — Structured Logging**: All logs are JSON-formatted with mandatory fields: `timestamp`, `level`, `correlation_id`, `service`, `message`, `context`.
- **Section 6.2 — Correlation IDs**: Every request is assigned a unique correlation ID at the edge that propagates through all services and log entries.
- **Section 1.2 — Data Access**: All queries use parameterised queries. Audit log queries are no exception.
- **Section 1.3 — Secrets Management**: Secrets never appear in log output.
- **Section 1.1 — Encryption**: Audit data is encrypted at rest (AES-256) and in transit (TLS 1.3).

From [Security](L3-002):

- Audit log access is governed by the RBAC model defined in [Security](L3-002).
- Tamper detection mechanisms must align with the integrity controls defined in [Security](L3-002).

---

## 3. Audit Event Schema

Audit events extend the structured logging baseline from [Engineering Standard](L2-002), Section 6.1 with audit-specific fields.

### 3.1 Base Fields (inherited from L2-002 Section 6.1)

| Field            | Type                            | Description                                                            |
| ---------------- | ------------------------------- | ---------------------------------------------------------------------- |
| `timestamp`      | string (ISO 8601 with timezone) | When the event occurred                                                |
| `level`          | string                          | Always `AUDIT` for audit events (distinct from operational log levels) |
| `correlation_id` | string (UUID)                   | Request correlation ID from the edge                                   |
| `service`        | string                          | Name of the emitting service                                           |
| `message`        | string                          | Human-readable description of the auditable action                     |
| `context`        | object                          | Structured metadata (see audit-specific fields below)                  |

### 3.2 Audit-Specific Fields

| Field            | Type          | Required    | Description                                                                                 |
| ---------------- | ------------- | ----------- | ------------------------------------------------------------------------------------------- |
| `event_type`     | string (enum) | Yes         | Category of audit event (see Section 4)                                                     |
| `actor_id`       | string        | Yes         | Identity of the user or service principal that performed the action                         |
| `actor_type`     | string (enum) | Yes         | `user`, `service`, `system`, `admin`                                                        |
| `action`         | string        | Yes         | The specific action performed (e.g., `proposal.create`, `payment.disburse`, `user.login`)   |
| `resource_type`  | string        | Yes         | Type of resource affected (e.g., `proposal`, `payment`, `account`)                          |
| `resource_id`    | string        | Yes         | Identifier of the affected resource                                                         |
| `outcome`        | string (enum) | Yes         | `success`, `failure`, `denied`                                                              |
| `ip_address`     | string        | Conditional | Client IP address (required for user-initiated events, omitted for system events)           |
| `user_agent`     | string        | Conditional | Client user agent (required for user-initiated events)                                      |
| `previous_state` | object        | Conditional | Snapshot of relevant fields before the mutation (required for state changes)                |
| `new_state`      | object        | Conditional | Snapshot of relevant fields after the mutation (required for state changes)                 |
| `reason`         | string        | Conditional | Reason for the action, where applicable (e.g., denial reason, admin override justification) |
| `metadata`       | object        | No          | Additional structured context specific to the event type                                    |

### 3.3 Sensitive Data Rules

Per [Engineering Standard](L2-002), Section 1.7: sensitive data must never appear in audit log entries.

- `previous_state` and `new_state` must use resource identifiers, not raw personal data.
- Fields containing PII, financial data, or credentials must be redacted or replaced with tokenised references before logging.
- The data classification scheme in [Data Management](L3-004) defines what constitutes sensitive data.

**Redaction strategy: Reference-only.** Audit events store resource identifiers (e.g., `actor_id`, `resource_id`), never raw PII. This aligns naturally with the CQRS/Event Sourcing pattern established in [Architecture](L3-001), Section 6.2 — events already reference aggregates by ID. When human-readable details are needed (e.g., for an investigation), the audit query service joins against current read models at query time. Sensitive fields such as email, name, and address are never present in the event payload.

---

## 4. What Gets Logged

Per [Engineering Standard](L2-002), Section 1.7: every state mutation in the system is logged.
Beyond state mutations, the following event categories are mandatory.

### 4.1 Event Categories

| Category                 | Event Type  | Examples                                                                                                                                |
| ------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication**       | `auth`      | Login success/failure, logout, MFA challenge/success/failure, session creation/expiry, token refresh, password reset request/completion |
| **Authorisation**        | `authz`     | Permission check granted/denied, role assignment/removal, privilege escalation, access to restricted resources                          |
| **State Mutation**       | `mutation`  | Any create, update, or delete operation on a domain entity (proposal, payment, account, KYC record)                                     |
| **Data Access**          | `access`    | Read access to sensitive data (PII, financial records, KYC documents) — not every read, only reads of classified-sensitive resources    |
| **Configuration Change** | `config`    | Feature flag changes, environment variable updates, service configuration changes, deployment events                                    |
| **Admin Action**         | `admin`     | Any action performed with elevated privileges — user impersonation, manual overrides, data corrections, bulk operations                 |
| **Financial Event**      | `financial` | Payment initiation, payment completion, refund, escrow hold/release, disbursement, reconciliation                                       |
| **KYC Event**            | `kyc`       | Document upload, verification status change, sanctions screening result, manual review decision                                         |
| **System Event**         | `system`    | Service startup/shutdown, scheduled job execution, automated retention enforcement, audit log export                                    |

### 4.2 Logging Trigger Rules

- **State mutations**: Logged automatically by the data access layer. Application code does not manually emit audit events for state changes — the data access layer defined in [Engineering Standard](L2-002), Section 1.2 handles this.
- **Authentication and authorisation**: Logged by the auth middleware defined in [Security](L3-002).
- **Data access**: Logged by the data access layer for any query touching resources classified as sensitive in [Data Management](L3-004).
- **Admin actions**: Logged explicitly by the admin tooling layer. All admin actions require a `reason` field.
- **Financial events**: Logged by the payments integration layer defined in [Payments](L4-004). Both the initiation and the outcome of every financial operation are logged as separate events.

---

## 5. Immutability Guarantees

Audit logs are the foundation of trust and regulatory compliance.
Their integrity is non-negotiable.

### 5.1 Append-Only Storage

- Audit events are written to an append-only store.
- No API, tool, or administrative interface permits modification or deletion of audit log entries.
- The storage layer must enforce append-only semantics at the infrastructure level, not just at the application level.

**Storage technology: Immutable event stream in PostgreSQL (Aurora).** Audit events are stored as append-only rows in the same PostgreSQL event store used by the CQRS/Event Sourcing infrastructure ([Architecture](L3-001), Section 6.2). Delete and update operations are prevented by database-level row security policies and the application data access layer. This reuses existing infrastructure, keeps the stack simple, and provides full SQL query capabilities over audit data.

### 5.2 Tamper Detection

- Every audit event includes a cryptographic hash that chains it to the previous event in the same stream (hash chain).
- Periodic integrity verification runs to detect gaps, out-of-order entries, or hash chain breaks.
- Integrity verification failures trigger an immediate security alert through the incident response process defined in [Reliability](L3-003).

**Hash chain: SHA-256, per aggregate stream, daily batch verification.** Each audit event includes a `previous_hash` field containing the SHA-256 hash of the preceding event in the same aggregate stream. A daily scheduled job verifies chain integrity across all streams and raises a security alert on any gap, reorder, or hash mismatch. This balances tamper detection strength with low write overhead — suitable for a workshop-scale system.

### 5.3 Backup and Redundancy

- Audit logs are replicated to a geographically separate location.
- Backup copies are subject to the same immutability and access control guarantees as primary copies.
- Backup integrity is verified on a defined schedule.

---

## 6. Retention Periods

Retention periods are defined by event category and regulatory requirement.
General data retention policies are defined in [Data Management](L3-004); this section defines audit-specific retention that may exceed general retention periods due to regulatory obligations.

### 6.1 Retention Schedule

| Event Category                           | Minimum Retention              | Rationale                                           |
| ---------------------------------------- | ------------------------------ | --------------------------------------------------- |
| Financial events                         | 7 years                        | PCI DSS, Australian tax record-keeping requirements |
| KYC events                               | 7 years after relationship end | AML/CTF Act record-keeping obligations              |
| Authentication events                    | 2 years                        | Security investigation window                       |
| Authorisation events                     | 2 years                        | Security investigation window                       |
| Data access events                       | 2 years                        | GDPR data access audit trail                        |
| Admin actions                            | 7 years                        | Regulatory and compliance audit trail               |
| Configuration changes                    | 2 years                        | Change management audit trail                       |
| State mutations (financial entities)     | 7 years                        | Aligned with financial event retention              |
| State mutations (non-financial entities) | 2 years                        | Operational audit trail                             |
| System events                            | 1 year                         | Operational diagnostics                             |

### 6.2 Retention Enforcement

- Retention enforcement is automated. No manual deletion of audit data is permitted.
- When retention periods expire, data is purged through an automated process that itself is audit-logged (event type: `system`).
- Purge operations must respect legal hold requirements — if audit data is subject to a legal hold, retention is extended indefinitely until the hold is lifted.

**Retention enforcement: Tiered storage.** Audit data moves through tiers based on age: hot (PostgreSQL, last 90 days — immediately queryable), cold (S3 export, 90 days to end of retention — queryable with higher latency), purge (automated deletion after retention period expires). Tier transitions and purge operations are executed by scheduled jobs and are themselves audit-logged. Legal holds suspend purge for affected data until the hold is lifted.

---

## 7. Access Controls on Audit Data

### 7.1 Principles

- **Separation of duty**: The people and services whose actions are audited must not be able to modify or delete audit records.
- **Least privilege**: Access to audit data is restricted to roles with a demonstrated need.
- **Audit the auditors**: Access to audit data is itself audited (event type: `access`).

### 7.2 Access Roles

| Role                                    | Read Access                                    | Write Access                        | Notes                                                      |
| --------------------------------------- | ---------------------------------------------- | ----------------------------------- | ---------------------------------------------------------- |
| Application services                    | No direct read                                 | Append only (via audit logging SDK) | Services emit audit events but cannot query them           |
| Engineers (on-call / incident response) | Scoped read (own service, limited time window) | None                                | Access granted per-incident, time-limited, logged          |
| Security team                           | Full read                                      | None                                | For security investigations and compliance audits          |
| Compliance / audit team                 | Full read                                      | None                                | For regulatory reporting and external audit support        |
| Platform administrators                 | Full read                                      | None                                | No one has write/delete access — by design                 |
| External auditors                       | Scoped read (via export)                       | None                                | Read access via exported reports, not direct system access |

### 7.3 Access Mechanism

- Audit data is queried through a dedicated audit query service, not through direct database access.
- The audit query service enforces authentication, authorisation, and access logging for every query.
- Time-limited access grants for incident response are managed through the access control system defined in [Security](L3-002).

**Access grant workflow: Request AWS Prod Access.**

- **Read access**: No approval required. All audit query service reads are logged.
- **Elevated access** (access secrets or write to audit-adjacent systems): Requires automated approval via the access request system.
- **Maximum grant duration**: 8 hours, automatically revoked.
- **Implementation note**: This workflow is out of scope for the local-only demo. The design is recorded here for production readiness.

---

## 8. Regulatory Reporting

### 8.1 PCI DSS Audit Trail Requirements

Per PCI DSS requirements (applicable via [Payments](L4-004) and [Security](L3-002)):

- All access to cardholder data environments is logged.
- Audit trails are retained for at least one year, with a minimum of three months immediately available for analysis.
- Audit trail entries include user identification, type of event, date and time, success/failure indication, origination of event, and identity or name of affected data/system/resource.
- Audit trails are secured so they cannot be altered.
- Audit trails are reviewed at least daily (automated review via anomaly detection — see Section 9).

**PCI DSS scope: SAQ-A.** Mars Mission Fund does not store, process, or transmit credit card PANs — card processing is fully outsourced to the payment gateway. Under SAQ-A, PCI DSS audit trail requirements are minimal for card data. However, PII is stored and payment system integrations exist, so GDPR and Australian Privacy Act audit obligations (Sections 8.2 and 8.3) still apply in full. All payment events (initiation, completion, refund, disbursement) are audit-logged as `financial` events referencing tokenised payment identifiers, never raw card data.

### 8.2 GDPR Data Access Logs

Per GDPR requirements (applicable via [Security](L3-002) and [Data Management](L3-004)):

- All access to personal data is logged.
- Logs support responding to Data Subject Access Requests (DSARs) — the system must be able to produce a complete record of who accessed a data subject's personal data and when.
- Data access logs themselves are subject to GDPR retention limits — they must not be retained longer than necessary for their purpose, but must satisfy the minimum audit retention periods above.

### 8.3 Australian Privacy Act

- Audit logs support demonstrating compliance with Australian Privacy Principles (APPs).
- Access to audit data containing personal information of Australian residents is subject to the same data handling requirements as the underlying personal data.

**Australian Privacy Act: No additional requirements beyond GDPR handling.** No specific differences have been identified that require separate audit handling. The existing GDPR-aligned audit controls (data access logging, DSAR support, retention limits) satisfy Australian Privacy Principles. This will be revisited if specific regulatory guidance emerges.

---

## 9. Anomaly Detection

Audit logs are not just a compliance requirement — they are an active security signal.
The system must detect suspicious patterns in near-real-time and surface them to the security team.

### 9.1 Detection Baselines

The following patterns must be detected and alerted on:

| Pattern                                      | Description                                                                                     | Severity |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------- |
| Repeated authentication failures             | Multiple failed login attempts for the same account within a time window                        | High     |
| Unusual transaction patterns                 | Transactions outside normal volume, frequency, or amount ranges for a given account or proposal | High     |
| Privilege escalation attempts                | Authorisation denials followed by successful access to the same resource (potential bypass)     | Critical |
| Off-hours admin actions                      | Administrative actions performed outside normal business hours                                  | Medium   |
| Bulk data access                             | Unusually large volumes of sensitive data reads by a single actor in a short period             | High     |
| Geographic anomalies                         | Authentication or financial actions from unexpected geographic locations                        | Medium   |
| Configuration changes without change tickets | Configuration or feature flag changes that don't correlate with approved change records         | High     |

### 9.2 Detection Architecture

- Anomaly detection operates on the audit event stream in near-real-time.
- Detection rules are configurable and versioned alongside application code.
- Alerts are routed through the alerting infrastructure defined in [Reliability](L3-003).
- False positive rates are tracked and detection rules are tuned iteratively.

**Anomaly detection approach: Rule-based.** Explicit threshold rules as defined in the detection baselines table (Section 9.1). Rules are simple, transparent, and easy to tune. Statistical baseline detection is unnecessary for a workshop-scale system and adds implementation complexity without proportional benefit. Implementation is out of scope for the local-only demo; the rules are recorded here for production readiness.

### 9.3 Response Integration

- Anomaly detection alerts include sufficient context for the security team to begin investigation without querying additional systems.
- Critical-severity anomalies trigger automated containment actions as defined in the incident response process in [Security](L3-002) (e.g., temporary account lockout after repeated auth failures).

---

## 10. Audit Log Query Interface

### 10.1 Query Capabilities

The audit query service must support:

- **Filtering** by any combination of: time range, actor ID, actor type, event type, action, resource type, resource ID, outcome, correlation ID.
- **Full-text search** on the `message` and `reason` fields.
- **Aggregation** — counts and summaries grouped by any filterable dimension (e.g., "count of failed logins by actor in the last 24 hours").
- **Export** to structured formats (JSON, CSV) for external audit tool consumption and regulatory reporting.
- **Correlation trace reconstruction** — given a correlation ID, return the complete ordered sequence of audit events across all services for that request.

### 10.2 Performance Requirements

- Queries against recent data (last 30 days) must return results within seconds (specific SLA to be defined in [Reliability](L3-003)).
- Queries against archived data (beyond 30 days) may have higher latency but must complete within a defined timeout.
- The query interface must not impact the write performance of the audit logging pipeline.

**Query latency SLAs:**

- **Hot tier (last 90 days, PostgreSQL)**: Sub-second response times for filtered queries. This is the primary query target for investigations and operational use.
- **Cold tier (90 days+, S3 export)**: Up to 5 minutes for query results. Acceptable for compliance reporting and historical investigations.
- **Data freshness**: Audit events are queryable within 5 minutes of occurrence (see OQ-010). For most operations, freshness is sub-second due to the event sourcing pull-based model, but the 5-minute SLA accommodates SDK batching and read model projection delay.

The tiered storage boundaries (90-day hot/cold split) align with PCI DSS requirements for three months of immediately available audit data (Section 8.1).

### 10.3 Audit Logging SDK

Application services emit audit events through a shared SDK or library, not through direct writes to the audit store.

The SDK must:

- Enforce the audit event schema (Section 3).
- Automatically populate base fields (timestamp, correlation ID, service name) from the request context.
- Handle failures gracefully — audit logging failures must not cause the originating operation to fail, but must trigger an alert.
- Buffer and batch writes for performance, with a maximum acceptable delay before events reach the audit store.

**Maximum ingestion delay: 5 minutes.** Audit events must be queryable in the audit store within 5 minutes of the auditable action occurring. In practice, the event sourcing model delivers sub-second freshness for most events. The 5-minute ceiling accommodates SDK write batching and any transient delays in read model projection. Anomaly detection rules (Section 9) operate within this window.

---

## 11. Interface Contracts

### 11.1 Interface with Architecture (L3-001)

- The audit logging infrastructure (storage, query service, event streaming) is deployed as part of the platform architecture defined in [Architecture](L3-001).
- The audit event stream is a shared infrastructure component, not owned by any single domain service.

### 11.2 Interface with Security (L3-002)

- [Security](L3-002) defines the RBAC roles and permission model that governs access to audit data (Section 7.2 of this spec).
- [Security](L3-002) defines the incident response process that consumes anomaly detection alerts (Section 9.3 of this spec).
- Tamper detection mechanisms (Section 5.2) align with the integrity controls in [Security](L3-002).

### 11.3 Interface with Data Management (L3-004)

- [Data Management](L3-004) defines the data classification scheme that determines which data access events are audit-logged (Section 4.1, "Data Access" category).
- [Data Management](L3-004) defines general retention policies; this spec defines audit-specific retention that may exceed those policies (Section 6).
- Sensitive data redaction rules (Section 3.3) reference the classification in [Data Management](L3-004).

### 11.4 Interface with Reliability (L3-003)

- [Reliability](L3-003) defines the alerting infrastructure that routes anomaly detection alerts (Section 9.2).
- [Reliability](L3-003) defines the SLAs that govern audit query performance targets (Section 10.2).

### 11.5 Interface with Domain Specs (L4-002, L4-004, L4-005)

- **Proposal (L4-002)**: Proposal lifecycle state changes (submission, review, approval, funding milestones, completion, failure) are audit-logged as `mutation` and `financial` events. The proposal spec defines which state transitions are auditable and references this spec for the logging mechanism.
- **Payments (L4-004)**: All payment operations (initiation, completion, refund, escrow, disbursement) are audit-logged as `financial` events. The payments spec defines the specific payment events and references this spec for PCI DSS audit trail compliance.
- **KYC (L4-005)**: All identity verification events (document upload, verification result, sanctions screening, manual review decision) are audit-logged as `kyc` events. The KYC spec defines the specific KYC events and references this spec for AML/CTF record-keeping compliance.

---

## Change Log

| Date       | Version | Author | Summary                                                                                                                                                                                                                                                                                |
| ---------- | ------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| March 2026 | 0.1     | —      | Initial stub. Audit event schema, logging categories, immutability guarantees, retention schedule, access controls, regulatory reporting (PCI DSS, GDPR, Australian Privacy Act), anomaly detection baselines, query interface, and audit logging SDK.                                 |
| March 2026 | 0.2     | —      | Resolved all 10 open questions. Established reference-only redaction strategy, PostgreSQL event store (aligned with CQRS/ES from L3-001), SHA-256 hash chain with daily verification, tiered storage retention, SAQ-A PCI scope, rule-based anomaly detection, 5-minute ingestion SLA. |
