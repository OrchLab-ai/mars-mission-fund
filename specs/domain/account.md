# Account Lifecycle

> **Spec ID**: L4-001
> **Version**: 0.3
> **Status**: Approved
> **Rate of Change**: Per feature / per release
> **Depends On**: L2-001 (Brand Application Standard), L3-002 (Security), L3-005 (Frontend Standards), L4-005 (KYC)
> **Depended On By**: L4-002 (Proposal), L4-003 (Donor), L4-004 (Payments)

---

## Purpose

> **Local demo scope**: Registration and authentication in the local demo use a **JWT stub** (not Clerk): email/password login issues a signed JWT stored in `localStorage`; tokens are stateless with no refresh or revocation; passwords are bcrypt hashes of known demo values.
> Role assignment and profile management are implemented.
> Session elevation, MFA enforcement, account deactivation with GDPR erasure, data portability, and SSO provider integration are theatre (not implemented).

This spec governs the full account lifecycle for Mars Mission Fund: registration, onboarding, email verification, password policies, SSO integration, profile management, role assignment and management, session management, notification preferences, account recovery, account deactivation, and data portability.

Onboarding is a phase within the account lifecycle, not a separate domain concern.

**This spec does NOT cover**:

- Identity verification and KYC document handling — governed by [KYC](L4-005).
- Payment methods and financial instruments — governed by [Payments](L4-004).
- Proposal creation or management workflows — governed by [Proposal](L4-002).
- Donor-specific features (discovery, contribution history, impact dashboards) — governed by [Donor](L4-003).

**Boundary rule**: This spec owns the identity, authentication state, role assignments, and profile data of a user.
Other domain specs consume account identity context through the interface contracts defined in Section 8.

---

## Inherited Constraints

### From [Engineering Standard](L2-002)

- **Section 1.1 (Encryption)**: All authentication credentials and personal data encrypted at rest (AES-256) and in transit (TLS 1.3 minimum).
- **Section 1.2 (Data Access)**: All account data queries use parameterised queries via the data access layer.
- **Section 1.3 (Secrets Management)**: Authentication secrets (OAuth client secrets, signing keys) managed via secrets management service, never in source code.
- **Section 1.4 (Input Validation)**: All registration and profile input validated and sanitised at the system boundary.
- **Section 1.5 (Authentication & Authorisation)**: Every endpoint authenticated and authorised. MFA required for administrative operations and financial actions.
- **Section 1.7 (Logging & Auditability)**: Every account state mutation logged with timestamp, actor, action, and affected resource.
- **Section 3.4 (Code Review)**: Security-surface changes (authentication, authorisation, session management) require a second reviewer with security domain expertise.
- **Section 4.2 (Test Coverage)**: 100% coverage of roles and permission combinations via integration tests. 100% coverage of authentication flows.
- **Section 5.3 (Error Response Contract)**: Account-related errors follow the standard error format with machine-readable codes, human-readable messages per [Brand Application Standard](L2-001) voice patterns, and correlation IDs.

### From [Security](L3-002)

- Authentication and authorisation architecture as defined in L3-002.
- Session policies (token lifetimes, refresh mechanics, revocation) as defined in L3-002.
- MFA implementation standards (TOTP, WebAuthn) as defined in L3-002.
- Password hashing algorithm and policy parameters as defined in L3-002.
- RBAC model and permission matrix as defined in L3-002.

### From [Frontend Standards](L3-005)

- All account UI surfaces comply with WCAG 2.1 AA minimum.
- All form inputs, buttons, and interactive elements use semantic tokens from [Brand Application Standard](L2-001).
- Registration and onboarding flows meet performance budgets defined in L3-005.
- Responsive breakpoints and browser support matrix as defined in L3-005.

### From [KYC](L4-005)

- KYC verification status lifecycle feeds back into account state (see Section 8.1).
- Account cannot access certain role-gated features until KYC status is verified, as defined in L4-005.

---

## 1. Registration

### 1.1 Email/Password Registration

Users may register with an email address and password.

- Email address must be validated for format at the client and server boundary.
- A verification email is sent immediately upon registration.
- The account enters `Pending Verification` state until the email link is confirmed.
- Verification links expire after 24 hours.
- Users may request a new verification email if the link expires or is lost.

**Password policies** (exact parameters to be defined in [Security](L3-002)):

- Minimum length, complexity requirements, and breach-list checking as defined in L3-002.
- Passwords are hashed using the algorithm specified in L3-002. Plaintext passwords are never stored or logged.

