# Donor

> **Spec ID**: L4-003
> **Version**: 0.3
> **Status**: Approved
> **Rate of Change**: Per feature / per release
> **Depends On**: L1-001 (Product Vision & Mission), L2-001 (standards/brand.md), L3-005 (tech/frontend.md), L4-001 (domain/account.md), L4-002 (domain/proposal.md), L4-004 (domain/payments.md)
> **Depended On By**: —

---

## 1. Purpose

> **Local demo scope**: Proposal discovery, search, contribution flow (up to payment handoff), and contribution history are **real** — they are implemented in the local demo. The recommendation engine, re-engagement automation, tax receipt generation, and social sharing are theatre. The local demo focuses on browse, contribute, and view history.

This spec defines the complete donor-side bounded context for Mars Mission Fund: how backers discover proposals, make contributions, and maintain an ongoing relationship with the missions they support.

It implements the "Accessibility Over Exclusivity" principle from the [Product Vision & Mission](L1-001) — the platform must make it easy for anyone to participate in funding Mars-enabling projects, regardless of contribution size or technical sophistication.

### In Scope

- Proposal discovery and search.
- Recommendation engine.
- Curated collections and category browsing.
- Contribution flow (up to payment handoff).
- Ongoing donor relationship management (milestone updates, impact reports, notifications).
- Contribution history and personal dashboard.
- Cumulative impact reporting.
- Repeat engagement and re-engagement patterns.
- Tax receipt presentation (donor-facing).
- Social sharing (proposal link only, post-contribution).

### Out of Scope

- Payment processing, escrow, and financial settlement — governed by [Payments](L4-004).
- Proposal creation, review pipeline, and lifecycle management — governed by [Proposal](L4-002).
- Account registration, authentication, profile management, and session handling — governed by [Account](L4-001).
- KYC verification — governed by [KYC](L4-005).
- Audit logging implementation — governed by [Audit](L3-006).
  This spec defines what donor events are audit-logged; the audit spec defines how.

---

## 2. Inherited Constraints

### From [Engineering Standard](L2-002)

| Section                            | Constraint                                        | Application to Donor Context                                                                                                                                                                                                                                                 |
| ---------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.2 Data Access                    | Parameterised queries only                        | All search queries, contribution lookups, and history retrieval must use the data access layer. No raw SQL.                                                                                                                                                                  |
| 1.4 Input Validation               | All external input validated at boundary          | Search terms, filter parameters, contribution amounts, and recommendation feedback must be validated and sanitised.                                                                                                                                                          |
| 1.5 Authentication & Authorisation | Every endpoint authenticated                      | Donor endpoints that mutate state (contributions, preferences, dismissals) require an authenticated session. Proposal discovery and search (Section 3) are accessible to anonymous users; personalisation features (recommendations, search history) require authentication. |
| 1.7 Logging & Auditability         | Every state mutation logged                       | Contributions initiated, cancelled, and completed are state mutations. Preference changes and notification opt-outs must also be logged.                                                                                                                                     |
| 4.2 Test Coverage                  | 90% unit, 100% integration for API contracts      | All search, contribution, and history endpoints require full contract coverage.                                                                                                                                                                                              |
| 5.1–5.3 API Contracts              | Versioned, backward-compatible, consistent errors | Donor APIs follow the standard versioning, compatibility, and error response rules.                                                                                                                                                                                          |
| 6.1 Structured Logging             | JSON logs with correlation ID                     | All donor service log entries include correlation ID for end-to-end tracing through search → contribution → payment flows.                                                                                                                                                   |

### From [Brand Application Standard](L2-001)

| Section                 | Constraint                     | Application to Donor Context                                                                                                                                 |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2.1–2.6 Semantic Tokens | Components consume Tier 2 only | All donor UI (search results, proposal cards, contribution forms, dashboards) must use semantic tokens exclusively.                                          |
| 3.2 Cards               | Card specification             | Proposal discovery cards follow the card component spec.                                                                                                     |
| 3.3 Progress Bars       | Progress bar specification     | Funding progress on proposal cards and detail views follows the progress bar spec.                                                                           |
| 4.2 Copy Patterns       | Voice-in-product               | All donor-facing copy (search empty states, contribution confirmations, milestone notifications) follows the copy patterns defined in L2-001 Section 4.2.    |
| 5.1–5.4 Accessibility   | WCAG 2.1 AA minimum            | Search interfaces, contribution flows, and dashboards must meet all accessibility requirements including contrast, motion, focus, and screen reader support. |

