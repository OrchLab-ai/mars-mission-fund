# Campaign Lifecycle

> **Spec ID**: L4-002
> **Version**: 0.2
> **Status**: Approved
> **Rate of Change**: Per feature / per release
> **Depends On**: L1-001 (Product Vision & Mission), L2-001 (standards/brand.md), L3-001 (tech/architecture.md), L3-006 (tech/audit.md), L4-004 (domain/payments.md), L4-005 (domain/kyc.md)
> **Depended On By**: L4-003 (domain/donor.md)

---

## 1. Purpose

> **Local demo scope**: The campaign state machine, submission flow, review pipeline, and milestone verification workflow are **real** — they are the core demo feature. Appeal processes, deadline enforcement automation, and stretch goal mechanics are theatre for the workshop. The local demo focuses on the happy path: Draft → Submitted → Under Review → Approved → Live → Funded → Settlement → Complete.

This spec governs the full campaign lifecycle on Mars Mission Fund — from initial project submission through review, approval, live fundraising, milestone verification, and final settlement or failure handling.

**What this spec covers**:

- Campaign state machine and all valid transitions.
- Project submission flow and required fields.
- Review pipeline, curation criteria, and reviewer role assignment.
- Approval, rejection, resubmission, and appeal processes.
- Live campaign management: public page, funding progress, stretch goals, deadline enforcement.
- Milestone definition, evidence submission, verification, and staged fund release.
- Campaign completion and settlement workflow.
- Campaign failure, deadline expiry, and refund triggers.

**What this spec does NOT cover**:

- Payment processing mechanics, escrow implementation, or refund execution — see [Payments](L4-004).
- Donor discovery, search, recommendations, or contribution flow — see [Donor](L4-003).
- Account registration, role management, or session management — see [Account](L4-001).
- KYC verification — see [KYC](L4-005).
- Audit log storage and retention architecture — see [Audit](L3-006).

---

## 2. Inherited Constraints

### From [Engineering Standard](L2-002)

- **Section 1.2 — Data Access**: All campaign data queries use parameterised queries through the data access layer.
- **Section 1.4 — Input Validation**: All campaign submission fields are validated and sanitised at the system boundary.
- **Section 1.5 — Authentication & Authorisation**: Every campaign endpoint is authenticated and authorised. Role-based access controls enforce who can submit, review, approve, and manage campaigns.
- **Section 1.7 — Logging & Auditability**: Every campaign state mutation is logged with timestamp, actor identity, action, and affected resource.
- **Section 3.4 — Code Review & Approval**: Changes to campaign flows affecting security surfaces require a second security reviewer.
- **Section 4.2 — Test Coverage**: Campaign business logic requires 90% unit test coverage. Campaign API endpoints require 100% integration test coverage of documented contracts.
- **Section 5 — API & Interface Contracts**: Campaign APIs are versioned, backward-compatible within a version, and use the standard error response format.

### From [Architecture](L3-001)

- Campaign service boundaries, data model, and inter-service communication patterns as defined in the system architecture.

### From [Audit](L3-006)

- All campaign state transitions, review decisions, milestone verifications, and fund release triggers are audit-logged per the immutable event stream architecture defined in L3-006.
- Audit entries for campaign actions include the campaign ID, actor, previous state, new state, and rationale (where applicable).

### From [Payments](L4-004)

- Escrow creation, milestone disbursement, and refund execution are delegated to the payments domain. This spec defines the triggers; L4-004 defines the mechanics.

---

## 3. Campaign State Machine

### 3.1 States

| State            | Description                                                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Draft**        | Creator is assembling the proposal. Not visible to reviewers or the public.                                                       |
| **Submitted**    | Creator has submitted the proposal for review. Immutable until review outcome.                                                    |
| **Under Review** | A reviewer has been assigned and is evaluating the proposal.                                                                      |
| **Approved**     | The proposal has passed review and is cleared to go live.                                                                         |
| **Rejected**     | The proposal has been rejected with written rationale.                                                                            |
| **Live**         | The campaign is publicly visible and accepting contributions.                                                                     |
| **Funded**       | The campaign has reached its minimum funding target. Contributions continue until the deadline or maximum funding cap is reached. |
| **Suspended**    | Campaign temporarily frozen (e.g., creator KYC revoked). No new contributions accepted. Awaiting resolution.                      |
| **Failed**       | The campaign deadline has passed without reaching the minimum funding target.                                                     |
| **Settlement**   | Funds are being disbursed to the creator per the milestone plan.                                                                  |
| **Complete**     | All milestones verified and all funds disbursed (or campaign otherwise finalised).                                                |
| **Cancelled**    | Campaign cancelled by the creator or an administrator before completion.                                                          |

