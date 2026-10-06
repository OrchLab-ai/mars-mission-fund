# KYC — Identity Verification

> **Spec ID**: L4-005
> **Version**: 0.3
> **Status**: Approved
> **Rate of Change**: Per feature / per release
> **Depends On**: L2-002 (Engineering Standard), L3-002 (Security), L3-004 (Data Management), L3-006 (Audit Logging & Transparency)
> **Depended On By**: L4-001 (Account), L4-002 (Campaign), L4-004 (Payments)

---

## 1. Purpose

> **Local demo scope**: Almost all of this spec is production design. The local demo has **no** KYC data model — no KYC status column, table, endpoint, or UI — and no KYC provider.
> The only KYC behaviour is a hard-coded check in `submitCampaign` (`packages/server/src/campaigns/queries.ts`): `const kycVerified = true`, so every Creator is treated as verified (see [ADR-0003](../adrs/0003-stubbed-integrations.md)).
> The verification status lifecycle, document upload, sanctions screening, manual review workflows, document storage encryption, re-verification triggers, and jurisdictional requirements are production design only.
>
> The demo stub is a single line in `packages/server/src/campaigns/queries.ts` (`submitCampaign`): `const kycVerified = true`. No KYC provider API keys, document upload flows, or webhook callbacks are required. See [ADR-0003](../adrs/0003-stubbed-integrations.md) for the full rationale and what a production integration would require.

This spec governs identity verification for Mars Mission Fund: KYC document upload, automated verification checks, sanctions screening, manual review workflows, verification status lifecycle, re-verification triggers, jurisdictional requirements, and data retention rules specific to identity documents.

**What this spec governs**:

- Document upload and validation workflow.
- Automated identity verification via third-party KYC provider.
- Video liveness verification as part of identity checks.
- Sanctions screening (OFAC, EU, UN, Australian DFAT sanctions lists).
- Manual review workflow for edge cases and failed automated checks.
- Verification status lifecycle and state transitions.
- Re-verification triggers (document expiry, regulatory change, suspicious activity).
- Jurisdictional document requirements by country.
- Identity document storage, encryption, retention, and deletion.

**What this spec does NOT cover**:

- Account registration, profile management, and role assignment mechanics — see [Account](L4-001).
  This spec defines the KYC verification states that feed into account verification; [Account](L4-001) implements the user-facing integration.
- Payment processing, escrow, and disbursement — see [Payments](L4-004).
  This spec defines KYC status as a gate for disbursement eligibility; [Payments](L4-004) enforces that gate.
- Campaign submission and review pipeline — see [Campaign](L4-002).
  This spec defines KYC status as a gate for project submission eligibility; [Campaign](L4-002) enforces that gate.
- Authentication, authorisation, and RBAC model — see [Security](L3-002).
- Data classification scheme and general retention policies — see [Data Management](L3-004).
  This spec references the Restricted classification for identity documents and defines KYC-specific retention.
- Audit event schemas and immutability guarantees — see [Audit](L3-006).
  This spec defines which KYC events are auditable; [Audit](L3-006) defines the logging mechanism.

---

## 2. Inherited Constraints

### From [Engineering Standard](L2-002)