### From [Frontend Standards](L3-005)

- Component library standards, performance budgets, and responsive breakpoints apply to all donor UI.
- Accessibility requirements (WCAG 2.1 AA minimum) as detailed in L3-005.

---

## 3. Discovery and Search

### 3.1 Search Interface

The donor search interface is the primary mechanism for proposal discovery.
It is accessible to both anonymous and authenticated users.
It provides full-text search across proposal titles, descriptions, creator names, and mission codes.
Anonymous users see search results and proposal details but do not receive personalised recommendations or persistent search history.

**Search features**:

- Full-text search with relevance ranking.
- Auto-complete suggestions as the donor types (debounced input, results within performance budget defined by [Frontend Standards](L3-005)).
- Search result highlighting of matched terms.
- Persistent search history per donor (opt-out available via notification preferences in [Account](L4-001)).

### 3.2 Filters

Donors can narrow search results and browse views using the following filter dimensions:

| Filter                    | Type          | Values                                                    |
| ------------------------- | ------------- | --------------------------------------------------------- |
| Category                  | Multi-select  | Categories defined in [Proposal](L4-002) taxonomy         |
| Funding status            | Single-select | Active, Fully Funded, Ending Soon, New                    |
| Deadline                  | Range         | Date range picker (from–to)                               |
| Contribution amount range | Range         | Min–max slider or manual entry                            |
| Sort order                | Single-select | Relevance, Newest, Ending Soon, Most Funded, Least Funded |

Filters are composable — multiple filters apply simultaneously with AND logic.
Filter state is preserved in the URL for shareability and back-button behaviour.

### 3.3 Search Results

Search results display proposal cards following the card component spec from [Brand Application Standard](L2-001), Section 3.2.
Each card shows at minimum:

- Proposal title.
- Creator name.
- Category badge.
- Funding progress bar (L2-001, Section 3.3).
- Percentage funded and amount raised.
- Days remaining (or "Funded" badge if complete).
- Proposal hero image (thumbnail).

Pagination or infinite scroll behaviour is defined by [Frontend Standards](L3-005).

**AC-DONOR-001**: Given a donor enters a search term, when results are returned, then results are ranked by relevance and displayed within the performance budget defined by [Frontend Standards](L3-005).

**AC-DONOR-002**: Given a donor applies a category filter, when the filter is active, then only proposals in the selected category are displayed and the active filter is visually indicated.

**AC-DONOR-003**: Given a donor applies a "Funding status: Ending Soon" filter, when results are displayed, then only proposals with deadlines within 7 days are shown, sorted by nearest deadline first.

**AC-DONOR-020**: Given an unauthenticated user visits the search interface, when they search for proposals, then results are displayed without personalised recommendations or persistent search history, and a prompt to sign in for personalised features is shown.

---

## 4. Recommendation Engine

### 4.1 Approach

The recommendation engine surfaces proposals a donor is likely to support, based on their contribution history, browsing behaviour, and stated preferences.

**Algorithm**: Hybrid approach.
Content-based filtering is used as the primary engine and handles cold-start (fewer than 3 contributions) by matching stated category preferences and browsing behaviour.
Collaborative filtering supplements content-based results once the donor has 3 or more contributions, surfacing proposals backed by donors with similar contribution patterns.

### 4.2 Recommendation Inputs

| Input                | Source                        | Description                                                      |
| -------------------- | ----------------------------- | ---------------------------------------------------------------- |
| Contribution history | This spec (Section 7)         | Categories, amounts, and proposals previously backed             |
| Browsing behaviour   | Analytics events              | Proposals viewed, time spent, search terms used                  |
| Stated preferences   | [Account](L4-001) preferences | Category interests, notification preferences                     |
| Proposal metadata    | [Proposal](L4-002)            | Category, funding status, creator, milestones, similar proposals |

### 4.3 Recommendation Outputs

- Personalised "Recommended for You" section on the donor dashboard.
- "Similar Missions" section on individual proposal pages.
- Re-engagement recommendations (see Section 9).

### 4.4 Constraints

