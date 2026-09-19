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

The Proposal Lifecycle milestone required an auditable trail — reviewers approving proposals,
admins verifying milestones, settlement disbursements — visible in the UI during the workshop
demo. Implementing the full production event-sourcing infrastructure (hash chaining, tiered
storage, anomaly detection) was out of scope for a local development demo.

Three separate audit tables emerged incrementally across the milestone issues rather than through
a single upfront design pass.

## Decision

The demo uses three audit tables instead of the single spec-aligned event stream:

- **`audit_log`** — Legacy JSONB append-only table. Used for settlement and milestone events
  added in earlier issues. Stores unstructured event payloads as JSONB; no hash chaining or
  structured schema enforcement.
- **`proposal_audit_events`** — Structured event table with `previous_state` and `new_state`
  columns. Used for proposal workflow transitions (status changes). Added mid-milestone to
  support a richer audit UI showing before/after state diffs.
- **`audit_events`** — Spec-aligned table matching the L3-006 schema (typed `event_type`,
  `entity_id`, `actor_id`, `payload` JSONB). Used for proposal lifecycle events introduced in
  later issues. Closest to the production design but without hash chaining.

No migration was made to unify the three tables; each was introduced when a feature needed it.

## Rationale

- The demo value comes from *event visibility* in the admin UI — reviewers and admins can see
  what happened and when — not from hash-chain integrity or tamper-proof guarantees.
- Adding SHA-256 chaining, tiered retention, and anomaly detection during a workshop-focused
  milestone would have shifted effort away from the core proposal lifecycle workflows being
  demonstrated.
- Each table was added in context of a specific feature; unifying them retrospectively would
  have introduced risk without workshop-visible benefit.
- The three-table divergence is confined to the server layer; the frontend audit views work
  identically regardless of which backing table supplies the events.

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

- Milestone delivered on schedule with full UI visibility into audit events.
- Each table is simple and independently understandable.
- No single point of failure in the audit pipeline during the workshop.

**Negative**:

- Three tables with overlapping purposes increases cognitive overhead for new contributors.
- Querying a unified audit history requires UNION across all three tables.
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