### 3.2 Valid Transitions

| From         | To           | Triggered By      | Conditions                                                                                                             |
| ------------ | ------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Draft        | Submitted    | Creator           | All required fields completed; creator has passed KYC (reference [KYC](L4-005))                                        |
| Draft        | Draft        | Creator           | Iterative editing; no constraints                                                                                      |
| Submitted    | Under Review | Reviewer          | Reviewer claims campaign from review queue (FIFO)                                                                      |
| Under Review | Approved     | Reviewer          | Curation criteria met; written approval rationale recorded                                                             |
| Under Review | Rejected     | Reviewer          | Written rejection rationale and resubmission guidance provided                                                         |
| Rejected     | Draft        | Creator           | Creator chooses to revise and resubmit                                                                                 |
| Approved     | Live         | Creator or System | Creator sets launch date; system publishes at scheduled time                                                           |
| Live         | Funded       | System            | Minimum funding target reached; campaign remains live for additional contributions until deadline or maximum cap       |
| Live         | Failed       | System            | Deadline reached without meeting minimum funding target                                                                |
| Live         | Cancelled    | Creator or Admin  | Creator requests cancellation; admin approves (if contributions exist, triggers refund — reference [Payments](L4-004)) |
| Funded       | Settlement   | System or Admin   | Deadline reached; first milestone verification triggered                                                               |
| Settlement   | Complete     | System            | All milestones verified and funds disbursed, OR final settlement action taken                                          |
| Live         | Suspended    | System or Admin   | Creator KYC revoked or other compliance issue requiring investigation                                                  |
| Funded       | Suspended    | System or Admin   | Creator KYC revoked or other compliance issue requiring investigation                                                  |
| Suspended    | Live         | Admin             | Issue resolved (e.g., KYC re-verified); campaign resumes accepting contributions                                       |
| Suspended    | Funded       | Admin             | Issue resolved; campaign was already funded before suspension                                                          |
| Suspended    | Cancelled    | Admin             | Issue not resolved within allowed window; contributions refunded via [Payments](L4-004)                                |
| Settlement   | Cancelled    | Admin             | Extraordinary circumstances; remaining funds refunded via [Payments](L4-004)                                           |

### 3.3 State Machine Rules

- Every state transition is audit-logged per [Audit](L3-006) with: campaign ID, previous state, new state, actor, timestamp, and rationale.
- No transition may skip states (e.g., Draft cannot go directly to Live).
- Only one active transition may be in progress at a time per campaign.
- The Cancelled state is terminal — no transitions out.
- The Complete state is terminal — no transitions out.
- When the maximum funding cap is reached, the campaign stops accepting new contributions. The campaign remains in Funded state until the deadline.

---

## 4. Project Submission Flow

### 4.1 Submission Prerequisites

- Creator must have a verified account (reference [Account](L4-001)).
- Creator must have completed KYC verification (reference [KYC](L4-005)).

### 4.2 Required Fields

The submission form is a guided, multi-step flow. All fields are required unless marked optional.

| Field Group            | Fields                                                                                                         | Notes                                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mission Objectives** | Title, summary (≤280 chars), detailed description (rich text), Mars-mission alignment statement                | How does this project contribute to getting humanity to Mars?                                                                                                      |
| **Team Credentials**   | Team members (name, role, bio), relevant experience, advisory board (optional)                                 | At least one team member required                                                                                                                                  |
| **Funding**            | Minimum funding target (USD), maximum funding cap (USD), funding deadline, budget breakdown, campaign category | Budget breakdown must account for 100% of the minimum target. The platform uses USD. Maximum cap is the point at which the campaign stops accepting contributions. |
| **Milestone Plan**     | Milestones (title, description, target date, funding percentage, verification criteria)                        | At least two milestones required; funding percentages must sum to 100%                                                                                             |
| **Risk Disclosures**   | Key risks, mitigation strategies                                                                               | At least one risk disclosure required                                                                                                                              |
| **Media**              | Hero image, additional images/video (optional)                                                                 | Image specifications per [Brand](L2-001)                                                                                                                           |
| **Stretch Goals**      | Stretch goal tiers (optional): target amount, description, deliverables                                        | Optional; if provided, must be above the minimum funding target and at or below the maximum funding cap                                                            |