- Recommendations must never surface proposals the donor has already backed (unless re-engagement for milestone updates).
- Recommendations must not create filter bubbles — at least 20% of recommendations must come from categories the donor has not previously explored.
- Recommendation explanations must be provided ("Because you backed Mission X" or "Popular in [Category]").
- Donors can dismiss recommendations; dismissed proposals do not reappear.

**AC-DONOR-004**: Given a donor has backed at least 3 proposals, when they view their dashboard, then personalised recommendations are displayed with explanations for each recommendation.

**AC-DONOR-005**: Given a donor dismisses a recommended proposal, when they next view recommendations, then the dismissed proposal does not appear.

---

## 5. Curated Collections

### 5.1 Editorial Collections

Curated collections are editorially managed groupings of proposals, created by platform staff.

- "Staff Picks" — a rotating editorial selection.
- Thematic collections (e.g., "Habitat Projects", "Propulsion Research", "Life Support Systems").
- Seasonal or event-driven collections (e.g., "Mars Window 2028 Countdown").

Collection management (creation, ordering, publishing) is an administrative function.
The donor spec governs the donor-facing presentation and browsing experience.

### 5.2 Category Browsing

Donors can browse proposals by category taxonomy as defined in [Proposal](L4-002).
Category pages display:

- Category description and hero image.
- Aggregate stats (total proposals, total raised, active proposals).
- Proposal cards sorted by default relevance, with filter and sort controls.

**AC-DONOR-006**: Given a donor navigates to a curated collection, when the collection page loads, then proposals are displayed in the editorial order with collection title, description, and hero image.

**AC-DONOR-007**: Given a donor browses a category page, when the page loads, then aggregate category stats and proposal cards are displayed with filter and sort controls.

---

## 6. Contribution Flow

### 6.1 Flow Overview

The contribution flow is the donor's path from proposal selection to completed contribution.
This spec owns the donor-facing experience up to payment handoff; [Payments](L4-004) owns all payment processing.

```text
Proposal Page → "Back This Mission" CTA → Contribution Amount Selection
→ Contribution Summary → Payment Handoff (→ L4-004) → Confirmation
```

### 6.2 Amount Selection

- Predefined contribution tiers (if defined by proposal creator — see [Proposal](L4-002) interface contract).
- Custom amount entry with minimum and maximum validation.
  Minimum contribution amount is **$5 USD** (platform-level configuration).
  For the initial release, all contributions are in USD only.
  Maximum is governed by regulatory limits (if applicable) and proposal caps.
- Amount displayed with currency formatting per donor locale.

### 6.3 Contribution Summary

Before payment handoff, the donor sees a summary:

- Proposal title and mission code.
- Contribution amount (formatted).
- Any contribution tier benefits (if applicable).
- Clear statement that this is a contribution, not an investment (per [Brand Application Standard](L2-001) Section 4.3 — forbidden language patterns).

### 6.4 Payment Handoff

At the point of payment, control transfers to [Payments](L4-004).
This spec provides:

- Donor identity (from authenticated session).
- Proposal identifier.
- Contribution amount.
- Contribution metadata (tier selection, if applicable).

[Payments](L4-004) returns:

- Payment confirmation or failure status.
- Transaction reference.
- Receipt data.

### 6.5 Confirmation

On successful payment, the donor sees a confirmation screen following the financial confirmation copy patterns from [Brand Application Standard](L2-001), Section 4.2:

- Precise amount and mission reference.
- Transaction reference number.
- Expected next steps (milestone updates, impact reports).
- Option to share the proposal via social sharing (see Section 6.6).

On payment failure, the donor sees an error following the error state copy patterns from [Brand Application Standard](L2-001), Section 4.2.

**AC-DONOR-008**: Given a donor selects "Back This Mission" on a proposal page, when they enter a valid contribution amount, then a contribution summary is displayed with proposal title, amount, and clear "contribution not investment" language.

**AC-DONOR-009**: Given a donor confirms their contribution, when payment is successfully processed by [Payments](L4-004), then a confirmation screen is displayed with the precise amount, mission code, and transaction reference.

**AC-DONOR-010**: Given a donor confirms their contribution, when payment fails, then an error message is displayed following the error copy patterns from [Brand Application Standard](L2-001) with a clear retry path.

### 6.6 Social Sharing

After a successful contribution, donors can share the proposal (not the contribution amount) via:

