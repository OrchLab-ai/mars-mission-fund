# ADR-0003: Stubbed KYC and Payment Integrations

> **Status**: Accepted
> **Date**: 2026-03-22
> **Deciders**: Engineering team

## Context

The domain specs for Payments (L4-004, `specs/domain/payments.md`) and KYC (L4-005,
`specs/domain/kyc.md`) describe production-grade third-party integrations:

- **Payments**: Stripe Connect integration with escrow account management, fund disbursement
  to proposal creators, backer refunds on proposal failure or cancellation, and webhook
  handling for asynchronous payment events.
- **KYC (Know Your Customer)**: Third-party KYC provider integration for identity document
  upload, identity verification API calls, and automated approval/rejection of creator accounts
  before proposals can be submitted for review.

The Proposal Lifecycle milestone required the full proposal workflow — from submission through
review, funding, milestone verification, and settlement — to be demoed end-to-end in a local
workshop environment. Integrating real payment and KYC providers would require:

- PCI DSS scope and compliance controls for card data handling
- Stripe API keys and connected account setup
- KYC provider onboarding (contracts, API credentials, test identity documents)
- Webhook infrastructure (public endpoints, signature verification, retry logic)

None of these are feasible for a local workshop demo running on a developer's laptop.

## Decision

Both integrations are stubbed in the demo:

**KYC stub** — In `packages/server/src/proposals/queries.ts`, the `submitProposal` function
sets `const kycVerified = true` unconditionally. Every creator is treated as KYC-verified
regardless of their actual verification status. No external API call is made.

**Payment stubs** — Three payment trigger points in the server each log a `[STUB]` message
to the console instead of calling Stripe:

- **Fund disbursement** — when an admin verifies a milestone and marks it complete, a
  `console.log('[STUB] Disburse funds for milestone ...')` records the intended action.
- **Backer refund** — when a settlement is cancelled (proposal failed or creator cancels with
  existing contributions), a `console.log('[STUB] Refund backers for proposal ...')` records
  the intended refund.
- **Admin notification** — when a creator submits milestone evidence, a
  `console.log('[STUB] Notify admin of evidence submission ...')` records the event.

## Rationale

- A local workshop demo's value lies in demonstrating the proposal lifecycle workflow — state
  transitions, role-based access, audit visibility — not in exercising real payment rails or
  identity verification.
- Stubs make the demo runnable with zero external dependencies: no Stripe account, no KYC
  provider, no internet access required during the workshop.
- The `console.log('[STUB] ...')` pattern makes stub points visible and easy to locate when
  a real integration is added; they function as inline `// TODO: implement` markers.
- KYC-always-verified simplifies the workshop flow: participants can submit proposals
  immediately without a separate KYC step, keeping the focus on proposal lifecycle states.

## Alternatives Considered

**Stripe test mode with test API keys** — would exercise the real Stripe SDK and webhook
flow using Stripe's sandbox environment. Rejected because it requires a Stripe account,
network access, and key management that add setup friction without adding workshop value.

**Local payment mock server (e.g., stripe-mock)** — a Docker container that mimics the
Stripe API locally. Rejected for the same reason: additional infrastructure with no
workshop-visible benefit over a console.log stub.

**KYC always-rejected stub** — flagging all creators as unverified would block proposal
submission and prevent the lifecycle demo from running end-to-end. The always-verified
approach keeps the full workflow accessible.

**Feature flag to toggle real vs stub** — a `PAYMENT_STUB=true` env var was considered.
Rejected as premature: the demo has no real payment integration to toggle to, so a flag
would add complexity without current value.

## Consequences

**Positive**:

- Demo runs entirely offline with no external API dependencies.
- Zero risk of accidental real payments or real KYC requests during the workshop.
- Stub locations are immediately findable via `grep '[STUB]'` in the server source.
- Workshop participants can iterate quickly through all lifecycle states without waiting for
  external API responses.

**Negative**:

- The gap between demo and production is invisible at runtime — the workflow completes
  successfully whether or not funds are actually moved, which could mask integration bugs
  if real code is added without removing stubs.
- `const kycVerified = true` means the KYC enforcement path in the proposal submission logic
  is untested; a production integration would require new tests and potentially different
  branching logic.

**What production requires** (not implemented in the demo):

- **Stripe Connect**: creator onboarding to a Stripe connected account, escrow fund holding,
  milestone-triggered payouts, and backer refunds via the Stripe Refunds API.
- **Webhook handling**: a `/webhooks/stripe` endpoint with signature verification
  (`stripe.webhooks.constructEvent`), idempotency keys, and retry-safe event processing.
- **KYC document upload**: a secure file upload endpoint for identity documents, integrated
  with a KYC provider SDK (e.g., Onfido, Jumio) for automated verification.
- **KYC provider API calls**: asynchronous verification requests with webhook callbacks when
  a decision is made; the server must update the user's `kyc_status` based on the callback.
- **Escrow account management**: funds collected from backers must be held in escrow and
  released only on successful milestone verification, not disbursed immediately on pledge.