### 4.3 Draft Persistence

- Drafts are auto-saved.
- Creators may have multiple drafts simultaneously.
- Drafts have no expiry.

### 4.4 Campaign Categories

Every campaign must be assigned exactly one primary category from the platform taxonomy.
Creators may also add free-form tags for additional discoverability.

| Category                     | Description                                                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Propulsion                   | Technologies that reduce travel time, cost, and risk of the Earth-to-Mars journey — chemical rockets, nuclear propulsion, orbital refuelling, transfer vehicles      |
| Entry, Descent & Landing     | Systems for slowing down and landing safely on Mars — heat shields, retro-propulsion, precision landing for large payloads                                           |
| Power & Energy               | Electricity generation and storage on Mars — solar arrays, nuclear fission reactors, energy storage, power distribution                                              |
| Habitats & Construction      | Structures for living and working on Mars — pressurised modules, radiation shielding, regolith-based construction, lava tube utilisation                             |
| Life Support & Crew Health   | Systems that keep people alive — air recycling, water purification, waste management, medical capability, crew wellbeing                                             |
| Food & Water Production      | Growing food and extracting water on Mars — controlled-environment agriculture, hydroponics, water ice extraction, bioreactors                                       |
| In-Situ Resource Utilisation | Using Martian materials to manufacture what the colony needs — oxygen and propellant production, metal extraction, 3D printing with local materials                  |
| Radiation Protection         | Shielding humans and electronics from cosmic rays and solar particles — shielding materials, underground habitats, biological countermeasures, early-warning systems |
| Robotics & Automation        | Robots that explore, build, and operate systems on Mars — autonomous rovers, construction robots, drilling systems, AI-driven operations                             |
| Communications & Navigation  | Connecting Mars to Earth and surface assets to each other — deep-space optical comms, relay satellites, surface mesh networks, positioning systems                   |

This taxonomy is derived from NASA's Technology Taxonomy and adapted for a general donor audience per the "Accessibility Over Exclusivity" principle (L1-001).

### 4.5 Submission Validation

On submission, the system validates:

- All required fields are present and non-empty.
- Funding target is within platform bounds: minimum USD $1,000,000, maximum USD $1,000,000,000.
- Milestone funding percentages sum to 100%.
- Deadline is at least 1 week from submission date.
- Deadline does not exceed 1 year from submission date.
- All media meets format and size requirements.

**AC-CAMP-001**: Given a creator has completed KYC verification and filled all required fields, when they submit a project proposal, then the proposal enters "Submitted" state and a confirmation notification is sent to the creator.

**AC-CAMP-002**: Given a creator has not completed KYC verification, when they attempt to submit a project proposal, then submission is blocked and the creator is directed to the KYC verification flow.

**AC-CAMP-003**: Given a creator submits a proposal with milestone funding percentages that do not sum to 100%, when validation runs, then submission is rejected with a clear error message identifying the discrepancy.

---

## 5. Review Pipeline

### 5.1 Reviewer Role Assignment

- Reviewers are users with the **Reviewer** role assigned via [Account](L4-001).
- When a campaign enters Submitted state, it is added to a shared review queue ordered by submission time (FIFO).
- A reviewer claims the next available campaign from the queue. No automatic assignment — reviewers pull work when ready.
- A reviewer may recuse themselves, returning the campaign to the queue.
- Admin users may manually reassign a campaign to a different reviewer.

### 5.2 Curation Criteria

Reviewers evaluate proposals against the following criteria:

| Criterion                  | Description                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Mars-Mission Alignment** | Does the project credibly contribute to Mars-enabling goals as defined in [Product Vision & Mission](L1-001)? |
| **Feasibility**            | Is the funding target realistic for the proposed deliverables? Is the timeline achievable?                    |
| **Team Credibility**       | Does the team have relevant experience or credentials?                                                        |
| **Risk Transparency**      | Are risks honestly disclosed with reasonable mitigation strategies?                                           |
| **Milestone Quality**      | Are milestones specific, measurable, and verifiable?                                                          |
| **Completeness**           | Are all required fields substantively filled (not just placeholder text)?                                     |