- **X / Twitter**: Pre-populated post with proposal title and link.
- **Facebook**: Share dialog with proposal title, hero image, and link.
- **LinkedIn**: Share dialog with proposal title and link.
- **Copy to clipboard**: Plain proposal URL for pasting anywhere.

Shared content includes only the proposal link and title — the donor's contribution amount is never included in shared content for privacy reasons.
All shared links use Open Graph meta tags defined by the proposal page.

**AC-DONOR-019**: Given a donor completes a contribution, when they select a social sharing option, then the shared content includes the proposal title and link but does not include the contribution amount.

---

## 7. Contribution History

### 7.1 Personal Dashboard

Every authenticated donor has a personal contribution dashboard displaying:

- All contributions (past and pending).
- For each contribution: proposal title, mission code, amount, date, status (confirmed, pending, refunded).
- Running total of all contributions.
- Filtering and sorting: by date, amount, status, category.

### 7.2 Contribution Statuses

| Status      | Description                                                      |
| ----------- | ---------------------------------------------------------------- |
| Pending     | Payment initiated, awaiting confirmation from [Payments](L4-004) |
| Confirmed   | Payment confirmed, funds in escrow                               |
| In Progress | Proposal active, milestones being delivered                      |
| Completed   | Proposal fully funded and all milestones delivered               |
| Refunded    | Contribution refunded (proposal failed or cancelled)             |

Status transitions are driven by events from [Payments](L4-004) and [Proposal](L4-002).

### 7.3 Tax Receipts

Tax receipts are generated for confirmed contributions.
Financial data (amounts, dates, transaction references) comes from [Payments](L4-004).
This spec owns the donor-facing presentation:

- Downloadable PDF receipt.
- Receipt includes: donor name, contribution amount, date, proposal title, mission code, platform legal entity details.
- Annual summary receipt (aggregating all contributions in a tax year).

**Supported jurisdictions at launch**: Australia (AU), United States (US), European Union (EU), and United Kingdom (UK).
Each jurisdiction's receipt template must satisfy local tax authority requirements for charitable contribution documentation.
Jurisdiction is determined by the donor's registered address in [Account](L4-001).

**AC-DONOR-011**: Given a donor navigates to their contribution history, when the page loads, then all contributions are displayed with proposal title, amount, date, and status.

**AC-DONOR-012**: Given a donor has a confirmed contribution, when they request a tax receipt, then a downloadable PDF receipt is generated with all required fields.

**AC-DONOR-013**: Given a donor requests an annual summary, when the summary is generated, then it aggregates all confirmed contributions for the selected tax year with total amount.

---

## 8. Impact Reporting

### 8.1 Cumulative Impact Dashboard

The impact dashboard provides a high-level view of the donor's total contribution footprint:

- Total amount contributed (lifetime).
- Number of proposals backed.
- Number of milestones achieved (across all backed proposals).
- Number of proposals fully completed.
- Contribution timeline visualisation (contributions over time).

### 8.2 Per-Proposal Impact

For each backed proposal, the donor can view:

- Proposal progress (funding percentage, milestone status).
- Milestone timeline with completion dates.
- Creator updates and impact reports (content provided by proposal creator via [Proposal](L4-002)).
- Fund disbursement events (milestone-triggered releases, sourced from [Payments](L4-004)).

### 8.3 Milestone Notifications

When a proposal the donor has backed reaches a milestone:

- In-app notification.
- Email notification (if opted in via [Account](L4-001) notification preferences).
- Push notification (if opted in and supported).

Notification content follows the voice-in-product patterns from [Brand Application Standard](L2-001).

**AC-DONOR-014**: Given a donor navigates to their impact dashboard, when the page loads, then cumulative stats (total contributed, proposals backed, milestones achieved, proposals completed) are displayed.

**AC-DONOR-015**: Given a proposal the donor has backed achieves a milestone, when the milestone is verified, then the donor receives an in-app notification and an email notification (if opted in).

**AC-DONOR-016**: Given a donor views a backed proposal's impact page, when the page loads, then the milestone timeline, creator updates, and disbursement events are displayed.

---

## 9. Repeat Engagement

### 9.1 Re-engagement Patterns

The platform actively encourages repeat contributions through:

