# Payment Processing

> **Spec ID**: L4-004
> **Version**: 0.3
> **Status**: Approved
> **Rate of Change**: Per feature / per release
> **Depends On**: L2-002 (Engineering Standard), L3-001 (Architecture), L3-002 (Security), L3-004 (Data Management), L3-006 (Audit)
> **Depended On By**: L4-002 (Proposal), L4-003 (Donor)

---

## 1. Purpose

> **Local demo scope**: The payment gateway abstraction layer, contribution state machine, and escrow ledger design are **real** — they demonstrate the architectural pattern in the local demo. The actual payment gateway is **stubbed** (no real money moves). Multi-approval disbursement workflow, daily reconciliation, and refund processing are theatre. The local demo simulates payment success/failure without a live gateway.
>
> The demo stub replaces live gateway calls with `console.log('[STUB] ...')` log lines at three points: fund disbursement (milestone verification), refund processing (settlement cancellation), and admin notification (evidence submission). No Stripe API keys, escrow accounts, or webhook handling are required. See [ADR-0003](../adrs/0003-stubbed-integrations.md) for the full rationale and what a production integration would require.

This spec governs all payment processing within Mars Mission Fund: how money enters the platform (contributions), how it is held (escrow), how it is released (milestone disbursement), and how it is returned (refunds).

**In scope**:

- Payment gateway integration and abstraction.
- Card tokenisation and PCI DSS scope management.
- Contribution processing (authorisation, capture, escrow hold).
- Escrow account structure and lifecycle.
- Milestone-based disbursement with multi-approval workflow.
- Refund handling (full and partial).
- Currency support.
- Transaction reconciliation.
- Tax receipt data generation.
- Financial reporting and admin dashboards.

**Out of scope**:

- Proposal lifecycle and milestone definition — governed by [Proposal](L4-002).
- Donor-facing contribution UI and discovery flows — governed by [Donor](L4-003).
- KYC verification process — governed by [KYC](L4-005).
  This spec receives KYC status as a gate; it does not perform verification.
- Identity and access management — governed by [Account](L4-001) and [Security](L3-002).

---

## 2. Inherited Constraints

### From [Engineering Standard](L2-002)

- **Section 1.1 (Encryption)**: All payment data encrypted in transit (TLS 1.3 minimum) and at rest (AES-256).
  Financial data is classified as sensitive under the data classification scheme.
- **Section 1.2 (Data Access)**: All database queries use parameterised queries via a data access layer.
  No raw SQL in payment service code.
- **Section 1.3 (Secrets Management)**: Gateway API keys, signing secrets, and webhook secrets managed through the secrets management service.
  Never stored in source code or configuration files.
- **Section 1.4 (Input Validation)**: All external input (webhook payloads, API requests, callback URLs) validated at the system boundary.
- **Section 1.5 (Authentication & Authorisation)**: Every payment API endpoint authenticated and authorised.
  MFA required for all financial actions (contributions, disbursements, refunds).
- **Section 1.7 (Logging & Auditability)**: Every payment state mutation logged with timestamp, actor, action, and affected resource.
  Sensitive financial data (card numbers, bank account details) never logged.
- **Section 2.4 (Abstraction Requirement)**: Payment gateway accessed through an internal adapter interface.
  No application code references the gateway vendor SDK directly.
- **Section 4.2 (Test Coverage)**: 100% coverage of success and failure paths for all payment flows (integration + end-to-end tests).
- **Section 4.5 (Deployment Gates)**: Production deployments to payment flows require a second approval from an engineer who did not author the change.

### From L3 Technical Specs

- **[Architecture](L3-001)**: Service boundaries, inter-service communication patterns, and data model constraints applicable to the payment service.
- **[Security](L3-002)**: PCI DSS compliance scope, threat model for payment flows, authentication mechanism for payment endpoints, and encryption key management.
- **[Data Management](L3-004)**: Data classification for financial records, retention policies for transaction data, and backup/recovery requirements for payment state.
- **[Audit](L3-006)**: Immutable audit trail for all payment events, retention periods for financial audit data, and regulatory reporting requirements.