### 5.3 Review Actions

A reviewer may:

- **Approve** — requires written approval notes.
- **Reject** — requires written rejection rationale and resubmission guidance.
- **Request Clarification** — sends questions back to the creator without changing state (campaign remains Under Review).

### 5.4 Review SLA

- Target time from Submitted to review outcome: 5 business days.
- At 3 business days without a reviewer claiming the campaign, an alert is sent to all reviewers.
- At 5 business days, the campaign is escalated to Admin for manual assignment or action.

### 5.5 Audit Trail

All review actions are audit-logged per [Audit](L3-006): reviewer identity, action taken, rationale provided, timestamp.

**AC-CAMP-004**: Given a proposal is in "Submitted" state, when a reviewer claims it from the review queue, then the proposal transitions to "Under Review" and the creator is notified.

**AC-CAMP-005**: Given a reviewer approves a proposal, when they submit their approval with written notes, then the proposal transitions to "Approved" and the creator is notified with the approval notes.

---

## 6. Approval and Rejection

### 6.1 Approval

- Approved campaigns are cleared to go live.
- The creator is notified and may choose a launch date or launch immediately.
- Approval rationale is stored and audit-logged.

### 6.2 Rejection

- Rejection requires:
  - Written rationale explaining why the proposal does not meet curation criteria.
  - Resubmission guidance: specific, actionable feedback on what the creator should change.
- The creator is notified with the full rejection rationale and guidance.
- The proposal returns to Draft state if the creator chooses to revise.

### 6.3 Appeal Process

> **Local demo scope**: The appeal process is **not implemented** in the demo. Rejected campaigns
> may be revised and resubmitted (Draft → Submitted), but there is no appeal workflow, alternate
> reviewer assignment, or appeal audit trail. See [ADR-0002](../adrs/0002-audit-log-demo-simplification.md).

- A creator may appeal a rejection by submitting an appeal request to the Admin role.
- The appeal is reviewed by a different reviewer than the original.
- Appeal outcomes: overturn (proposal moves to Approved) or uphold (rejection stands).
- Appeal decisions are final.
- All appeal actions are audit-logged.

**AC-CAMP-006**: Given a reviewer rejects a proposal, when they submit the rejection with written rationale and resubmission guidance, then the proposal transitions to "Rejected" and the creator is notified with the rationale and guidance.

**AC-CAMP-007**: Given a creator whose proposal was rejected, when they submit an appeal, then the appeal is assigned to a different reviewer and the creator is notified of the appeal status.

**AC-CAMP-008**: Given a rejected proposal, when the creator chooses to revise and resubmit, then the proposal returns to "Draft" state with previous submission data preserved.

---

## 7. Live Campaign Management

### 7.1 Public Campaign Page

- Approved campaigns that have launched are publicly visible.
- The campaign page displays: all submission fields (formatted per [Brand](L2-001)), funding progress (current amount vs. target), contributor count, time remaining, milestone plan, and stretch goals (if any).
- The campaign page provides a contribution call-to-action that initiates the donor contribution flow (reference [Donor](L4-003) and [Payments](L4-004)).

### 7.2 Funding Progress

- Funding progress is updated in near-real-time as contributions are confirmed by [Payments](L4-004).
- Progress is displayed as both absolute amount and percentage of minimum funding target.
- Contributor count is displayed (individual donor identities are not shown on the public page unless the donor opts in — reference [Donor](L4-003)).

### 7.3 Stretch Goals

- If stretch goals are defined, they become visible on the campaign page once the minimum funding target is reached.
- Each stretch goal tier activates when its funding threshold is reached.
- Stretch goal activation is audit-logged.

### 7.4 Deadline Enforcement

- Every live campaign has a deadline.
- The system automatically transitions the campaign at deadline:
  - If minimum funding target met → **Funded** state.
  - If minimum funding target not met → **Failed** state.

#### Deadline Extensions

> **Local demo scope**: Deadline extension requests are **not implemented** in the demo. Campaigns
> transition automatically at deadline but there is no UI or API for requesting or approving
> extensions, and no contributor notification flow for approved extensions.

