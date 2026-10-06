# ADR-0002: Audit Log Demo Simplification

> **Status**: Accepted
> **Date**: 2026-03-22
> **Deciders**: Engineering team

## Context

Spec L3-006 (`specs/tech/audit.md`) describes a production-grade immutable audit event stream
with the following capabilities:

- SHA-256 hash chaining across all audit events for tamper detection
- Batch verification of hash chain integrity
- Hot/warm/cold retention tiers (90-day hot, 1-year warm, 7-year cold archive)
- Anomaly-detection rules (e.g., flagging unusual disbursement patterns)
- Audit-access logging (who read the audit log and when)

The Campaign Lifecycle milestone required an auditable trail — reviewers approving campaigns,
admins verifying milestones, settlement disbursements — recorded in the database during the
workshop demo. Implementing the full production event-sourcing infrastructure (hash chaining, tiered
storage, anomaly detection) was out of scope for a local development demo.

Several separate audit tables emerged incrementally across the milestone issues rather than
through a single upfront design pass.

## Decision

The demo writes audit rows to three tables instead of the single spec-aligned event stream
(column lists per `packages/server/db/schema.sql`):

- **`audit_log`** — JSONB table (`event_type`, `campaign_id`, `milestone_id`, `actor_id`,
  `payload`, `created_at`). Written by `insertAuditLog` in
  `packages/server/src/campaigns/queries.ts` for settlement and milestone events (evidence
  submission, verification, return, campaign completion, settlement cancellation). No hash
  chaining or structured schema enforcement.
- **`campaign_audit_events`** — Structured table (`campaign_id`, `event_type`, `actor_id`,
  `previous_state`, `new_state` as text, `metadata` JSONB, `occurred_at`). Written by
  `createAuditEvent` and by the campaign create/submit queries for review workflow
  transitions (creation, submission, claim, approval, rejection, resubmission).
- **`audit_events`** — Closest to the L3-006 schema (`timestamp`, `level`, `correlation_id`,
  `service`, `message`, `event_type`, `actor_id`, `actor_type`, `action`, `resource_type`,
  `resource_id`, `outcome`, `previous_state`/`new_state` JSONB, `rationale`). Written by
  `writeAuditEvent` in `packages/server/src/campaigns/audit.ts` for campaign lifecycle events
  (launch, contributions, status changes, deadline expiry, cancellation). No hash
  chaining.

A fourth table, **`campaign_audit_log`** (`campaign_id`, `previous_state`, `new_state`,
`actor_id`, `rationale`, `created_at`), is created by an early migration but is not written by
current server code.

All writes are plain `INSERT` statements issued after the state change, not in the same
transaction. `writeAuditEvent` is best-effort: it logs and swallows insert errors. The other
two helpers let insert errors propagate to the request's error handler. There is no API
endpoint or frontend view that reads the audit tables.

No migration was made to unify the tables; each was introduced when a feature needed it.

## Rationale

- The demo value comes from *recording* what happened and when, so it can be inspected in the
  database — not from hash-chain integrity or tamper-proof guarantees.
- Adding SHA-256 chaining, tiered retention, and anomaly detection during a workshop-focused
  milestone would have shifted effort away from the core campaign lifecycle workflows being
  demonstrated.
- Each table was added in context of a specific feature; unifying them retrospectively would
  have introduced risk without workshop-visible benefit.
- The multi-table divergence is confined to the server layer; no API or frontend code reads
  the audit tables.

## Alternatives Considered

**Single spec-aligned table from the start** — would have required upfront schema design before
the full event taxonomy was known. The incremental milestone approach meant event shapes were
discovered as features were built, making a locked-down schema premature.

**Unified migration at end of milestone** — merging the three tables into one `audit_events`
table after the fact was considered but deferred: it would change foreign key relationships,
require data migration logic, and add no demo-visible value.

**Hash chaining on `audit_events` only** — adding SHA-256 chaining to the spec-aligned table
alone was considered. Rejected because it would create an inconsistent audit surface (some
events chained, others not) that would be more confusing than the three-table status quo.

## Consequences

**Positive**:

- Milestone delivered on schedule with audit rows recorded for key lifecycle actions.
- Each table is simple and independently understandable.
- No single point of failure in the audit pipeline during the workshop.

**Negative**:

- Three tables with overlapping purposes increases cognitive overhead for new contributors.
- Querying a unified audit history requires UNION across all three written tables.
- The divergence from L3-006 means the demo audit layer cannot be promoted to production
  without a full rewrite.

**What production requires** (not implemented in the demo):

- SHA-256 hash chaining: each event record includes a hash of the previous event's hash plus
  its own payload, enabling tamper detection across the full log.
- Batch tamper verification: a background job periodically re-computes hashes and alerts on
  any chain break.
- Hot/warm/cold retention tiers: recent events in fast storage (hot), older events in cheaper
  storage (warm), archived events in long-term cold storage — enforced by automated migration
  jobs.
- Anomaly-detection rules: e.g., multiple disbursements in a short window, disbursements
  outside business hours, or unusually large single-event payloads trigger alerts.
- Audit-access logging: all reads of the audit log are themselves logged (who queried, what
  time range, from which IP).