---

## 3. Payment Gateway Integration

### 3.1 Gateway Selection

**Resolved**: Stripe is the primary payment gateway.

Stripe is selected for:

- Comprehensive API coverage (authorisation, capture, void, refund, payouts).
- Client-side tokenisation via Stripe Elements (maintains SAQ-A compliance).
- Stripe Connect support for marketplace/escrow-style fund flows.
- Strong webhook infrastructure with signature verification.
- Excellent developer experience, documentation, and TypeScript SDK.

The adapter abstraction (Section 3.2) remains in place — application code does not reference the Stripe SDK directly. This preserves the ability to swap or add gateways in future.

### 3.2 Abstraction Layer

Per [Engineering Standard](L2-002), Section 2.4, all gateway interaction is wrapped behind an internal payment gateway adapter.

The adapter interface must support:

- Authorisation (pre-auth hold on a payment method).
- Capture (convert an authorisation to a charge).
- Void (cancel an uncaptured authorisation).
- Refund (full or partial reversal of a captured charge).
- Webhook event processing (normalise gateway-specific event formats).
- Payment method tokenisation (delegate to gateway's client-side tokenisation).

The adapter returns normalised domain events regardless of the underlying gateway.
Consuming code never sees gateway-specific types, error codes, or response formats.

### 3.3 Webhook Handling

Gateway webhooks must be:

- Verified using the gateway's signature verification mechanism before processing.
- Idempotent — processing the same webhook event twice produces the same outcome.
- Processed asynchronously with at-least-once delivery semantics.
- Logged in the audit trail per [Audit](L3-006).

---

## 4. Tokenisation & PCI DSS Scope

### 4.1 Scope Target

Mars Mission Fund targets **PCI DSS SAQ-A** compliance scope.
The platform never stores, processes, or transmits raw card data.
All card data handling is delegated to Stripe's client-side tokenisation via Stripe Elements.

### 4.2 Tokenisation Flow

1. The donor's browser/client communicates directly with the payment gateway to tokenise card details.
1. The gateway returns a single-use payment method token.
1. The platform's backend receives only the token — never raw card data.
1. The token is used for the immediate capture operation.
   Refunds reference the resulting charge/payment ID, not the original token.

### 4.3 Stored Payment Methods

**Resolved**: Stored payment methods are not supported.
Donors must re-enter payment details for each contribution.
This minimises PCI scope and reduces token storage obligations.
This decision may be revisited in a future release to improve repeat donor experience.

---

## 5. Contribution Processing Flow

### 5.1 Flow Overview

**Resolved**: Immediate capture.
Funds are authorised and captured in a single step at contribution time.
This eliminates authorisation expiry risk and ensures funds are held in escrow immediately.
Interest accrues on escrowed funds from the moment of capture until disbursement (see Section 6.3).

```text
Donor initiates contribution
    → Tokenise card (client-side, gateway)
    → Authorise and capture payment (backend → gateway adapter)
    → Create escrow record; funds held in proposal's segregated escrow account
    → Confirm contribution to donor
    → Notify proposal of new contribution
```

### 5.2 Authorisation and Capture

- Authorisation and capture occur as a single immediate operation.
- The charge includes metadata: proposal ID, donor ID, contribution ID, and timestamp.
- On successful capture, funds are routed to the proposal's segregated escrow account (see Section 6.1).
- Capture failure triggers a retry strategy (defined in [Reliability](L3-003)) and donor notification.

### 5.3 Contribution States

| State                | Description                        |
| -------------------- | ---------------------------------- |
| `pending_capture`    | Capture request sent to gateway.   |
| `captured`           | Funds captured and held in escrow. |
| `failed`             | Capture failed.                    |
| `refunded`           | Contribution fully refunded.       |
| `partially_refunded` | Contribution partially refunded.   |

Every state transition is logged in the audit trail per [Audit](L3-006).

---

## 6. Escrow Mechanics

### 6.1 Escrow Structure

**Resolved**: Segregated escrow accounts — one per proposal.

Each proposal has its own dedicated escrow account.
Contributed funds are held in the proposal's segregated account until milestones are verified and disbursement is approved.
This provides clear legal separation, simplifies per-proposal accounting, and eliminates cross-proposal fund commingling risk.

> **Workshop note**: Segregated accounts are the architectural design.
> In the local demo, this may be represented as logical separation within a single data store rather than actual separate bank accounts.

### 6.2 Escrow Ledger

Each segregated escrow account is backed by a double-entry ledger tracking:

- Per-proposal escrow balance.
- Per-contribution escrow allocation.
- Disbursement debits.
- Refund debits.
- Interest credits.

The ledger is append-only and immutable per [Engineering Standard](L2-002), Section 1.7.

### 6.3 Interest Handling

**Resolved**: Interest earned on escrowed funds is passed to the proposal.

- Interest accrues from the moment of capture until disbursement.
- Accrued interest is included with the milestone disbursement payment to the proposal creator.
- If a proposal fails and contributions are refunded, any accrued interest is returned to donors pro-rata along with their contribution refund.
- Interest calculations and disbursement are recorded in the escrow ledger and audit trail.

---

## 7. Milestone-Based Disbursement

### 7.1 Disbursement Trigger

Disbursement is triggered when a proposal milestone is verified as complete per [Proposal](L4-002).
This spec receives a disbursement trigger event from the proposal domain — it does not determine whether a milestone is met.

### 7.2 Multi-Approval Workflow

Per [Product Vision & Mission](L1-001), disbursement of escrowed funds requires dual authorisation:

- **Two administrators** must independently approve each disbursement.
- The two approvers must be different individuals (no self-approval).
- Approvals are time-bounded — if the second approval does not occur within a configured window, the first approval expires and the process must restart.
- Each approval is logged in the audit trail with the approver's identity and timestamp.

### 7.3 Disbursement Processing

1. Proposal milestone verified → disbursement request created.
1. First administrator approves.
1. Second administrator approves.
1. KYC status confirmed as current for the creator per [KYC](L4-005) — disbursement is blocked if KYC has expired or been revoked.
1. Accrued interest on the disbursement portion calculated and added to the payout amount (see Section 6.3).
1. Payout executed via gateway adapter to proposal creator's verified bank account.
1. Escrow ledger debited for principal and interest; disbursement recorded.

### 7.4 Disbursement States

| State                | Description                               |
| -------------------- | ----------------------------------------- |
| `pending_approval`   | Awaiting first administrator approval.    |
| `partially_approved` | First approval received; awaiting second. |
| `approved`           | Dual approval complete; ready for payout. |
| `processing`         | Payout initiated with gateway.            |
| `completed`          | Funds transferred to creator.             |
| `failed`             | Payout failed; requires investigation.    |
| `approval_expired`   | Approval window elapsed; must restart.    |

---

## 8. Refund Handling

### 8.1 Refund Triggers

- **Proposal failure**: If a proposal fails to meet its funding goal by the deadline, all contributions are refunded in full.
  The failure event is received from [Proposal](L4-002).
- **Proposal cancellation**: If a proposal is cancelled by administrators, all contributions are refunded.
- **Donor-initiated refund**: Subject to the milestone-based refund policy (see Section 8.5).

### 8.2 Refund Processing

1. Refund event received (proposal failure, cancellation, or donor request).
1. Refund eligibility validated against policy.
1. Refund initiated via gateway adapter (full or partial).
1. Escrow ledger debited for the refund amount.
1. Donor notified of refund and expected timeline.
1. Refund status tracked through to settlement.

### 8.3 Refund States

| State       | Description                                           |
| ----------- | ----------------------------------------------------- |
| `pending`   | Refund initiated; processing with gateway.            |
| `completed` | Refund confirmed by gateway; funds returned to donor. |
| `failed`    | Refund failed; requires manual investigation.         |

### 8.4 Partial Refunds

If a proposal has partially disbursed (some milestones completed, others not), only the undisbursed portion is eligible for refund.
The refund amount per donor is calculated pro-rata based on their contribution relative to total proposal escrow.

### 8.5 Donor-Initiated Refund Policy

**Resolved**: Milestone-based refund policy.

Donor-initiated refunds are governed by the proposal's disbursement state:

- **No milestones disbursed**: Full refund available.
  The donor may request a full refund of their contribution at any time before the first milestone disbursement.
- **Partial disbursement**: Pro-rata refund of undisbursed portion.
  If some milestones have been disbursed, the donor may request a refund of their proportional share of the remaining escrow balance.
- **Fully disbursed**: No refund available.
  Once all milestones have been disbursed, no refund is possible.

Refund requests are processed within 5–10 business days.
All refund requests and outcomes are logged in the audit trail.

---

## 9. Currency Support

**Resolved**: Single currency — USD.

### 9.1 Single Currency

- All contributions and disbursements are in USD.
- Amounts stored as integer minor units (cents) to avoid floating-point precision issues.
- Display formatting handled by the frontend per [Frontend Standards](L3-005).
- Multi-currency support is out of scope and may be considered in a future release.

---

## 10. Transaction Reconciliation

### 10.1 Daily Reconciliation

A daily automated reconciliation process compares:

- Platform transaction records against gateway settlement reports.
- Escrow ledger balances against actual account balances.
- Disbursement records against gateway payout confirmations.

### 10.2 Discrepancy Handling

- Discrepancies are flagged automatically and create an investigation ticket.
- Discrepancies above a configurable threshold trigger an alert to the finance team.
- No automated resolution of discrepancies — all resolutions require human review and are logged in the audit trail.

### 10.3 Reconciliation Report

A reconciliation report is generated daily and includes:

- Total contributions processed vs gateway settlement.
- Total disbursements processed vs gateway payouts.
- Escrow balance: expected (ledger) vs actual (account).
- List of unresolved discrepancies.

---

## 11. Tax Receipt Data

### 11.1 Data Provided to Donor Spec

This spec provides financial data to [Donor](L4-003) for tax receipt generation.
Tax receipt generation and delivery is the responsibility of the donor domain.

Data provided per contribution:

- Contribution ID.
- Donor ID.
- Proposal ID and proposal name.
- Contribution amount (gross).
- Currency.
- Date of contribution (capture date).
- Payment method type (card, bank transfer — not card details).
- Refund amount (if any).
- Platform tax-exempt status identifier.

### 11.2 Financial Year Aggregation

The payment service provides aggregated contribution data per donor per financial year on request from [Donor](L4-003).

**Resolved**: Mars Mission Fund is a tax-deductible entity.
Contributions qualify for tax deductibility.
Tax receipts must include the platform's tax-exempt status identifier and comply with applicable tax authority requirements.
Receipt wording must clearly state the deductible amount (gross contribution minus any refunds).

---

## 12. Financial Reporting

### 12.1 Admin Dashboard Metrics

The payment service exposes financial data for the admin dashboard:

| Metric                   | Description                                                                       |
| ------------------------ | --------------------------------------------------------------------------------- |
| Total raised             | Sum of all captured contributions across all proposals.                           |
| Total disbursed          | Sum of all completed disbursements (principal).                                   |
| Total interest disbursed | Sum of all interest paid out to proposals.                                        |
| Total in escrow          | Current escrow balance across all proposals (principal + accrued interest).       |
| Total refunded           | Sum of all completed refunds (principal + interest).                              |
| Net platform position    | Total raised + total interest earned − disbursed − interest disbursed − refunded. |

### 12.2 Per-Proposal Financials

For each proposal:

- Total contributions (count and amount).
- Escrow balance (principal + accrued interest).
- Accrued interest to date.
- Disbursed to date (principal + interest, per milestone).
- Refunds processed.
- Funding progress (percentage of goal).

### 12.3 Reporting Access Control

Financial reports are restricted to users with the appropriate administrative role per [Security](L3-002).
All report access is logged in the audit trail.

---

## 13. Interface Contracts

### 13.1 Interface with [Proposal](L4-002)

| Direction           | Event / Data             | Description                                                                                        |
| ------------------- | ------------------------ | -------------------------------------------------------------------------------------------------- |
| Proposal → Payments | `escrow_create`          | When a proposal is approved and goes live, an escrow allocation is created.                        |
| Proposal → Payments | `milestone_verified`     | When a proposal milestone is verified, triggers disbursement workflow.                             |
| Proposal → Payments | `proposal_failed`        | When a proposal fails (deadline reached, goal not met), triggers full refund of all contributions. |
| Proposal → Payments | `proposal_cancelled`     | When a proposal is cancelled by administrators, triggers full refund.                              |
| Payments → Proposal | `contribution_received`  | Confirms a new contribution has been captured and added to escrow.                                 |
| Payments → Proposal | `disbursement_completed` | Confirms milestone disbursement has been transferred.                                              |
| Payments → Proposal | `escrow_balance`         | Current escrow balance for a proposal (on request).                                                |

### 13.2 Interface with [Donor](L4-003)

| Direction        | Event / Data             | Description                                                   |
| ---------------- | ------------------------ | ------------------------------------------------------------- |
| Donor → Payments | `contribution_initiated` | Donor has chosen to contribute; payment processing begins.    |
| Payments → Donor | `contribution_confirmed` | Payment captured successfully; contribution recorded.         |
| Payments → Donor | `contribution_failed`    | Payment failed; donor should retry or use a different method. |
| Payments → Donor | `refund_initiated`       | Refund processing has begun.                                  |
| Payments → Donor | `refund_completed`       | Refund confirmed; funds returned.                             |
| Payments → Donor | `tax_receipt_data`       | Financial data for tax receipt generation (see Section 11).   |

### 13.3 Interface with [KYC](L4-005)

| Direction      | Event / Data          | Description                                                                 |
| -------------- | --------------------- | --------------------------------------------------------------------------- |
| Payments → KYC | `kyc_status_check`    | Before disbursement, payments verifies the creator's KYC status is current. |
| KYC → Payments | `kyc_status_response` | Confirmed/denied — gates disbursement processing.                           |

### 13.4 Interface with [Audit](L3-006)

All payment state mutations emit audit events per [Engineering Standard](L2-002), Section 1.7.
The audit event schema for payment events includes: event type, correlation ID, actor ID, timestamp, contribution/disbursement/refund ID, amount, currency, old state, new state, and gateway reference ID.

### 13.5 Interface with [Account](L4-001)

| Direction          | Event / Data           | Description                                                                                                                                                                                                                |
| ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account → Payments | Authenticated identity | All payment operations receive the authenticated account ID from the session context. Payment methods are managed within the Payments domain, not Account.                                                                 |
| Payments → Account | `escrow_status`        | During account deactivation, [Account](L4-001) queries Payments for active escrow positions associated with the account. Active contributions in escrow are not affected by deactivation — the escrow lifecycle continues. |

Reference: [Account](L4-001), Section 8.4.

---

## 14. Acceptance Criteria

### Contribution Processing

**AC-PAY-001**: Given a donor has a valid payment method token, when they submit a contribution to a live proposal, then the payment is immediately captured, the contribution is recorded in the proposal's segregated escrow ledger, and the donor receives a confirmation including a tax-deductible receipt.

**AC-PAY-002**: Given a payment capture fails (insufficient funds, card declined), when the gateway returns a failure, then the contribution is marked as `failed`, the donor is notified with a clear error message, and no funds are held.

**AC-PAY-003**: Given a donor submits a duplicate contribution (same donor, same proposal, same amount within a short time window), when the system detects the duplicate, then the second attempt is rejected or flagged for confirmation, preventing accidental double charges.

### Escrow

**AC-PAY-004**: Given a contribution has been captured, when the escrow ledger is updated, then the proposal's escrow balance reflects the new contribution and the ledger entry is immutable.

**AC-PAY-005**: Given the escrow ledger records for a proposal, when the balances are summed (contributions + interest credits − disbursements − refunds), then the result matches the actual escrow account balance for that proposal.

### Disbursement

**AC-PAY-006**: Given a proposal milestone has been verified, when an administrator submits a disbursement approval, then the disbursement enters `partially_approved` state and awaits a second approval from a different administrator.

**AC-PAY-007**: Given a disbursement has received one approval, when a second different administrator approves, then the disbursement is processed and funds are transferred to the proposal creator's bank account.

**AC-PAY-008**: Given a disbursement has received one approval, when the approval window expires before a second approval, then the disbursement returns to `pending_approval` and both approvals must be resubmitted.

**AC-PAY-009**: Given a disbursement is approved, when the proposal creator's KYC status is not current (expired or revoked), then the disbursement is blocked and an alert is raised to administrators.

### Refunds

**AC-PAY-010**: Given a proposal has failed (deadline passed, goal not met), when the failure event is received, then all contributions to that proposal are refunded in full and donors are notified.

**AC-PAY-011**: Given a proposal has partially disbursed (some milestones completed), when the proposal fails for remaining milestones, then only the undisbursed portion is refunded pro-rata to donors.

**AC-PAY-012**: Given a refund is initiated, when the gateway processes the refund, then the escrow ledger is debited, the contribution state is updated to `refunded` or `partially_refunded`, and the donor is notified.

### Donor-Initiated Refunds

**AC-PAY-018**: Given no milestones have been disbursed for a proposal, when a donor requests a refund, then their full contribution is refunded.

**AC-PAY-019**: Given some milestones have been disbursed for a proposal, when a donor requests a refund, then they receive a pro-rata refund of the undisbursed escrow balance proportional to their contribution.

**AC-PAY-020**: Given all milestones have been disbursed for a proposal, when a donor requests a refund, then the request is rejected and the donor is informed that no funds remain in escrow.

### Interest

**AC-PAY-021**: Given funds are held in a proposal's segregated escrow account, when a milestone disbursement is processed, then accrued interest on the disbursed portion is included in the payout to the proposal creator and recorded in the escrow ledger.

**AC-PAY-022**: Given a proposal has failed and contributions are being refunded, when refunds are processed, then accrued interest is returned to donors pro-rata along with their contribution refund.

### Reconciliation

**AC-PAY-013**: Given the daily reconciliation process runs, when platform records are compared against gateway settlement data, then any discrepancies are flagged, and a reconciliation report is generated.

**AC-PAY-014**: Given a reconciliation discrepancy exceeds the configured threshold, when the discrepancy is detected, then an alert is sent to the finance team and an investigation ticket is created.

### Gateway Failure Handling

**AC-PAY-015**: Given the payment gateway is temporarily unavailable, when a contribution is attempted, then the system handles the failure gracefully (queues for retry or informs the donor to try later) without data loss or inconsistent state.

**AC-PAY-016**: Given a webhook from the gateway is received, when the same webhook event has already been processed, then the duplicate is handled idempotently with no side effects.

### Financial Reporting

**AC-PAY-017**: Given an administrator with the appropriate role, when they access the financial dashboard, then they see accurate totals for: total raised, total disbursed, total interest disbursed, total in escrow, total refunded, and net platform position.

---

## Change Log

| Date       | Version | Author | Summary                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | ------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| March 2026 | 0.1     | —      | Initial stub.                                                                                                                                                                                                                                                                                                                                                                                |
| March 2026 | 0.2     | —      | Resolved OQ-1: Stripe selected as primary payment gateway. Updated tokenisation references to Stripe Elements.                                                                                                                                                                                                                                                                               |
| March 2026 | 0.3     | —      | Resolved all remaining open questions: USD single currency (OQ-2), segregated escrow accounts (OQ-3), interest passed to proposal (OQ-4), milestone-based donor refund policy (OQ-5), no stored payment methods (OQ-6), tax-deductible entity (OQ-7), immediate capture (OQ-8). Simplified contribution states for immediate capture model. Added Section 8.5 donor-initiated refund policy. |