- Creators may request a deadline extension while the campaign is Live.
- Extensions require Admin approval.
- Maximum single extension: 30 days.
- Maximum total extensions per campaign: 90 days (cumulative).
- Extension requests must include a written justification visible to contributors.
- All contributors are notified when an extension is approved.
- Extension approval is audit-logged per [Audit](L3-006).

**AC-CAMP-019**: Given a live campaign, when a creator requests a deadline extension with written justification, and an Admin approves it, then the deadline is extended, all contributors are notified, and the extension is audit-logged.

**AC-CAMP-020**: Given a live campaign, when a creator requests a deadline extension that would exceed the 90-day cumulative limit, then the extension request is rejected with an explanation.

### 7.5 Post-Launch Changes

- Creators may NOT modify the minimum funding target or maximum funding cap after going live.

#### Milestone Change Requests

> **Local demo scope**: Milestone change requests are **not implemented** in the demo. Milestone
> plans are fixed after submission. There is no UI or API for requesting, approving, or
> audit-logging milestone amendments, and no contributor notification flow for approved changes.

- Creators may request changes to milestones after going live (e.g., adjusting dates, refining verification criteria, rebalancing funding percentages).
- Milestone changes require Admin approval.
- Milestone funding percentages must still sum to 100% after any change.
- When a milestone change is approved, all contributors are notified with a summary of what changed.
- The original milestone plan is preserved in the audit trail; changes are recorded as amendments.
- Milestone change approval is audit-logged per [Audit](L3-006).

**AC-CAMP-009**: Given a campaign is in "Approved" state, when the creator launches it, then the campaign transitions to "Live" and is publicly visible on the platform.

**AC-CAMP-010**: Given a live campaign, when a contribution is confirmed by the payments system, then the funding progress is updated in near-real-time on the campaign page.

**AC-CAMP-011**: Given a live campaign, when the minimum funding target is reached, then the campaign transitions to "Funded" state and remains open for contributions until the deadline or maximum funding cap is reached.

**AC-CAMP-012**: Given a live campaign, when the deadline is reached and the minimum funding target has not been met, then the campaign transitions to "Failed" state and refunds are triggered via the payments system.

**AC-CAMP-021**: Given a live or funded campaign, when a creator requests a milestone change, and an Admin approves it, then the milestone plan is updated, all contributors are notified with a summary of changes, and the original plan is preserved in the audit trail.

**AC-CAMP-022**: Given a funded campaign, when a contribution would exceed the maximum funding cap, then the contribution is rejected and the donor is informed the campaign has reached its cap.

---

## 8. Milestone Definition and Verification

### 8.1 Milestone Structure

Each milestone includes:

- Title and description.
- Target completion date.
- Funding percentage (portion of total funds released upon verification).
- Verification criteria: specific, measurable conditions that must be met.

### 8.2 Evidence Submission

- When a creator believes a milestone is complete, they submit evidence (documents, images, links, reports) through the platform.
- Evidence submissions are timestamped and immutable once submitted.

### 8.3 Administrator Verification

- An Admin reviews the submitted evidence against the milestone's verification criteria.
- Verification outcomes:
  - **Verified** — milestone criteria met. Triggers fund release for this milestone's funding percentage via [Payments](L4-004).
  - **Returned** — evidence insufficient. Creator is notified with specific feedback and may resubmit.
- All verification actions are audit-logged per [Audit](L3-006).

### 8.4 Staged Fund Release

- Funds are released per milestone, not in a lump sum.
- Each milestone verification triggers a disbursement request to [Payments](L4-004) for the milestone's funding percentage of total collected funds.
- No funds are released until the first milestone is verified.
- The final milestone release settles the remaining escrowed balance.

**AC-CAMP-013**: Given a campaign in "Settlement" state, when a creator submits evidence for a milestone, then the evidence is recorded and an Admin is notified for verification.

**AC-CAMP-014**: Given an Admin reviews milestone evidence and verifies it, when they confirm verification, then the milestone is marked as verified and a disbursement for that milestone's funding percentage is triggered via the payments system.

**AC-CAMP-015**: Given an Admin reviews milestone evidence and finds it insufficient, when they return it, then the creator is notified with specific feedback and may resubmit evidence.

---

## 9. Campaign Completion

### 9.1 Successful Completion

A campaign is complete when:

- All milestones have been verified, AND
- All funds have been disbursed via [Payments](L4-004).