### 1.2 SSO Registration (OAuth 2.0 / OIDC)

Users may register via a supported SSO provider using OAuth 2.0 / OpenID Connect.

- Supported providers at launch: Google and Microsoft (via standard OIDC).
- SSO registration creates an account with the email from the identity provider.
- If an account with the same email already exists (from email/password registration), the user is prompted to link accounts rather than creating a duplicate.
- SSO tokens are stored securely per [Security](L3-002) and [Engineering Standard](L2-002) Section 1.3.

### 1.3 Registration State Machine

```text
[Start] → Pending Verification → Active → Deactivated → Deleted
                ↑                  ↓ ↑          (auto after 90 days)
           Verification      Suspended
             Resent            ↓
                            Active (on reinstatement)

Active → Deleted  (direct GDPR erasure request)
```

- `Pending Verification`: Email not yet confirmed. Limited access (cannot perform financial actions or access role-gated features).
- `Active`: Email confirmed. Full access per assigned roles.
- `Suspended`: Administratively suspended (e.g., fraud review, KYC failure). No access. Requires Administrator action to reinstate.
- `Deactivated`: User-initiated deactivation. Account data retained per retention policy. May be reactivated within 90 days; after 90 days, auto-transitions to `Deleted`.
- `Deleted`: Data erased per GDPR right-to-erasure process (see Section 7).

### Acceptance Criteria — Registration

**AC-ACCT-001**: Given a new user, when they submit a valid email and password, then an account is created in `Pending Verification` state and a verification email is sent.

**AC-ACCT-002**: Given a new user, when they submit an email that is already registered, then no new account is created and the user is informed that the email is in use (without revealing whether it is an SSO or password account, to prevent enumeration).

**AC-ACCT-003**: Given a user in `Pending Verification` state, when they click the verification link within the expiry window, then the account transitions to `Active` state.

**AC-ACCT-004**: Given a user in `Pending Verification` state, when the verification link has expired, then clicking it shows an error with an option to resend.

**AC-ACCT-005**: Given a new user, when they register via a supported SSO provider, then an account is created in `Active` state (email already verified by the identity provider).

**AC-ACCT-006**: Given a user registering via SSO, when an account with the same email already exists, then the user is prompted to link the SSO identity to their existing account (after re-authenticating with the existing method).

---

## 2. Onboarding

Onboarding is the first-run experience that follows successful registration and email verification.
It is not a separate domain — it is a phase within the account lifecycle.

### 2.1 Onboarding Flow

The onboarding flow guides new users through initial setup:

1. **Welcome screen** — Brand-appropriate welcome message per [Brand Application Standard](L2-001) Section 4 voice patterns.
1. **Role selection** — User selects their primary intent (Backer, Creator, or both). This does not permanently lock role assignment (see Section 3).
1. **Progressive profiling** — Collects optional profile information (display name, avatar, bio). Non-blocking — the user can skip and complete later.
1. **KYC trigger** (conditional) — If the selected role requires KYC verification (Creator), the onboarding flow triggers the KYC process as defined in [KYC](L4-005). The user is informed of the requirement and can begin or defer.
1. **Notification preferences** — Initial notification opt-in/opt-out. All categories default to opt-in except platform announcements (opt-out). Security alerts are always on.
1. **Completion** — User lands on the appropriate home surface based on selected role.

### 2.2 Onboarding State

- Onboarding progress is tracked per-account.
- Users who abandon onboarding mid-flow can resume where they left off on next login.
- Onboarding is considered complete when the user has selected a role and reached the home surface. Profile completion and KYC are not gates to onboarding completion.

### Acceptance Criteria — Onboarding

**AC-ACCT-007**: Given a newly verified user, when they log in for the first time, then they are presented with the onboarding flow.

**AC-ACCT-008**: Given a user in onboarding, when they select the Creator role, then a KYC verification prompt is displayed with the option to begin or defer.

**AC-ACCT-009**: Given a user who abandoned onboarding, when they log in again, then they resume from the step where they left off.

**AC-ACCT-010**: Given a user in onboarding, when they skip optional profiling steps, then onboarding completes and the user reaches the home surface.

---

## 3. Role Assignment and Management

Mars Mission Fund defines five roles as specified in the Product Vision & Mission (L1-001):