| L2-002 Section                | Constraint                                                                                                                                      | How This Spec Applies It                                                                                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 (Encryption)              | All sensitive data encrypted at rest (AES-256) and in transit (TLS 1.3)                                                                         | KYC documents and verification results are classified Restricted per [Data Management](L3-004), Section 1.1 — encrypted at rest with AES-256 and additional key management controls |
| 1.2 (Data Access)             | Parameterised queries only; all access through data access layer                                                                                | All KYC data queries go through the data access layer with classification-based access checks                                                                                       |
| 1.4 (Input Validation)        | All external input validated at system boundary; file uploads validated for type, size, and content; uploaded files served from separate domain | Document uploads validated for file type (magic bytes), size limits, and content scanning before acceptance                                                                         |
| 1.7 (Logging & Auditability)  | Every state mutation logged; sensitive data never logged                                                                                        | All KYC status transitions, document uploads, verification results, and review decisions are logged as audit events; document content and PII are never logged                      |
| 2.3 (What We Don't Build)     | Identity verification infrastructure is integrated, not built                                                                                   | KYC provider is a third-party service, integrated via adapter                                                                                                                       |
| 2.4 (Abstraction Requirement) | External dependencies accessed through internal interfaces                                                                                      | KYC provider accessed through an abstraction layer; no vendor SDK referenced directly by application code                                                                           |

### From [Security](L3-002)

| L3-002 Section               | Constraint                                  | How This Spec Applies It                                                                                                          |
| ---------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 4.2 (MFA)                    | MFA required for administrative operations  | Manual review decisions and admin overrides on KYC status require MFA                                                             |
| 5.1 (RBAC)                   | Five-role model with defined capabilities   | KYC document submission available to authenticated users; manual review restricted to Administrator and Super Administrator roles |
| 5.2 (Role Assignment)        | Creator role granted after KYC verification | This spec defines the verification lifecycle that determines when Creator role eligibility is triggered                           |
| 8.2 (GDPR)                   | DPIA required for KYC processing            | Data Protection Impact Assessment required before KYC processing goes live                                                        |
| 8.3 (Australian Privacy Act) | APP 3 — collect only what is necessary      | Only identity documents required for verification are collected; no extraneous personal data                                      |

### From [Data Management](L3-004)

| L3-004 Section                 | Constraint                                                                                                   | How This Spec Applies It                                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 (Classification)           | KYC identity documents classified as Restricted                                                              | All identity documents, sanctions screening results, and verification decision records stored with Restricted-level controls                              |
| 2.1 (Retention)                | KYC documents retained for duration of active account + 1 year active, 7 years archive after account closure | This spec implements KYC-specific retention per the schedule in [Data Management](L3-004)                                                                 |
| 4.5 (Right-to-Erasure)         | Erasure workflow for data subject requests                                                                   | KYC documents subject to AML/CTF retention override — identity documents retained for legal minimum even after erasure request; documented in Section 8.4 |
| 5.1 (Access by Classification) | Restricted data requires MFA-verified access, all access logged and alerted                                  | All access to KYC documents and verification records enforces MFA and is audit-logged                                                                     |

### From [Audit](L3-006)

| L3-006 Section          | Constraint                                               | How This Spec Applies It                                                                                                                    |
| ----------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 (Event Categories)  | KYC events are a defined audit event category (`kyc`)    | All KYC state transitions emit `kyc`-type audit events per the schema in [Audit](L3-006), Section 3                                         |
| 6.1 (Retention)         | KYC audit events retained 7 years after relationship end | KYC audit retention aligned with AML/CTF record-keeping obligations                                                                         |
| 9.1 (Anomaly Detection) | Suspicious activity patterns detected                    | Repeated verification failures, unusual document submission patterns, and sanctions screening flag patterns are routed to anomaly detection |

---

## 3. KYC Verification Flow

### 3.1 Flow Overview

```text
[User initiates KYC] → [Document Upload] → [Video Liveness Capture] → [Input Validation]
        │
        ├── Validation fails → [Rejected — invalid document] → User notified, can retry
        │
        └── Validation passes → [Automated Verification (document + liveness)]
                │
                ├── Automated check passes → [Sanctions Screening]
                │       │
                │       ├── Sanctions clear → [Verified] → Account KYC status updated
                │       │
                │       └── Sanctions match → [Rejected — sanctions] → Admin notified, account flagged
                │
                ├── Liveness check fails → [Pending Resubmission] → User notified to retry liveness
                │
                └── Automated check fails or inconclusive → [Manual Review Queue]
                        │
                        ├── Reviewer approves → [Sanctions Screening] → (same as above)
                        │
                        ├── Reviewer requests resubmission → [Pending Resubmission] → User notified
                        │
                        └── Reviewer rejects → [Rejected — manual review] → User notified with rationale
```

### 3.2 Flow Steps

1. **Initiation**: User navigates to KYC verification and selects document type appropriate for their jurisdiction (see Section 4.3).
1. **Document Upload**: User uploads identity document image(s). Front and back required for documents with information on both sides.
1. **Video Liveness Capture**: User completes a video liveness session via Veriff's SDK (embedded behind the abstraction layer).
1. **Input Validation**: Uploaded files validated at the system boundary per [Engineering Standard](L2-002), Section 1.4:
   - File type validation (magic bytes — accepted formats: JPEG, PNG, PDF).
   - File size validation (maximum 20 MB per document).
   - Content scanning for malware.
   - Image quality check (resolution, readability — basic checks before sending to provider).
1. **Automated Verification**: Document and video liveness capture submitted to Veriff via abstraction layer (see Section 5.1).
1. **Sanctions Screening**: Identity checked against sanctions lists (see Section 5.2).
1. **Manual Review** (if needed): Failed or inconclusive automated checks escalated to review queue (see Section 5.3).
1. **Status Update**: Verification status updated; dependent systems notified via interface contracts (see Section 10).

---

## 4. Document Types and Acceptance

### 4.1 Accepted Document Types

| Document Type          | Jurisdictions                                              | Requirements                                    |
| ---------------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| Passport               | All                                                        | Photo page; must be current (not expired)       |
| National Identity Card | Countries where government-issued national ID exists       | Front and back; must be current                 |
| Driver's Licence       | Australia, United States, United Kingdom, EU member states | Front and back; must be current; photo required |

Additional documents (e.g., residence permits, government-issued photo cards) may be added per jurisdiction as market scope expands.

### 4.2 Document Validity Requirements

- Documents must not be expired at the time of submission.
- Documents must contain a clear, legible photo of the holder.
- Documents must display the holder's full legal name, date of birth, and document number.
- Documents must be original (not photocopies of photocopies) — the KYC provider's liveness and authenticity checks validate this.

### 4.3 Jurisdictional Requirements

Different jurisdictions may require different document types or additional documentation.
The platform must support configurable document requirements per country.

| Jurisdiction     | Primary Accepted Documents              | Additional Requirements            |
| ---------------- | --------------------------------------- | ---------------------------------- |
| Australia        | Passport, Driver's Licence              | —                                  |
| United States    | Passport, Driver's Licence              | —                                  |
| United Kingdom   | Passport, Driver's Licence, National ID | —                                  |
| EU Member States | Passport, National ID, Driver's Licence | Document language support required |

Jurisdictional configuration must be maintained as reference data, not hardcoded.

---

## 5. Verification Processes

### 5.1 Automated Verification

The platform integrates with Veriff for automated identity verification (per [Tech Stack](L3-008)).
Per [Engineering Standard](L2-002), Section 2.3, identity verification infrastructure is integrated, not built.
Per [Engineering Standard](L2-002), Section 2.4, the Veriff SDK is wrapped behind an abstraction layer.

**Abstraction layer responsibilities**:

- Translate internal document submission requests to the provider's API format.
- Translate provider responses to internal verification result format.
- Handle provider-specific error codes and map them to internal status values.
- Support provider replacement without changing consuming code.

**Automated verification checks** (performed by provider):

- Document authenticity (forgery detection, tampering detection).
- Document data extraction (OCR for name, date of birth, document number, expiry).
- Facial comparison via video liveness check (required for all verifications).
- Data consistency (extracted data matches user-provided profile data).

**Verification result mapping**:

| Provider Result                   | Internal Status                                              | Next Step                                          |
| --------------------------------- | ------------------------------------------------------------ | -------------------------------------------------- |
| Pass                              | Proceed to sanctions screening                               | Section 5.2                                        |
| Fail — document unreadable        | Pending Resubmission                                         | User notified to resubmit with clearer image       |
| Fail — document expired           | Pending Resubmission                                         | User notified to submit current document           |
| Fail — liveness not detected      | Pending Resubmission                                         | User notified to retry with video liveness session |
| Fail — liveness spoofing detected | Escalate to Manual Review                                    | Flagged for human review as potential fraud        |
| Fail — suspected forgery          | Escalate to Manual Review                                    | Flagged for human review                           |
| Fail — data mismatch              | Escalate to Manual Review                                    | Profile data vs. document data discrepancy         |
| Inconclusive                      | Escalate to Manual Review                                    | Provider unable to make a determination            |
| Provider error                    | Retry with backoff; if persistent, escalate to Manual Review | Operational failure, not a verification result     |

### 5.2 Sanctions Screening

All users who pass automated verification (or manual review approval) must be screened against sanctions lists before receiving Verified status.

**Sanctions lists checked**:

- OFAC (U.S. Office of Foreign Assets Control) — SDN List, Consolidated Sanctions List.
- EU Consolidated Financial Sanctions List.
- UN Security Council Consolidated List.
- Australian DFAT Consolidated List.

**Screening approach**:

- Sanctions screening is performed via the KYC provider's sanctions screening capability or a dedicated sanctions screening service, wrapped behind the same abstraction layer.
- Screening uses name matching (with fuzzy matching for transliterations and name variations) and date-of-birth matching.
- Screening results: Clear, Potential Match, or Confirmed Match.

**Screening result handling**:

| Screening Result | Action                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clear            | Verification status set to Verified                                                                                                                                             |
| Potential Match  | Escalated to Manual Review with sanctions match details                                                                                                                         |
| Confirmed Match  | Verification status set to Rejected — sanctions; account flagged; Administrator notified immediately; incident logged as Critical severity per [Security](L3-002), Section 10.1 |

**Re-screening frequency**: Re-screening occurs as part of the 2-year re-verification cycle.
When a user's Verified status expires (after 2 years), re-verification includes fresh sanctions screening.

### 5.3 Manual Review Workflow

Cases that cannot be resolved by automated verification or sanctions screening are escalated to a manual review queue.

**Who can review**: Administrator and Super Administrator roles, as defined in [Security](L3-002), Section 5.1.
MFA is required for all manual review actions per [Security](L3-002), Section 4.2.

**Review queue requirements**:

- Queue displays: submission date, user identifier, document type, reason for escalation, automated verification details, sanctions screening details (if applicable).
- Queue is ordered by submission date (FIFO), with sanctions-related escalations prioritised.
- Reviewer can view the submitted document images within a secure viewer (documents never downloaded to reviewer's local machine — rendered server-side or in a secure browser context).

**Review actions**:

| Action               | Description                                                          | Result                                                                                                         |
| -------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Approve              | Reviewer confirms identity is valid                                  | Proceeds to sanctions screening (if not yet screened) or status set to Verified (if sanctions already cleared) |
| Request Resubmission | Document quality insufficient or additional documentation needed     | Status set to Pending Resubmission; user notified with specific reason                                         |
| Reject               | Identity cannot be verified; fraudulent or disqualifying information | Status set to Rejected; user notified with rationale                                                           |

**Decision logging**: Every manual review decision is logged as a `kyc` audit event per [Audit](L3-006), Section 4.1, including:

- Reviewer identity (actor_id).
- Decision (approve / request resubmission / reject).
- Rationale (free-text reason — mandatory field).
- Documents reviewed (resource references, not document content).
- Time spent in review (for operational metrics).

---

## 6. Verification Status Lifecycle

### 6.1 Status States

| Status                       | Description                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Not Verified**             | Default state for new accounts. No KYC documents submitted.                                                     |
| **Pending**                  | Documents submitted; automated verification or sanctions screening in progress.                                 |
| **Pending Resubmission**     | Previous submission failed validation or was returned by a reviewer; awaiting new submission from user.         |
| **In Manual Review**         | Automated verification inconclusive or failed; awaiting human review.                                           |
| **Verified**                 | Identity confirmed through automated verification and sanctions screening (and manual review if applicable).    |
| **Expired**                  | Previously verified, but verification has expired (document expiry or time-based re-verification trigger).      |
| **Re-verification Required** | A trigger event (see Section 7) requires the user to re-verify.                                                 |
| **Rejected**                 | Identity verification failed with a definitive rejection. User may appeal or resubmit (see Section 6.3).        |
| **Locked**                   | KYC submission locked after 5 failed attempts. Requires Administrator intervention to unlock (see Section 6.3). |

### 6.2 State Transitions

```text
Not Verified → Pending                     (user submits documents)
Pending → Verified                          (automated checks + sanctions clear)
Pending → In Manual Review                  (automated checks fail/inconclusive)
Pending → Pending Resubmission              (document validation fails)
In Manual Review → Verified                 (reviewer approves + sanctions clear)
In Manual Review → Pending Resubmission     (reviewer requests resubmission)
In Manual Review → Rejected                 (reviewer rejects)
Pending Resubmission → Pending              (user resubmits documents)
Verified → Expired                          (document expiry or time-based trigger)
Verified → Re-verification Required         (regulatory change or suspicious activity)
Expired → Pending                           (user submits new documents)
Re-verification Required → Pending          (user submits new documents)
Rejected → Pending                          (user resubmits after rejection — limited retries)
Rejected → Locked                           (5th failed attempt — account locked for KYC submission)
Locked → Pending Resubmission               (Administrator unlocks account)
```

Every state transition emits a `kyc` audit event per [Audit](L3-006).

### 6.3 Rejection and Resubmission Rules

- After 3 failed resubmission attempts, a customer service alert is raised for proactive outreach.
- After 5 failed resubmission attempts, the KYC status transitions to Locked. The user cannot submit new documents until an Administrator unlocks the account, which transitions the status to Pending Resubmission.
- When an Administrator unlocks an account, the failure counter resets to zero.
- Each resubmission resets the verification flow from the beginning (new document upload, new automated verification).
- Rejection rationale is stored and visible to the user (sanitised — no internal review notes exposed) and to administrators (full detail).

---

## 7. Re-verification Triggers

Verified status is not permanent.
The following events trigger a transition to Expired or Re-verification Required:

| Trigger                                                                       | New Status               | Rationale                                                                          |
| ----------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------- |
| Identity document expiry date reached                                         | Expired                  | Document no longer valid; fresh verification needed                                |
| Time-based re-verification period elapsed (2 years from verification date)    | Expired                  | Verified status expires 2 years after verification, requiring full re-verification |
| Regulatory change affecting verification requirements                         | Re-verification Required | New regulations may require additional checks or different documents               |
| Suspicious activity flag from [Audit](L3-006) anomaly detection               | Re-verification Required | Anomalous patterns warrant identity re-confirmation                                |
| User changes legal name or nationality in profile                             | Re-verification Required | Identity documents must match current profile data                                 |
| Sanctions list update results in potential match for previously verified user | Re-verification Required | Re-screening against updated lists produces a match requiring review               |

**Impact of non-Verified status on dependent systems**:

- **Campaign submission**: Users without Verified KYC status cannot submit new campaigns.
  Existing live campaigns are not immediately affected but new milestone disbursements are paused — see [Campaign](L4-002) interface contract.
- **Disbursements**: Users without Verified KYC status are ineligible for disbursements — see [Payments](L4-004) interface contract.
- **Creator role**: The Creator role is conditional on Verified KYC status per [Security](L3-002), Section 5.2.
  If KYC status transitions to Expired or Re-verification Required, Creator role capabilities are suspended until re-verification completes.

---

## 8. Identity Document Storage and Retention

### 8.1 Storage Requirements

Identity documents are classified as **Restricted** per [Data Management](L3-004), Section 1.1.

- Encrypted at rest with AES-256 per [Engineering Standard](L2-002), Section 1.1.
- Stored in a dedicated, isolated storage service — not in the same data store as general application data.
- Uploaded files served from a separate domain per [Engineering Standard](L2-002), Section 1.4.
- Access requires Restricted-level authorisation with MFA per [Data Management](L3-004), Section 5.1.
- All access to stored documents is logged and alerted per [Data Management](L3-004), Section 5.1.

### 8.2 What Is Stored

| Data Element                                                          | Classification | Retention       |
| --------------------------------------------------------------------- | -------------- | --------------- |
| Original document images                                              | Restricted     | Per Section 8.3 |
| Extracted document data (name, DOB, document number, expiry)          | Restricted     | Per Section 8.3 |
| Verification result (pass/fail, confidence score, provider reference) | Restricted     | Per Section 8.3 |
| Sanctions screening result                                            | Restricted     | Per Section 8.3 |
| Manual review decision and rationale                                  | Restricted     | Per Section 8.3 |
| Video liveness session result (pass/fail, provider reference)         | Restricted     | Per Section 8.3 |
| Verification status history (state transitions with timestamps)       | Confidential   | Per Section 8.3 |

Video liveness capture footage (video frames, biometric data) is retained only by Veriff and is not stored in the Mars Mission Fund platform.
Only the session result and provider reference are stored locally.

### 8.3 Retention Policy

Per [Data Management](L3-004), Section 2.1:

| Data Type                                 | Active Retention                    | Archive Retention                               | Total                      | Regulatory Driver             |
| ----------------------------------------- | ----------------------------------- | ----------------------------------------------- | -------------------------- | ----------------------------- |
| KYC identity documents and extracted data | Duration of active account + 1 year | 7 years from account closure                    | ~8+ years                  | AML/CTF Act (Australia), GDPR |
| Sanctions screening results               | Duration of active account + 1 year | 7 years from account closure                    | ~8+ years                  | AML/CTF Act                   |
| Verification decisions and rationale      | Duration of active account + 1 year | 7 years from account closure                    | ~8+ years                  | AML/CTF Act                   |
| Verification status history               | Duration of active account          | 30 days after account closure (then anonymised) | Account lifetime + 30 days | GDPR                          |

### 8.4 Right-to-Erasure Handling

When a data subject exercises their right to erasure (GDPR Article 17):

- KYC identity documents and verification records are **exempt from immediate deletion** where AML/CTF retention requirements apply.
  The legal obligation to retain identity records for anti-money laundering purposes overrides the right to erasure per GDPR Article 17(3)(b) — compliance with a legal obligation.
- The data subject is informed that certain identity records are retained under legal obligation and provided with the regulatory basis.
- Once the AML/CTF retention period expires, data is deleted in accordance with the right-to-erasure workflow defined in [Data Management](L3-004), Section 4.5.
- Verification status history (non-regulated) is anonymised or deleted per the standard erasure workflow.

### 8.5 Deletion on Account Deactivation

When a user deactivates their account:

- Verification status is set to a terminal state (account deactivated).
- Identity documents and verification records enter the archive retention phase per Section 8.3.
- After archive retention expires, all KYC data is permanently deleted.
- Deletion is logged as an audit event per [Audit](L3-006).

---

## 9. Auditable Events

All KYC events are logged as `kyc`-type audit events per [Audit](L3-006), Section 4.1.
The following events must be logged:

| Event                                                    | Audit Action                        | Logged Fields (in addition to base schema)                                           |
| -------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| Document uploaded                                        | `kyc.document.upload`               | Document type, file metadata (size, format), user ID                                 |
| Automated verification initiated                         | `kyc.verification.start`            | Provider reference, document type                                                    |
| Automated verification result received                   | `kyc.verification.result`           | Provider reference, result (pass/fail/inconclusive), confidence score (if available) |
| Sanctions screening initiated                            | `kyc.sanctions.start`               | Lists checked, user identity reference                                               |
| Sanctions screening result received                      | `kyc.sanctions.result`              | Result (clear/potential match/confirmed match), lists checked                        |
| Escalated to manual review                               | `kyc.review.escalate`               | Reason for escalation, queue position                                                |
| Manual review decision                                   | `kyc.review.decision`               | Reviewer ID, decision (approve/resubmit/reject), rationale                           |
| Status transition                                        | `kyc.status.change`                 | Previous status, new status, trigger reason                                          |
| Re-verification triggered                                | `kyc.reverification.trigger`        | Trigger type (document expiry, suspicious activity, etc.)                            |
| Document accessed                                        | `kyc.document.access`               | Accessor ID, access purpose, document reference                                      |
| Document deleted (retention expiry)                      | `kyc.document.delete`               | Deletion reason (retention expiry, account deactivation), document reference         |
| Resubmission threshold reached (3 attempts)              | `kyc.resubmission.cs_alert`         | User ID, attempt count, failure history summary                                      |
| Account locked for KYC submission (5 attempts)           | `kyc.resubmission.account_locked`   | User ID, attempt count, failure history summary                                      |
| Account unlocked for KYC submission (admin intervention) | `kyc.resubmission.account_unlocked` | User ID, admin actor ID, unlock rationale                                            |

**Sensitive data rules**: Document content, PII extracted from documents, and raw sanctions screening details are never included in audit log entries.
Only resource identifiers and result classifications are logged, per [Audit](L3-006), Section 3.3.

---

## 10. Interface Contracts

### 10.1 KYC <> Account (L4-001)

| This Spec Provides                                                        | Account Spec Consumes                                                                                             |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| KYC verification status for each user (see Section 6.1 for status values) | Account verification state — [Account](L4-001) displays KYC status to the user and gates Creator role eligibility |
| KYC status change events                                                  | [Account](L4-001) updates user-facing verification state and triggers notifications on status changes             |
| Re-verification required notifications                                    | [Account](L4-001) surfaces re-verification prompts to the user                                                    |

**Integration mechanism**: KYC service exposes a status query API and publishes status change events.
[Account](L4-001) subscribes to status change events and queries current status as needed.

### 10.2 KYC <> Payments (L4-004)

| This Spec Provides                                                                      | Payments Spec Consumes                                                                                                               |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| KYC verification status (Verified / not Verified)                                       | [Payments](L4-004) checks KYC status before processing disbursements — only users with Verified status are eligible for disbursement |
| KYC status change events (specifically: Verified → Expired or Re-verification Required) | [Payments](L4-004) pauses pending disbursements when KYC status leaves Verified state                                                |

**Integration mechanism**: [Payments](L4-004) queries KYC status synchronously before disbursement processing and subscribes to status change events for proactive disbursement holds.

### 10.3 KYC <> Campaign (L4-002)

| This Spec Provides                                | Campaign Spec Consumes                                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| KYC verification status (Verified / not Verified) | [Campaign](L4-002) checks KYC status before allowing project submission — only users with Verified status can submit campaigns |
| KYC status change events                          | [Campaign](L4-002) may use status changes to update campaign eligibility for existing campaigns                                |

**Integration mechanism**: [Campaign](L4-002) queries KYC status synchronously at project submission time.

### 10.4 KYC <> Security (L3-002)

| This Spec Provides                                                      | Security Spec Provides                                                       |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Verification lifecycle that determines Creator role eligibility         | RBAC model, role assignment rules, MFA requirements for KYC admin operations |
| Sanctions screening results that may trigger security incident response | Incident response process for sanctions matches (Critical severity)          |

Reference: [Security](L3-002), Section 12.7.

### 10.5 KYC <> Data Management (L3-004)

| This Spec Provides                                                                            | Data Management Spec Provides                                                                    |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Specific KYC document types and verification workflows                                        | Restricted classification for KYC documents, retention schedule, right-to-erasure handling rules |
| Definition of which identity records are legally required to be retained post-erasure request | Anonymisation and deletion enforcement mechanism                                                 |

Reference: [Data Management](L3-004), Section 9.5.

### 10.6 KYC <> Audit (L3-006)

| This Spec Provides                                                                                  | Audit Spec Provides                                                                                   |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| KYC-specific audit events (Section 9) logged as `kyc` event type                                    | Immutable logging infrastructure, event schema, retention (7 years for KYC events), anomaly detection |
| Suspicious activity patterns (repeated failures, unusual submission patterns) for anomaly detection | Anomaly detection alerts that trigger re-verification (Section 7)                                     |

Reference: [Audit](L3-006), Section 11.5.

---

## 11. Acceptance Criteria

### Document Upload

**AC-KYC-001**: Given a user with Not Verified status, when they upload a valid identity document (correct format, within size limits, legible), then the document is stored with Restricted-level encryption and the KYC status transitions to Pending.

**AC-KYC-002**: Given a user uploading a document, when the file fails type validation (invalid format or magic bytes), then the upload is rejected with a user-friendly error message and KYC status remains unchanged.

**AC-KYC-003**: Given a user uploading a document, when the file exceeds 20 MB, then the upload is rejected with a user-friendly error message indicating the size constraint.

### Automated Verification

**AC-KYC-004**: Given a user with Pending status and a valid document uploaded, when the automated verification returns a pass result, then the system proceeds to sanctions screening without manual intervention.

**AC-KYC-005**: Given a user with Pending status, when the automated verification returns a failure or inconclusive result, then the case is escalated to the manual review queue and the KYC status transitions to In Manual Review.

**AC-KYC-006**: Given a user with Pending status, when the automated verification indicates the document is unreadable or expired, then the KYC status transitions to Pending Resubmission and the user is notified with the specific reason.

**AC-KYC-006a**: Given a user with Pending status, when the liveness check fails to detect a live person, then the KYC status transitions to Pending Resubmission and the user is notified to retry the video liveness session.

**AC-KYC-006b**: Given a user with Pending status, when the liveness check detects spoofing (e.g., photo of a photo, pre-recorded video), then the case is escalated to the manual review queue and the KYC status transitions to In Manual Review.

### Sanctions Screening

**AC-KYC-007**: Given a user who has passed automated verification (or manual review approval), when sanctions screening returns Clear, then the KYC status transitions to Verified.

**AC-KYC-008**: Given a user undergoing sanctions screening, when screening returns a Potential Match, then the case is escalated to the manual review queue with sanctions match details attached.

**AC-KYC-009**: Given a user undergoing sanctions screening, when screening returns a Confirmed Match, then the KYC status transitions to Rejected, the account is flagged, an Administrator is notified immediately, and a Critical-severity security incident is logged.

### Manual Review

**AC-KYC-010**: Given a case in the manual review queue, when an Administrator approves the identity, then the case proceeds to sanctions screening (if not yet screened) or KYC status transitions to Verified (if sanctions already cleared), and the decision with rationale is logged as an audit event.

**AC-KYC-011**: Given a case in the manual review queue, when an Administrator requests resubmission, then the KYC status transitions to Pending Resubmission, the user is notified with the specific reason, and the decision is logged.

**AC-KYC-012**: Given a case in the manual review queue, when an Administrator rejects the identity with a rationale, then the KYC status transitions to Rejected, the user is notified with a sanitised rationale, and the full decision is logged.

**AC-KYC-013**: Given a reviewer attempting a manual review action, when they have not completed MFA for the current session, then the action is blocked until MFA is satisfied.

### Resubmission Escalation

**AC-KYC-013a**: Given a user who has failed KYC verification 3 times, when the third failure occurs, then a customer service alert is raised for proactive outreach to the user.

**AC-KYC-013b**: Given a user who has failed KYC verification 5 times, when the fifth failure occurs, then the KYC status transitions to Locked, the user cannot submit new documents, and an Administrator must unlock the account to allow further submissions.

**AC-KYC-013c**: Given a user with Locked KYC status, when an Administrator unlocks the account, then the KYC status transitions to Pending Resubmission, the user is notified that they can resubmit, and the unlock decision is logged as an audit event.

### Re-verification

**AC-KYC-014**: Given a user with Verified status, when their identity document's expiry date is reached, then the KYC status transitions to Expired and the user is notified to re-verify.

**AC-KYC-015**: Given a user with Verified status, when a suspicious activity flag is raised by the anomaly detection system, then the KYC status transitions to Re-verification Required and the user is notified.

**AC-KYC-015a**: Given a user with Verified status, when 2 years have elapsed since their verification date, then the KYC status transitions to Expired and the user is notified to re-verify.

**AC-KYC-016**: Given a user with Expired or Re-verification Required status, when they submit new identity documents, then the KYC status transitions to Pending and the full verification flow restarts.

### Data Retention and Deletion

**AC-KYC-017**: Given a user who has deactivated their account, when the archive retention period (7 years from account closure) expires, then all KYC identity documents and verification records are permanently deleted and the deletion is logged as an audit event.

**AC-KYC-018**: Given a data subject exercising their right to erasure, when AML/CTF retention requirements apply to their KYC records, then the system retains the records for the legally required period, informs the data subject of the legal basis for retention, and deletes the records once the retention obligation expires.

### Audit Trail

**AC-KYC-019**: Given any KYC status transition, when the transition occurs, then a `kyc` audit event is emitted containing the previous status, new status, trigger reason, and actor identity, with no sensitive document content included.

**AC-KYC-020**: Given an Administrator accessing a stored identity document for manual review, then the access is logged as a `kyc.document.access` audit event with the accessor's identity and stated purpose.

---

## Change Log

| Date       | Version | Author | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| March 2026 | 0.1     | —      | Initial stub. KYC verification flow, document types and jurisdictional requirements, automated verification with provider abstraction, sanctions screening (OFAC, EU, UN, Australian DFAT), manual review workflow, verification status lifecycle (eight states), re-verification triggers, identity document storage and retention (Restricted classification, AML/CTF retention), right-to-erasure handling, auditable events, interface contracts with Account/Payments/Campaign/Security/Data Management/Audit, acceptance criteria. |
| March 2026 | 0.2     | —      | Closed open questions OQ-2 through OQ-6 and OQ-8. Resolved: video liveness check required, 20 MB max file size, 3/5-attempt resubmission escalation, 2-year re-verification period, sanctions re-screening at re-verification, launch countries AU/US/UK/EU. Updated spec body to reflect resolved values.                                                                                                                                                                                                                               |
| March 2026 | 0.3     | —      | Added Locked status to lifecycle (9 states). Added Depended On By for L4-002 and L4-004. Added video liveness to governs list and Australian DFAT to sanctions list reference. Added liveness data storage clarification (retained by Veriff only). Added audit events for resubmission escalation thresholds and account unlock. Added AC-KYC-013c for admin unlock.                                                                                                                                                                    |