The system transitions the campaign to **Complete** state.

### 9.2 Settlement Workflow

1. Campaign reaches deadline in Funded state → transitions to Settlement.
1. Creator submits evidence for each milestone sequentially.
1. Admin verifies each milestone.
1. Upon verification, disbursement is triggered for that milestone's portion.
1. After final milestone verification and disbursement, campaign transitions to Complete.

**AC-CAMP-016**: Given all milestones are verified and all funds disbursed, when the final disbursement is confirmed, then the campaign transitions to "Complete" state and the creator is notified.

---

## 10. Campaign Failure

### 10.1 Failure Conditions

A campaign fails when:

- The deadline is reached and the minimum funding target has not been met.

The funding model is **flexible with a minimum threshold**: campaigns that meet their minimum target keep what they raise (up to the maximum cap). Campaigns that do not reach the minimum target are failed and all contributions are refunded.

### 10.2 Failure Handling

1. Campaign transitions to **Failed** state.
1. System triggers a refund for all contributions via [Payments](L4-004).
1. Creator is notified that the campaign has failed.
1. Contributors are notified that their contributions will be refunded.
1. Failed campaigns remain visible on the platform (marked as failed) for transparency.

### 10.3 Cancellation

- A creator may cancel a Live campaign. If contributions exist, the Admin must approve the cancellation.
- Upon cancellation, all contributions are refunded via [Payments](L4-004).
- Cancellation during Settlement: Admin-only, remaining undisbursed funds are refunded.

**AC-CAMP-017**: Given a live campaign, when the deadline passes without the minimum funding target being met, then the campaign transitions to "Failed" and refunds are triggered for all contributions.

**AC-CAMP-018**: Given a creator requests cancellation of a live campaign with existing contributions, when an Admin approves the cancellation, then the campaign transitions to "Cancelled" and all contributions are refunded.

---

## 11. Interface Contracts

### 11.1 Campaign ↔ Payments ([Payments](L4-004))

| Event                       | Campaign Publishes                                                                  | Payments Responds                                                           |
| --------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Campaign goes Live          | `CampaignLive` — campaign ID, minimum funding target, maximum funding cap, deadline | Payments creates escrow account for campaign                                |
| Contribution received       | —                                                                                   | Payments notifies campaign of confirmed contribution amount                 |
| Funding target reached      | `FundingTargetReached` — campaign ID                                                | Payments acknowledges; no action until settlement                           |
| Campaign funded at deadline | `CampaignFunded` — campaign ID, total collected                                     | Payments holds funds in escrow pending milestone verification               |
| Milestone verified          | `MilestoneVerified` — campaign ID, milestone ID, disbursement amount                | Payments executes disbursement to creator                                   |
| Campaign failed             | `CampaignFailed` — campaign ID                                                      | Payments executes refunds to all contributors                               |
| Campaign suspended          | `CampaignSuspended` — campaign ID, reason                                           | Payments stops accepting new contributions for this campaign                |
| Campaign resumed            | `CampaignResumed` — campaign ID                                                     | Payments resumes accepting contributions (if below cap and before deadline) |
| Campaign cancelled          | `CampaignCancelled` — campaign ID                                                   | Payments executes refunds for any existing contributions                    |
| All milestones complete     | `CampaignComplete` — campaign ID                                                    | Payments confirms all funds settled; closes escrow                          |

Both specs must define these events.
The event schema and transport mechanism are defined in [Architecture](L3-001).

### 11.2 Campaign ↔ Donor ([Donor](L4-003))

| Direction        | Data Provided                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Campaign → Donor | Campaign metadata for discovery: title, summary, category, funding progress, deadline, status, hero image, Mars-mission alignment tags |
| Donor → Campaign | Contribution data: contributor count, total contributed (aggregated), individual contribution events (via [Payments](L4-004))          |

- The campaign service provides read-only campaign data to the donor discovery and search systems.
- Contribution data flows through [Payments](L4-004), not directly from donor to campaign.

### 11.3 Campaign ↔ Account ([Account](L4-001))