| Role                    | Description                                                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backer**              | Can browse proposals, make contributions, view contribution history and impact dashboards. Default role for all registered users.                                     |
| **Creator**             | Can submit proposal proposals, manage proposals, define milestones. Requires KYC verification.                                                                        |
| **Reviewer**            | Can review submitted proposals, approve or reject proposals, verify milestones. Assigned by Administrator.                                                            |
| **Administrator**       | Can manage users, assign roles, suspend accounts, configure platform settings. Assigned by Super Administrator.                                                       |
| **Super Administrator** | Full platform access. Can assign Administrator roles, manage system configuration, access audit logs. Provisioned through a controlled process (not self-assignable). |

### 3.1 Role Rules

- Every account has the **Backer** role by default upon reaching `Active` state.
- A user may hold multiple roles simultaneously (e.g., Backer + Creator).
- **Creator** role requires KYC verification status of `Verified` from [KYC](L4-005). The role may be assigned before KYC is complete, but Creator-gated features are inaccessible until verification succeeds.
- **Reviewer** and **Administrator** roles are assigned by an Administrator or Super Administrator.
- **Super Administrator** role is provisioned through a controlled process defined in [Security](L3-002). It cannot be self-assigned or assigned through the standard UI.
- Role changes are logged as state mutations per [Engineering Standard](L2-002) Section 1.7.
- Removing a role from a user immediately revokes access to all features gated by that role.

### Acceptance Criteria — Role Assignment

**AC-ACCT-011**: Given a newly activated account, when the user reaches `Active` state, then the Backer role is automatically assigned.

**AC-ACCT-012**: Given a user with Creator role but KYC status `Pending`, when they attempt to submit a proposal, then access is denied with a message directing them to complete KYC.

**AC-ACCT-013**: Given an Administrator, when they assign the Reviewer role to a user, then the user gains access to the review pipeline and the role change is logged.

**AC-ACCT-014**: Given an Administrator, when they attempt to assign the Super Administrator role, then the action is denied (Super Administrator provisioning is restricted).

**AC-ACCT-015**: Given a user with the Creator role, when the role is removed, then all Creator-gated features become immediately inaccessible.

---

## 4. Profile Management

### 4.1 Profile Data

| Field                     | Required           | Editable                   | Notes                                                                 |
| ------------------------- | ------------------ | -------------------------- | --------------------------------------------------------------------- |
| Email                     | Yes                | Yes (with re-verification) | Primary identifier. Change triggers verification of new email.        |
| Display name              | No                 | Yes                        | Shown on public-facing surfaces (proposal pages, contribution lists). |
| Avatar                    | No                 | Yes                        | File upload validated per [Engineering Standard](L2-002) Section 1.4. |
| Bio                       | No                 | Yes                        | Free-text, sanitised on input.                                        |
| Notification preferences  | Yes (defaults set) | Yes                        | See Section 4.2.                                                      |
| Contribution history view | Read-only          | N/A                        | Sourced from [Donor](L4-003). Displayed within account profile.       |
| KYC verification status   | Read-only          | N/A                        | Sourced from [KYC](L4-005). Displayed within account profile.         |

### 4.2 Notification Preferences

Users can configure notification preferences for the following categories:

- Proposal updates (for backed proposals)
- Milestone completions
- Contribution confirmations
- New proposal recommendations
- Account security alerts (mandatory — cannot be disabled)
- Platform announcements

Each category supports channel selection (in-app, email) where applicable.

**Rule**: Security-related notifications (login from new device, password change, MFA changes, suspicious activity) are always sent and cannot be disabled by the user.

### Acceptance Criteria — Profile Management

**AC-ACCT-016**: Given an authenticated user, when they update their display name, then the change is reflected on all public-facing surfaces and the update is logged.

**AC-ACCT-017**: Given an authenticated user, when they change their email address, then a verification email is sent to the new address and the old email remains active until the new one is verified.

**AC-ACCT-018**: Given an authenticated user, when they attempt to disable security notifications, then the option is not available (security notifications are mandatory).

**AC-ACCT-019**: Given an authenticated user, when they upload an avatar, then the file is validated for type, size, and content per [Engineering Standard](L2-002) Section 1.4, and served from a separate domain.

---

## 5. Session Management

Session management implements the policies defined in [Security](L3-002).
This section defines the account-domain behaviour; the underlying mechanisms (token format, signing, storage) are governed by L3-002.

### 5.1 Session Lifecycle

- A session is created upon successful authentication (password login, SSO callback, or MFA completion).
- Session tokens have a defined lifetime and refresh mechanism as specified in [Security](L3-002).
- Sessions are bound to a single device/user-agent. Concurrent sessions across multiple devices are permitted.
- Users can view and manage active sessions from their account settings.