- **Related proposal recommendations**: After a contribution is confirmed, surface similar proposals (see Section 4).
- **Milestone-triggered recommendations**: When a backed proposal reaches a milestone, recommend other proposals in the same category.
- **Contribution anniversaries**: On the anniversary of a donor's first contribution, send a personalised impact summary and recommend new proposals.
- **Proposal completion follow-up**: When a backed proposal completes, celebrate the achievement and recommend new proposals.

### 9.2 Re-engagement Constraints

- Re-engagement communications respect notification preferences from [Account](L4-001).
- Frequency caps apply — no donor receives more than **1 re-engagement notification per week**.
- All re-engagement messaging follows the voice-in-product patterns from [Brand Application Standard](L2-001).
  Re-engagement must never read as spam or pressure.

**AC-DONOR-017**: Given a donor's backed proposal completes successfully, when the completion event is received, then the donor receives a celebration notification with impact summary and related proposal recommendations.

**AC-DONOR-018**: Given a donor has reached the weekly re-engagement notification cap, when a new re-engagement trigger fires, then the notification is suppressed until the next notification window.

---

## 10. Interface Contracts

### 10.1 Proposal (L4-002) → Donor (L4-003)

This spec **consumes** proposal data for discovery and display.

| Data                      | Direction        | Description                                                                                                      |
| ------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| Proposal listing data     | Proposal → Donor | Title, description, category, creator, hero image, funding target, amount raised, deadline, status, mission code |
| Proposal detail data      | Proposal → Donor | Full proposal description, milestones, stretch goals, creator updates, media                                     |
| Category taxonomy         | Proposal → Donor | Category hierarchy for browsing and filtering                                                                    |
| Milestone events          | Proposal → Donor | Milestone verified, milestone failed — triggers donor notifications                                              |
| Proposal completion event | Proposal → Donor | Proposal funded / failed — triggers donor dashboard updates and re-engagement                                    |

This spec **provides** contribution data back to Proposal:

| Data                         | Direction        | Description                                                   |
| ---------------------------- | ---------------- | ------------------------------------------------------------- |
| Contribution count           | Donor → Proposal | Number of backers (for proposal display)                      |
| Contribution initiated event | Donor → Proposal | Signals a new contribution (proposal may update backer count) |

### 10.2 Payments (L4-004) → Donor (L4-003)

This spec **hands off** payment processing and **receives** confirmation.

| Data                 | Direction        | Description                                                                    |
| -------------------- | ---------------- | ------------------------------------------------------------------------------ |
| Payment request      | Donor → Payments | Donor ID, proposal ID, amount, contribution metadata                           |
| Payment confirmation | Payments → Donor | Success/failure status, transaction reference, receipt data                    |
| Refund event         | Payments → Donor | Refund processed — triggers status update in contribution history              |
| Disbursement event   | Payments → Donor | Milestone-based fund release — displayed in per-proposal impact view           |
| Tax receipt data     | Payments → Donor | Financial data for receipt generation (amounts, dates, transaction references) |

### 10.3 Account (L4-001) → Donor (L4-003)

This spec **consumes** backer identity and preferences.

| Data                     | Direction       | Description                                                     |
| ------------------------ | --------------- | --------------------------------------------------------------- |
| Donor identity           | Account → Donor | Authenticated user ID, display name                             |
| Notification preferences | Account → Donor | Email opt-in/out, push notification preferences, frequency caps |
| Category preferences     | Account → Donor | Stated category interests for recommendation engine input       |

---

## Change Log

| Date       | Version | Author | Summary                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | ------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| March 2026 | 0.3     | —      | Added social sharing to In Scope list, clarified multi-currency minimum contribution equivalent, added AC-DONOR-020 for anonymous browsing.                                                                                                                                                                                                                     |
| March 2026 | 0.2     | —      | Resolved all 7 open questions: hybrid recommendation algorithm, 20% diversity floor, $5 USD minimum contribution, 1 re-engagement notification per week cap, anonymous browse access, AU/US/EU/UK tax receipt jurisdictions, social sharing (proposal link only to X/Twitter/Facebook/LinkedIn/clipboard). Added Section 6.6 (Social Sharing) and AC-DONOR-019. |
| March 2026 | 0.1     | —      | Initial stub. Discovery and search, recommendation engine, curated collections, contribution flow, contribution history, impact reporting, repeat engagement, interface contracts with Proposal, Payments, and Account.                                                                                                                                         |