| Role               | Campaign Permissions                                                                                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Creator**        | Create drafts, edit drafts, submit proposals, launch approved campaigns, submit milestone evidence, request cancellation, request deadline extensions, request milestone changes                   |
| **Reviewer**       | View and claim submitted proposals from review queue, approve/reject proposals, request clarification, recuse from review                                                                          |
| **Admin**          | Reassign reviewers, approve cancellations, verify milestones, handle appeals, approve/reject deadline extensions, approve/reject milestone changes, manage suspended campaigns (restore or cancel) |
| **Backer** (Donor) | View live campaigns, contribute (via [Payments](L4-004)), view milestone progress                                                                                                                  |

Role definitions and assignment are governed by [Account](L4-001).
Campaign enforces permissions based on the authenticated user's role.

### 11.4 Campaign ↔ KYC ([KYC](L4-005))

- Campaign submission requires the creator to have a verified KYC status.
- Campaign checks KYC verification status at submission time via the KYC domain interface.
- If a creator's KYC status is revoked while a campaign is **Live**: the campaign is suspended (no new contributions accepted), the creator and Admin are notified, and the Admin determines next steps (cancel with refunds, or allow the creator to re-verify within 14 days). If re-verification is not completed within 14 days, the campaign is cancelled and all contributions are refunded via [Payments](L4-004).
- If a creator's KYC status is revoked during **Settlement**: disbursements are paused, Admin is notified, and no further milestone payments are released until re-verification is complete. Funds already disbursed are not clawed back.

> **Local demo scope**: KYC revocation handling (AC-CAMP-023 through AC-CAMP-025) is **not
> implemented** in the demo. The KYC check at submission is stubbed (`const kycVerified = true`).
> There is no runtime KYC status monitoring, no Suspended-state trigger on revocation, and no
> 14-day re-verification window. See [ADR-0003](../adrs/0003-stubbed-integrations.md).

**AC-CAMP-023**: Given a live campaign, when the creator's KYC status is revoked, then the campaign transitions to "Suspended", no new contributions are accepted, and the creator and Admin are notified.

**AC-CAMP-024**: Given a suspended campaign, when the creator completes KYC re-verification within 14 days, then the Admin may restore the campaign to its previous state (Live or Funded).

**AC-CAMP-025**: Given a suspended campaign, when 14 days elapse without KYC re-verification, then the campaign is cancelled and all contributions are refunded via the payments system.

---

## 12. Glossary

Domain vocabulary introduced during the Campaign Lifecycle milestone.

| Term | Definition |
| ---- | ---------- |
| **Review Queue** | FIFO set of Submitted campaigns available for Reviewers to claim. Reviewers self-assign (pull model) — campaigns are not assigned by admins unless escalated past the 5-day SLA. |
| **Settlement** | Post-deadline fund disbursement workflow. Triggered when a Funded campaign passes its deadline. Admin verifies each milestone and releases escrowed funds in staged tranches per the milestone plan. |
| **Stretch Goal** | An optional funding tier above the minimum target that unlocks additional deliverables when crossed. Stretch goals are visible on the campaign page once the minimum target is reached and activate automatically as each threshold is met. |
| **Milestone Evidence** | Documentation submitted by a Creator to prove a milestone is complete (documents, images, links, reports). Reviewed by an Admin before funds for that milestone are released. Evidence submissions are timestamped and immutable once submitted. |
| **Cancellation Workflow** | Immediate cancellation if no contributions have been made. Admin approval required if contributions exist, to trigger refunds via the payments system. Admin-only during Settlement; remaining undisbursed funds are refunded. |
| **Deadline Enforcement** | Automatic system transition from Live to Funded (minimum met) or Failed (minimum not met) when the campaign deadline passes. Triggered lazily on next contribution attempt or explicitly by a scheduled check. |

---

## Change Log

| Date       | Version | Author | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| March 2026 | 0.1     | —      | Initial stub. Campaign state machine, submission flow, review pipeline, approval/rejection, live management, milestones, completion, failure, interface contracts with Payments, Donor, Account, and KYC.                                                                                                                                                                                                                                                                |
| March 2026 | 0.2     | —      | Resolved all open questions. Funding: USD, min $1M, max $1B. Flexible funding model (min threshold + max cap). Duration: 1 week–1 year. Pull-based reviewer queue (FIFO), 5-day SLA. Deadline extensions (30-day max, 90-day cumulative). Milestone change requests with Admin approval and contributor notification. KYC revocation handling (14-day re-verification window). Unlimited simultaneous campaigns. 10-category taxonomy based on NASA Technology Taxonomy. |