### 5.2 Session Revocation

- A user may revoke any individual session or all sessions from account settings.
- Password change or reset revokes all active sessions except the current one.
- Administrative suspension revokes all active sessions immediately.
- MFA recovery (see Section 6.2) revokes all active sessions.

### 5.3 Elevated Sessions

Certain actions require session elevation (re-authentication within the current session):

- Changing email address
- Changing password
- Enrolling or removing MFA
- Modifying roles (for Administrators)
- Initiating account deactivation or deletion

The elevation mechanism and timeout are defined in [Security](L3-002).

### Acceptance Criteria — Session Management

**AC-ACCT-020**: Given an authenticated user, when they view active sessions, then all sessions are listed with device, location (approximate), and last active time.

**AC-ACCT-021**: Given an authenticated user, when they revoke a specific session, then that session is immediately invalidated and the corresponding device is logged out.

**AC-ACCT-022**: Given a user who has changed their password, when they are on another device, then that device's session is revoked and requires re-authentication.

**AC-ACCT-023**: Given a user performing an elevated action, when the session elevation has expired, then they are prompted to re-authenticate before proceeding.

---

## 6. Account Recovery

### 6.1 Password Reset

- User initiates reset from the login screen via "Forgot password".
- A reset link is sent to the registered email address.
- The reset link expires after 1 hour.
- Submitting a valid reset link with a new password that meets policy requirements updates the password and revokes all existing sessions.
- If MFA is enrolled, the password reset flow requires MFA confirmation before the new password takes effect.

**Anti-enumeration**: The reset request endpoint must return the same response regardless of whether the email is registered, to prevent account enumeration.

### 6.2 MFA Recovery

If a user loses access to their MFA device:

- Recovery codes (generated at MFA enrollment) can be used as a one-time bypass.
- If recovery codes are exhausted, the user must contact support and complete manual identity verification: provide government-issued photo ID matching the account name, plus answer account-specific challenge questions. An Administrator reviews and approves the recovery. All MFA recovery events are audit-logged per [Audit](L3-006).
- MFA recovery revokes all active sessions and requires the user to re-enrol MFA.

### 6.3 Locked Account Process

- After a configurable number of failed authentication attempts, the account is temporarily locked.
- Lock duration and threshold are defined in [Security](L3-002).
- The user is notified via email when their account is locked.
- After the lock period expires, the user may attempt login again.
- An Administrator can manually unlock an account.

### Acceptance Criteria — Account Recovery

**AC-ACCT-024**: Given a user who has forgotten their password, when they request a reset for a registered email, then a reset link is sent and the response does not reveal whether the email exists.

**AC-ACCT-025**: Given a user with a valid reset link, when they submit a new password meeting policy requirements, then the password is updated and all other sessions are revoked.

**AC-ACCT-026**: Given a user with MFA enrolled, when they use a recovery code, then they bypass MFA for that single authentication and the used code is invalidated.

**AC-ACCT-027**: Given a user who has exceeded failed login attempts, when the threshold is reached, then the account is temporarily locked and a notification email is sent.

**AC-ACCT-028**: Given a locked account, when the lock period expires, then the user can attempt authentication again.

---

## 7. Account Deactivation and Deletion

### 7.1 User-Initiated Deactivation

- A user may deactivate their account from account settings.
- Deactivation requires session elevation (re-authentication).
- Deactivation does not delete data. The account enters `Deactivated` state.
- Active proposals owned by the user must be resolved (completed, failed, or transferred) before deactivation is permitted.
- Active contributions in escrow are not affected by deactivation (the escrow lifecycle continues per [Payments](L4-004)).
- The user may reactivate within 90 days by logging in and confirming reactivation. After 90 days, the account transitions to `Deleted` and the GDPR erasure process (Section 7.2) is triggered automatically.

### 7.2 GDPR Right-to-Erasure (Deletion)

- A user may request full data deletion per GDPR Article 17.
- Data deletion is processed per the data lifecycle and retention policies defined in [Data Management](L3-004).
- The following data is erased: profile information, notification preferences, session history, and any PII associated with the account.
- The following data is retained in anonymised form where legally required: contribution records (financial reporting obligations), audit log entries (regulatory compliance — see [Audit](L3-006)).
- KYC documents are handled per the retention rules in [KYC](L4-005).
- Deletion is irreversible. The user is warned and must confirm.
- A confirmation email is sent when deletion is complete.

### 7.3 Data Portability

- Users may request an export of their personal data per GDPR Article 20.
- The export includes: profile data, contribution history, notification preferences, and account activity.
- Export format: both JSON and CSV. The user selects format at export request time.
- Export generation is asynchronous. The user is notified when the export is ready for download.
- Export download links expire after 48 hours and are secured per [Security](L3-002).

### Acceptance Criteria — Deactivation and Deletion

**AC-ACCT-029**: Given an authenticated user, when they deactivate their account, then the account enters `Deactivated` state and login is prevented.

**AC-ACCT-030**: Given a user with active proposals, when they attempt to deactivate, then they are informed that proposals must be resolved first.

**AC-ACCT-031**: Given a deactivated user, when they log in within the reactivation window, then they are prompted to reactivate and the account returns to `Active` state.

**AC-ACCT-032**: Given a user requesting data deletion, when they confirm the request, then all PII is erased, anonymised records are retained per legal requirements, and a confirmation email is sent.

**AC-ACCT-033**: Given a user requesting data export, when the export is generated, then they receive a notification with a time-limited secure download link containing their data in machine-readable format.

**AC-ACCT-034**: Given a deactivated account, when 90 days have elapsed since deactivation, then the account automatically transitions to `Deleted` state and the GDPR erasure process (Section 7.2) is triggered.

---

## 8. Interface Contracts

### 8.1 Account ↔ KYC ([KYC](L4-005))

**Account → KYC**:

- Account triggers the KYC process when a user selects or is assigned a role that requires verification (e.g., Creator).
- Account provides the user identity context (account ID, email, name) to the KYC domain.
- Account displays KYC verification status sourced from KYC.

**KYC → Account**:

- KYC publishes verification status changes (`Pending`, `In Review`, `Verified`, `Failed`, `Expired`) that Account consumes to gate role-specific features.
- KYC failure or expiry may trigger account-level restrictions (Creator features locked until re-verification).

**Contract**: Both domains reference the account ID as the shared identifier.
Status changes are communicated via the event/messaging pattern defined in [Architecture](L3-001).

### 8.2 Account ↔ Donor ([Donor](L4-003))

**Account → Donor**:

- Account provides identity context (account ID, display name, roles) consumed by the Donor domain for personalisation, contribution attribution, and recommendation engine inputs.

**Donor → Account**:

- Donor surfaces contribution history and impact data within the account profile (read-only, sourced from Donor domain).
- Donor does not modify account state.

**Contract**: Donor domain queries Account for identity context using the account ID.
Contribution data displayed in the account profile is fetched from the Donor domain's read API.

### 8.3 Account ↔ Proposal ([Proposal](L4-002))

**Account → Proposal**:

- Account provides role context (Creator, Reviewer, Administrator) that gates proposal workflows.
- A user must have the Creator role and KYC `Verified` status to submit a proposal.
- A user must have the Reviewer role to access the review pipeline.

**Proposal → Account**:

- Proposal references the account ID as the proposal owner (Creator).
- Proposal does not modify account state.

**Contract**: Proposal domain validates role and KYC status by querying Account at the point of action (proposal submission, review access).
The specific API contract (endpoint, payload) is to be defined in implementation.

### 8.4 Account ↔ Payments ([Payments](L4-004))

**Account → Payments**:

- Account provides the authenticated identity for payment operations.
- Payment methods are managed within the Payments domain, not Account.

**Payments → Account**:

- Payments does not modify account state.
- Active escrow status is checked during account deactivation (see Section 7.1).

**Contract**: Payments domain receives the authenticated account ID from the session context.
Escrow status queries during deactivation use the Payments read API.

---

## Change Log

| Date       | Version | Author | Summary                                                                                                                                                                                                                                                                                                               |
| ---------- | ------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| March 2026 | 0.1     | —      | Initial stub. Registration, onboarding, roles, profile, sessions, recovery, deactivation, data portability, interface contracts with KYC, Donor, Proposal, and Payments.                                                                                                                                              |
| March 2026 | 0.2     | —      | Resolved all open questions: verification link expiry (24h), password reset expiry (1h), SSO providers (Google, Microsoft), default notifications (all opt-in except announcements), reactivation window (90 days), export format (JSON + CSV), MFA recovery process (manual ID verification), no cooling-off period. |
| March 2026 | 0.3     | —      | Updated local demo scope note: replaced Clerk reference with custom stateless JWT stub description (no refresh, no revocation, JWT in localStorage, bcrypt-hashed demo passwords); Clerk/OIDC noted as theatre for the demo. |
