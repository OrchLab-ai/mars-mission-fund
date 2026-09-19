# Security

> **Spec ID**: L3-002
> **Version**: 0.5
> **Status**: Approved
> **Rate of Change**: Sprint-level / tech decisions
> **Depends On**: L1-001 (Product Vision & Mission), L2-002 (Engineering Standard), L3-001 (Architecture)
> **Depended On By**: L3-004 (tech/data-management.md), L3-006 (tech/audit.md), L4-001 (domain/account.md), L4-004 (domain/payments.md), L4-005 (domain/kyc.md)

---

## 1. Purpose

> **Local demo scope**: RBAC model, authentication via a custom stateless JWT/bcrypt stub (stateless, no refresh tokens, no revocation, JWT stored in localStorage), input validation, CSP headers, and the STRIDE threat model structure are **real** — they inform the local demo's auth implementation. Penetration testing, incident response procedures, breach notification workflows, certificate management, and compliance audit cadences are theatre. Session timeouts and lockout thresholds will use sensible defaults without formal review.

This spec defines the security architecture for Mars Mission Fund: threat model, control matrix, authentication and authorisation architecture, encryption standards, compliance mapping, session management, and incident response.
It implements the "Security as Foundation" principle from the [Product Vision & Mission](L1-001) and the security invariants defined in the [Engineering Standard](L2-002), Section 1.

**What this spec governs**:

- Threat model and security control matrix.
- Authentication architecture (OAuth 2.0 / OIDC, MFA).
- Authorisation architecture (RBAC model, five roles).
- Encryption standards and certificate management.
- Session management (token lifecycle, expiry, revocation).
- Compliance mapping (PCI DSS, GDPR, Australian Privacy Act).
- Penetration testing and security review cadence.
- Incident response plan (security-specific).
- Content Security Policy and security headers.

**What this spec does NOT cover**:

- System topology, service boundaries, and deployment — see [Architecture](L3-001).
- Data classification, retention, and anonymisation rules — see [Data Management](L3-004).
- Audit event schemas, log immutability, and retention — see [Audit](L3-006).
- Availability targets, failover, and operational incident response — see [Reliability](L3-003).
- Domain-specific payment security (PCI DSS SAQ-A boundary details) — see [Payments](L4-004).
- KYC document handling and identity verification — see [KYC](L4-005).

---

## 2. Inherited Constraints

This spec inherits all constraints from the [Engineering Standard](L2-002).
The following sections are directly implemented by this spec:

| L2-002 Section                     | Constraint                                                             | How This Spec Implements It                                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1.1 Encryption                     | TLS 1.3 minimum; AES-256 at rest for sensitive data                    | Section 6 defines encryption standards, key management, and certificate lifecycle                                 |
| 1.2 Data Access                    | Parameterised queries only                                             | Inherited by all services; enforced by data access layer defined in [Architecture](L3-001), Section 4.2           |
| 1.3 Secrets Management             | Secrets via dedicated service, injected at runtime                     | Section 6.3 defines secret handling requirements; technology choice recorded in [Architecture](L3-001), Section 8 |
| 1.4 Input Validation               | All external input validated at system boundary; CSP headers mandatory | Section 7 defines CSP policy and input validation standards                                                       |
| 1.5 Authentication & Authorisation | Every endpoint authenticated; MFA for financial and admin operations   | Sections 4 and 5 define the full authentication and authorisation architecture                                    |
| 1.6 Dependency Security            | Vulnerability scanning on every build; CVE response SLAs               | Section 11 defines security review cadence and dependency scanning integration                                    |
| 1.7 Logging & Auditability         | Every state mutation logged; sensitive data never logged               | Jointly implemented with [Audit](L3-006); this spec defines what constitutes a security-relevant event            |

This spec also inherits from [Architecture](L3-001):

| L3-001 Section       | Constraint                                          | How This Spec Implements It                               |
| -------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| 3.2 API Gateway      | TLS termination and token validation at the gateway | Section 4.3 defines token validation rules at the gateway |
| 6.3 Service Identity | Every service-to-service call authenticated         | Section 5.4 defines the service identity trust model      |

---

## 3. Threat Model

This section uses the STRIDE framework to categorise threats against Mars Mission Fund.
The threat model is a living document — it must be reviewed and updated whenever the system architecture changes or a new domain is added.

### 3.1 Threat Categories

| STRIDE Category            | Description                                                                      | Primary Targets                                                                           |
| -------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Spoofing**               | An attacker impersonates a legitimate user, service, or system component         | Authentication endpoints, service-to-service calls, API Gateway                           |
| **Tampering**              | An attacker modifies data in transit or at rest                                  | Payment transactions, proposal data, escrow balances, KYC documents                       |
| **Repudiation**            | An actor denies performing an action, and the system cannot prove otherwise      | Financial transactions, proposal approvals, disbursement authorisations, admin operations |
| **Information Disclosure** | Sensitive data is exposed to unauthorised parties                                | PII, financial data, KYC documents, authentication credentials, audit logs                |
| **Denial of Service**      | An attacker degrades or prevents legitimate access to the platform               | API Gateway, authentication service, payment processing                                   |
| **Elevation of Privilege** | An attacker gains access to resources or operations beyond their authorised role | Role assignment, admin endpoints, proposal review pipeline, disbursement approval         |

### 3.2 Trust Boundaries

| Boundary                      | Description                                           | Controls                                                                                   |
| ----------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| External → API Gateway        | All traffic from end users, external APIs, webhooks   | TLS 1.3, authentication, rate limiting, input validation, CSP headers                      |
| API Gateway → Domain Services | Validated requests forwarded to internal services     | Token validation, correlation ID propagation, authorisation enforcement                    |
| Service → Service             | Inter-service communication within the platform       | Service identity authentication (see Section 5.4), authorisation policies                  |
| Service → External Provider   | Calls to payment gateway, KYC provider, email service | Adapter abstraction per [Architecture](L3-001), Section 3.3; TLS 1.3; credential isolation |
| Service → Data Store          | Database and object storage access                    | Data access layer enforcement, parameterised queries, encryption at rest                   |
| Audit boundary                | Audit log ingestion and storage                       | Append-only writes, no delete/modify capability — see [Audit](L3-006)                      |

### 3.3 Security Control Matrix

| Threat                              | Trust Boundary                | Control                                                                                          | Spec Reference                       | Priority |
| ----------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------ | -------- |
| **Spoofing**                        |                               |                                                                                                  |                                      |          |
| User impersonation                  | External → API Gateway        | Stateless JWT validation with bcrypt credential check (demo stub; production will add MFA)        | Section 4                            | Critical |
| Session hijacking                   | External → API Gateway        | Short-lived access tokens (5 min), secure HttpOnly cookies, session binding to device/user-agent | Section 4.3, 4.4                     | Critical |
| Credential stuffing                 | External → API Gateway        | Account lockout after 3 failed attempts, rate limiting on auth endpoints (10/min)                | Section 4.5, 7.3                     | Critical |
| Token forgery                       | API Gateway → Domain Services | RS256/ES256 JWT signature validation, issuer and expiry checks at gateway                        | Section 4.3                          | Critical |
| Service impersonation               | Service → Service             | Not applicable in current single-unit deployment; JWT service tokens if services are split       | Section 5.4, [Architecture](L3-001)  | Critical |
| Webhook spoofing                    | Service → External Provider   | Stripe webhook signature verification (HMAC-SHA256) before processing                            | [Payments](L4-004), Section 3.3      | Critical |
| **Tampering**                       |                               |                                                                                                  |                                      |          |
| Payment manipulation                | Service → External Provider   | Stripe tokenisation — platform never handles raw card data; signed API requests                  | [Payments](L4-004)                   | Critical |
| Data at rest modification           | Service → Data Store          | AES-256 encryption at rest via AWS KMS; envelope encryption with DEK/KEK                         | Section 6.1                          | Critical |
| Data in transit interception        | All boundaries                | TLS 1.3 minimum on all connections, including internal service communication                     | Section 6.2                          | Critical |
| Escrow ledger manipulation          | Service → Data Store          | Append-only immutable ledger; double-entry bookkeeping; daily reconciliation against Stripe      | [Payments](L4-004), [Audit](L3-006)  | Critical |
| Request parameter tampering         | External → API Gateway        | Input validation at system boundary; allowlist validation; Zod schema enforcement                | Section 7.1                          | High     |
| **Repudiation**                     |                               |                                                                                                  |                                      |          |
| Financial action denial             | All internal boundaries       | Immutable audit logging of all payment state mutations with actor, timestamp, correlation ID     | [Audit](L3-006)                      | Critical |
| Role change denial                  | API Gateway → Domain Services | Security-critical audit events for all role assignments and changes                              | Section 5.2, [Audit](L3-006)         | Critical |
| Proposal approval denial            | API Gateway → Domain Services | Audit trail for all proposal review decisions with reviewer identity                             | [Audit](L3-006)                      | High     |
| Disbursement approval denial        | API Gateway → Domain Services | Dual-approval workflow with independent audit entries per approver                               | [Payments](L4-004), Section 7.2      | Critical |
| **Information Disclosure**          |                               |                                                                                                  |                                      |          |
| PII exposure                        | All boundaries                | Data classification scheme; field-level encryption for sensitive fields; log sanitisation        | Section 6, [Data Management](L3-004) | Critical |
| Card data exposure                  | External → API Gateway        | SAQ-A scope — card data never enters platform; Stripe Elements handles client-side               | [Payments](L4-004), Section 8.1      | Critical |
| KYC document exposure               | Service → Data Store          | Encrypted at rest (AES-256); access restricted to KYC service; access logged                     | [KYC](L4-005), Section 6.1           | Critical |
| Credential leakage                  | All boundaries                | Secrets managed via AWS KMS; injected at runtime; never logged, committed, or passed as CLI args | Section 6.3                          | Critical |
| Error message information leak      | External → API Gateway        | Generic error responses to external clients; detailed errors logged internally only              | Section 7.1                          | Medium   |
| Referrer leakage                    | External → API Gateway        | `Referrer-Policy: strict-origin-when-cross-origin` header                                        | Section 7.2                          | Medium   |
| **Denial of Service**               |                               |                                                                                                  |                                      |          |
| API flooding                        | External → API Gateway        | Rate limiting: 100/min general, 10/min auth, 20/min financial; `Retry-After` headers             | Section 7.3                          | High     |
| Authentication endpoint abuse       | External → API Gateway        | Stricter rate limits on auth endpoints; account lockout with escalating duration                 | Section 4.5, 7.3                     | High     |
| Resource exhaustion via file upload | External → API Gateway        | File type validation (magic bytes), size limits, storage in separate domain                      | Section 7.1                          | High     |
| **Elevation of Privilege**          |                               |                                                                                                  |                                      |          |
| Unauthorised role assignment        | API Gateway → Domain Services | RBAC enforcement; Reviewer/Admin assigned by Admin; Super Admin by Super Admin only with MFA     | Section 5.2                          | Critical |
| Horizontal privilege escalation     | API Gateway → Domain Services | Resource-level authorisation in domain services (e.g., creators manage only own proposals)       | Section 5.3                          | Critical |
| Vertical privilege escalation       | API Gateway → Domain Services | API-layer authorisation on every request; role claims validated from access token                | Section 5.3                          | Critical |
| UI-only access control bypass       | External → API Gateway        | Authorisation enforced at API layer, not UI; UI role-based hiding is cosmetic only               | Section 5.3                          | Critical |
| MFA bypass on privileged actions    | API Gateway → Domain Services | MFA required for all financial actions, admin operations, and account recovery                   | Section 4.2                          | Critical |

---

## 4. Authentication Architecture

### 4.1 Protocol

Authentication is based on OAuth 2.0 with OpenID Connect (OIDC) for identity.

- **Identity Provider (IdP)**: Custom JWT stub (per [Tech Stack](L3-008)).
  The demo uses `jsonwebtoken` for stateless token generation/validation and `bcryptjs` for password hashing; SSO, session management, and MFA are not implemented in the local demo.
- All user authentication flows use the Authorization Code flow with PKCE (Proof Key for Code Exchange).
- Implicit flow and Resource Owner Password Credentials flow are prohibited.

### 4.2 Multi-Factor Authentication (MFA)

Per [Engineering Standard](L2-002), Section 1.5, MFA is required for:

- All financial actions (contributions, disbursements, refunds).
- All administrative operations (role assignment, proposal approval, system configuration).
- Account recovery.
- Changes to authentication settings (password change, MFA method change).

Supported MFA methods:

| Method                              | Use Case                                                | Notes                                                           |
| ----------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| TOTP (Time-Based One-Time Password) | Primary MFA method for all users                        | MUST comply with RFC 6238; 30-second time step; SHA-256 minimum |
| WebAuthn / FIDO2                    | Recommended for administrative and high-privilege users | Hardware security keys and platform authenticators supported    |
| Recovery codes                      | Account recovery when primary MFA is unavailable        | Single-use; 10 codes generated at MFA enrolment; stored hashed  |

SMS-based OTP is not supported as an MFA method due to known vulnerabilities (SIM swapping, SS7 attacks).

### 4.3 Token Architecture

| Token Type    | Purpose                                             | Lifetime             | Storage                                                                          |
| ------------- | --------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| Access token  | Authorises API requests                             | 5 minutes            | Memory only (never persisted to disk or local storage)                           |
| Refresh token | Obtains new access tokens without re-authentication | 1 day                | Secure, HttpOnly cookie; server-side reference validated against revocation list |
| ID token      | Carries identity claims (OIDC)                      | Same as access token | Memory only                                                                      |

- Access tokens are JWTs signed with RS256 (minimum 2048-bit RSA) or ES256.
- The API Gateway validates token signatures, expiry, and issuer before forwarding requests to domain services per [Architecture](L3-001), Section 3.2.
- Tokens include the user's role claims for authorisation enforcement (see Section 5).

### 4.4 Session Management

- Sessions are bound to a single device/user-agent.
- Concurrent session limit: unlimited. Users may have any number of active sessions across devices.
- Session revocation is immediate upon: password change, MFA method change, account deactivation, explicit logout, or administrator-initiated revocation.
- Idle session timeout: 15 minutes of inactivity.
- Absolute session timeout: 8 hours regardless of activity.
- All active sessions are visible to the user in their account settings, with the ability to revoke individual sessions.

### 4.5 Account Lockout

- After 3 consecutive failed authentication attempts, the account is temporarily locked.
- Lockout duration escalates with repeated lockouts (e.g., 5 minutes, 15 minutes, 1 hour).
- Account lockout events are logged as security events and trigger alerts per [Audit](L3-006).
- Lockout resets after successful authentication or administrator intervention.
- Lockout applies per-account, not per-IP, to prevent credential stuffing without enabling account denial-of-service at the IP level.

---

## 5. Authorisation Architecture

### 5.1 RBAC Model

Mars Mission Fund uses Role-Based Access Control (RBAC) with five roles defined in the [Product Vision & Mission](L1-001):

| Role                    | Description                                       | Typical Capabilities                                                                                                                 |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Backer**              | A user who contributes funds to proposals         | Browse proposals, make contributions, view own contribution history, manage own profile                                              |
| **Creator**             | A user who creates and manages proposals          | All Backer capabilities + create proposals, manage own proposals, define milestones, request disbursements                           |
| **Reviewer**            | A user who reviews and approves/rejects proposals | All Backer capabilities + review submitted proposals, approve/reject, request changes                                                |
| **Administrator**       | A user who manages platform operations            | All Reviewer capabilities + manage users, assign roles (except Super Administrator), view audit logs, manage platform settings       |
| **Super Administrator** | Highest-privilege platform user                   | All Administrator capabilities + assign Administrator/Super Administrator roles, access compliance reports, manage security settings |

### 5.2 Role Assignment Rules

- New users are assigned the Backer role by default upon registration.
- Creator role is granted after KYC verification — see [KYC](L4-005).
- Reviewer role is assigned by an Administrator or Super Administrator.
- Administrator role is assigned by a Super Administrator only.
- Super Administrator role is assigned by another Super Administrator only, with MFA confirmation from both parties.
- Role changes are logged as security-critical audit events per [Audit](L3-006).

### 5.3 Permission Enforcement

- Authorisation is enforced at the API layer, not the UI layer.
  The UI may hide elements based on role, but the API must independently validate permissions on every request.
- Permissions are evaluated against the role claims in the access token (Section 4.3).
- Resource-level authorisation (e.g., "this Creator can only manage their own proposals") is enforced by the domain service, not the API Gateway.
- All authorisation failures are logged with: actor identity, requested resource, requested action, and the reason for denial.

### 5.4 Service-to-Service Authorisation

- Each service has a unique identity per [Architecture](L3-001), Section 6.3.
- Per [Architecture](L3-001), the current deployment is a single unit, making service-to-service authentication not applicable. If services are split in future, JWT service tokens are the recommended mechanism (see [Architecture](L3-001), Open Question 6).
- Service authorisation policies follow the principle of least privilege: each service is authorised only for the specific endpoints it needs to call.
- Service authorisation policies are defined declaratively and version-controlled.

---

## 6. Encryption Standards

### 6.1 Encryption at Rest

Per [Engineering Standard](L2-002), Section 1.1:

- All sensitive data is encrypted at rest using AES-256.
- "Sensitive data" classification is defined in [Data Management](L3-004).
  At minimum: PII, financial data, authentication credentials, KYC documents.
- Encryption key management: AWS KMS. Note: this is a workshop project and will not reach production; AWS KMS is selected for consistency with the AWS-based tech stack.
- Key rotation policy: encryption keys must be rotated at least annually, or immediately upon suspected compromise.
- Envelope encryption is used where supported: data is encrypted with a data encryption key (DEK), and the DEK is encrypted with a key encryption key (KEK) managed by the KMS.

### 6.2 Encryption in Transit

Per [Engineering Standard](L2-002), Section 1.1:

- All communication uses TLS 1.3 (minimum).
  TLS 1.0, 1.1, and 1.2 are not supported.
- No exceptions for internal service-to-service communication.
- TLS termination occurs at the API Gateway for external traffic per [Architecture](L3-001), Section 3.2.
- Internal service-to-service communication uses TLS regardless of whether a service mesh provides it — defence in depth.
- Certificate management: AWS Certificate Manager (ACM) for automated certificate provisioning and renewal.

### 6.3 Secrets Management

Per [Engineering Standard](L2-002), Sections 1.3 and 7.3:

- All secrets (API keys, database credentials, encryption keys, signing certificates) are managed through the secrets management service recorded in [Architecture](L3-001), Section 8.
- Secrets are injected at runtime via environment variables.
- Secrets are never committed to version control, logged, passed as CLI arguments, or written to disk by application code.
- Secret rotation must be possible without application redeployment.
- Applications must handle secret rotation gracefully (re-read on expiry, not crash).
- Secret access is logged as an audit event.

---

## 7. Input Validation & Security Headers

### 7.1 Input Validation

Per [Engineering Standard](L2-002), Section 1.4:

- All external input is validated, sanitised, and type-checked at the system boundary before any processing.
- "External" includes: user input, API requests, webhook payloads, file uploads, URL parameters, and any data originating outside the trust boundary.
- Validation rules:
  - Accept-list (allowlist) validation is preferred over deny-list (blocklist).
  - String inputs are length-limited and character-set restricted where the domain allows.
  - Numeric inputs are range-checked.
  - File uploads are validated for type (magic bytes, not just extension), size, and content.
  - Uploaded files are stored in a separate domain from the application per [Engineering Standard](L2-002), Section 1.4.

### 7.2 Security Headers

All web responses must include the following security headers:

| Header                      | Value                                                                                                                                                                                                                 | Purpose                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `Content-Security-Policy`   | `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.clerk.accounts.dev; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` | Mitigate XSS and data injection      |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload`                                                                                                                                                                        | Enforce HTTPS                        |
| `X-Content-Type-Options`    | `nosniff`                                                                                                                                                                                                             | Prevent MIME-type sniffing           |
| `X-Frame-Options`           | `DENY`                                                                                                                                                                                                                | Prevent clickjacking                 |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                                                                                                                                                                                     | Control referrer information leakage |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=(), payment=()`                                                                                                                                                                | Restrict browser feature access      |
| `Cache-Control`             | `no-store` for authenticated responses                                                                                                                                                                                | Prevent caching of sensitive data    |

### 7.3 Rate Limiting

- Rate limiting is enforced at the API Gateway per [Architecture](L3-001), Section 3.2.
- Rate limits apply per-user (authenticated) and per-IP (unauthenticated pre-auth endpoints).
- Rate limit thresholds (per user or per IP for unauthenticated endpoints):
  - General API endpoints: 100 requests per minute.
  - Authentication endpoints (login, register, password reset): 10 requests per minute.
  - Financial action endpoints (contribute, disburse, refund): 20 requests per minute.
  - These thresholds are sized for a B2C application serving tens to low thousands of users.
- Authentication endpoints have stricter rate limits to mitigate brute-force attacks.
- Rate limit responses include `Retry-After` headers per HTTP standards.

---

## 8. Compliance Mapping

### 8.1 PCI DSS

Mars Mission Fund targets **SAQ-A** compliance scope by delegating all cardholder data handling to the payment gateway.

Payment gateway: **Stripe** (per [Payments](L4-004) and [Tech Stack](L3-008)).
Client-side tokenisation via **Stripe Elements** — the platform never stores, processes, or transmits raw cardholder data.

| SAQ-A Requirement                                                             | Implementation                                                                                                  | Spec Reference                             |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **2.1** — No cardholder data stored, processed, or transmitted by MMF systems | All card data handled by Stripe Elements client-side; platform receives only Stripe payment method tokens       | [Payments](L4-004), Section 4              |
| **2.2** — All payment pages delivered via HTTPS                               | TLS 1.3 enforced on all connections; HSTS with preload                                                          | Section 6.2, 7.2                           |
| **3.1** — Restrict inbound traffic to necessary connections                   | API Gateway rate limiting; firewall rules restrict ingress to HTTPS only                                        | Section 7.3, [Architecture](L3-001)        |
| **3.2** — Restrict outbound traffic to payment processor                      | Stripe API calls via adapter; outbound restricted to Stripe API endpoints and other declared external providers | [Payments](L4-004), [Architecture](L3-001) |
| **6.1** — Security patches applied in timely manner                           | Dependency vulnerability scanning on every CI build; CVSS 9.0+ blocks merge                                     | Section 11                                 |
| **6.2** — Protection against known vulnerabilities                            | SAST on every CI build; DAST weekly in staging; bi-annual penetration testing                                   | Section 11                                 |
| **7.1** — Restrict access to system components and cardholder data            | RBAC with five roles; MFA for financial and admin operations; API-layer authorisation                           | Sections 4, 5                              |
| **7.2** — Unique ID for each person with access                               | Accounts table with JWT-based identity; no shared or generic accounts                                           | Section 4.1                                |
| **8.1** — Identify and authenticate access to system components               | OAuth 2.0 / OIDC authentication; MFA on financial actions                                                       | Section 4                                  |
| **9.1** — Physical security of payment processing areas                       | Not applicable — no cardholder data processed or stored in MMF infrastructure                                   | N/A                                        |
| **11.1** — Test security systems and processes regularly                      | Security review cadence: SAST/DAST continuous, penetration testing bi-annually, threat model review quarterly   | Section 11                                 |
| **11.2** — Maintain an information security policy                            | This spec (L3-002) serves as the security policy; reviewed on architectural change or quarterly                 | This spec                                  |
| **12.1** — Monitor all access to network resources and cardholder data        | Immutable audit logs for all payment-related events; all authorisation failures logged                          | [Audit](L3-006), Section 5.3               |

Jointly owned with [Payments](L4-004).

### 8.2 GDPR

| GDPR Right / Obligation                  | Implementation                                                            | Spec Reference                    |
| ---------------------------------------- | ------------------------------------------------------------------------- | --------------------------------- |
| Lawful basis for processing              | Consent management and contractual necessity documented per data type     | [Data Management](L3-004)         |
| Right to access (Art. 15)                | Data export API for user's own data                                       | [Account](L4-001)                 |
| Right to erasure (Art. 17)               | Anonymisation workflow; retention overrides for legal obligations         | [Data Management](L3-004)         |
| Right to rectification (Art. 16)         | Profile editing; corrections to KYC data via re-submission                | [Account](L4-001), [KYC](L4-005)  |
| Data portability (Art. 20)               | Machine-readable export of user-provided data                             | [Account](L4-001)                 |
| Breach notification (Art. 33, 34)        | 72-hour notification process                                              | Section 10.3                      |
| Data protection by design (Art. 25)      | Encryption at rest and in transit, field-level encryption, access control | Sections 5, 6                     |
| Data Protection Impact Assessment (DPIA) | Required for KYC processing, payment processing, profiling                | [KYC](L4-005), [Payments](L4-004) |

### 8.3 Australian Privacy Act

| Principle                                            | Implementation                                        | Spec Reference                   |
| ---------------------------------------------------- | ----------------------------------------------------- | -------------------------------- |
| APP 1 — Open and transparent management              | Privacy policy, data handling documentation           | [Data Management](L3-004)        |
| APP 3 — Collection of solicited personal information | Collect only what is necessary for platform functions | [Account](L4-001), [KYC](L4-005) |
| APP 6 — Use or disclosure                            | Data used only for the purpose it was collected       | [Data Management](L3-004)        |
| APP 8 — Cross-border disclosure                      | Data residency and transfer controls                  | [Data Management](L3-004)        |
| APP 11 — Security of personal information            | Encryption, access control, secure destruction        | Sections 5, 6                    |
| APP 12 — Access to personal information              | User data access and export                           | [Account](L4-001)                |
| APP 13 — Correction of personal information          | Profile editing and correction workflows              | [Account](L4-001)                |
| Notifiable Data Breaches scheme                      | Mandatory breach notification to OAIC                 | Section 10.3                     |

---

## 9. Session Management

> This section expands on the token and session architecture defined in Section 4.3 and 4.4.

### 9.1 Token Lifecycle

```text
[User authenticates] → [Access token + Refresh token issued]
        │
        ├── Access token expires → [Refresh token used to obtain new access token]
        │                                   │
        │                                   ├── Refresh token valid → [New access + refresh token pair issued]
        │                                   └── Refresh token expired/revoked → [Re-authentication required]
        │
        ├── Security event (password change, MFA change) → [All tokens revoked; re-authentication required]
        │
        └── Explicit logout → [Access + refresh tokens revoked]
```

### 9.2 Token Revocation

- A server-side revocation list (or equivalent mechanism) tracks revoked tokens.
- The API Gateway checks the revocation list on every request.
- Revocation is propagated within 30 seconds across all gateway instances.
- Revocation events are logged as security audit events per [Audit](L3-006).

### 9.3 Refresh Token Rotation

- Refresh tokens are rotated on every use: when a refresh token is exchanged for a new access token, a new refresh token is also issued and the previous one is invalidated.
- If a previously invalidated refresh token is presented, all tokens for that session are revoked (potential token theft detected).

---

## 10. Incident Response Plan

This section covers security-specific incident response.
Operational incident response (availability, performance degradation) is defined in [Reliability](L3-003).

### 10.1 Severity Classification

| Severity     | Description                                                                                  | Examples                                                                                 | Response Time                 |
| ------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------- |
| **Critical** | Active breach, data exfiltration, or exploitation in progress                                | Unauthorised access to PII or financial data, payment system compromise, credential leak | Immediate (within 15 minutes) |
| **High**     | Confirmed vulnerability being actively exploited or high likelihood of imminent exploitation | Unpatched critical CVE in production, privilege escalation vulnerability discovered      | Within 1 hour                 |
| **Medium**   | Vulnerability identified, not yet exploited; security control degradation                    | Failed penetration test finding, misconfigured security header, expired certificate      | Within 24 hours               |
| **Low**      | Minor security improvement or hardening opportunity                                          | Non-critical dependency update, security best practice recommendation                    | Within 1 sprint               |

### 10.2 Response Process

1. **Detection & Triage**: Security event detected via monitoring, audit log analysis, or external report.
   Assign severity.
   Notify the security incident response team.
1. **Containment**: Isolate affected systems.
   Revoke compromised credentials.
   Block malicious actors at the network edge.
1. **Investigation**: Determine scope of impact, root cause, and affected data/users.
   Preserve forensic evidence (logs, snapshots).
1. **Remediation**: Fix the vulnerability or close the attack vector.
   Deploy patches.
   Rotate affected secrets.
1. **Recovery**: Restore affected services to normal operation.
   Verify integrity of affected data.
1. **Post-incident review**: Conduct a blameless post-mortem within 5 business days.
   Document findings, root cause, and preventive actions.
   Update threat model (Section 3) if new threats were identified.

### 10.3 Breach Notification

- **GDPR (Art. 33)**: Supervisory authority notified within 72 hours of becoming aware of a breach involving personal data.
- **GDPR (Art. 34)**: Affected individuals notified without undue delay if breach is likely to result in high risk.
- **Australian Notifiable Data Breaches scheme**: OAIC and affected individuals notified as soon as practicable after becoming aware of an eligible data breach.
- Notification templates are maintained in the incident response runbook and include: affected data summary, remediation steps taken, contact information for further enquiries, and regulatory body references.
- Escalation chain: Engineering Lead → Security Lead → CTO → Legal Counsel → CEO. All escalation contacts are maintained in an internal directory with backup contacts.

---

## 11. Security Review & Testing Cadence

| Activity                                    | Frequency                                                  | Scope                                                                 | Output                                                                                         |
| ------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Dependency vulnerability scan               | Every CI build                                             | All direct and transitive dependencies                                | Automated; blocks merge for CVSS 9.0+ per [Engineering Standard](L2-002), Section 1.6          |
| Static application security testing (SAST)  | Every CI build                                             | All application code                                                  | Automated; integrated into CI pipeline                                                         |
| Dynamic application security testing (DAST) | Weekly in staging                                          | Running application in staging environment                            | Automated scan report                                                                          |
| Penetration test — external                 | Bi-annually                                                | External attack surface                                               | Third-party report; findings triaged by severity                                               |
| Penetration test — internal                 | Bi-annually                                                | Internal services, privilege escalation, lateral movement             | Third-party report                                                                             |
| Threat model review                         | On architectural change or quarterly (whichever is sooner) | Section 3 of this spec                                                | Updated threat model                                                                           |
| Security code review                        | Every PR touching security surfaces                        | Authentication, authorisation, payment flows, encryption, data access | Second reviewer with security domain expertise per [Engineering Standard](L2-002), Section 3.4 |
| Secret rotation audit                       | Quarterly                                                  | All secrets in the secrets management service                         | Verification that rotation policies are followed                                               |
| Compliance review                           | Annually                                                   | PCI DSS SAQ-A, GDPR, Australian Privacy Act                           | Compliance report                                                                              |

---

## 12. Interface Contracts

### 12.1 Security <> Architecture (L3-001)

- [Architecture](L3-001) defines the service topology, API Gateway, and communication patterns.
  This spec defines the authentication/authorisation mechanisms, token formats, and encryption that operate within that topology.
- [Architecture](L3-001) defines the API Gateway as the TLS termination and token validation point.
  This spec defines the token format, validation rules, and MFA enforcement at the gateway.
- Service identity mechanism is jointly owned: [Architecture](L3-001) defines the pattern; this spec defines the credentials, trust model, and authorisation policies.
- Reference: [Architecture](L3-001), Section 11.1.

### 12.2 Security <> Data Management (L3-004)

- This spec defines encryption standards and access controls.
  [Data Management](L3-004) defines the data classification scheme that determines which data requires encryption and at what level.
- GDPR compliance mapping (Section 8.2) references data retention, anonymisation, and data lifecycle policies owned by [Data Management](L3-004).
- Data access logging requirements are jointly owned: this spec defines what constitutes a security-relevant access event; [Data Management](L3-004) defines access patterns per classification level.

### 12.3 Security <> Audit (L3-006)

- This spec defines which events are security-critical and must be logged (authentication attempts, authorisation failures, role changes, token revocations, security incidents).
- [Audit](L3-006) defines the immutable logging architecture, event schema, retention policies, and access controls on audit data.
- Incident response (Section 10) depends on audit log availability and integrity guaranteed by [Audit](L3-006).

### 12.4 Security <> Reliability (L3-003)

- Incident response is split: this spec owns security incident response (Section 10); [Reliability](L3-003) owns operational incident response.
- DDoS mitigation and rate limiting (Section 7.3) overlap with availability protection defined in [Reliability](L3-003).

### 12.5 Security <> Account (L4-001)

- This spec defines the authentication and session architecture.
  [Account](L4-001) implements the user-facing registration, login, MFA enrolment, password management, and session visibility workflows.
- Role assignment rules (Section 5.2) are enforced by [Account](L4-001).

### 12.6 Security <> Payments (L4-004)

- This spec defines the PCI DSS SAQ-A compliance boundary (Section 8.1).
  [Payments](L4-004) implements the payment tokenisation, gateway integration, and cardholder data isolation that maintain that boundary.
- MFA requirement for financial actions (Section 4.2) is enforced in payment flows defined by [Payments](L4-004).

### 12.7 Security <> KYC (L4-005)

- This spec defines encryption and access control requirements for identity documents.
  [KYC](L4-005) implements the document handling, storage, and verification workflows.
- Creator role grant depends on KYC verification (Section 5.2).
  [KYC](L4-005) defines the verification lifecycle and triggers.
- GDPR and Australian Privacy Act compliance for identity data is jointly owned between this spec, [Data Management](L3-004), and [KYC](L4-005).

---

## 13. Change Log

| Date       | Version | Author | Summary                                                                                                                                                                                                                                                                                                                                       |
| ---------- | ------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| March 2026 | 0.1     | —      | Initial stub. STRIDE threat model, security control matrix, OAuth 2.0/OIDC authentication, RBAC with five roles, encryption standards, session management, PCI DSS/GDPR/Australian Privacy Act compliance mapping, incident response plan, security review cadence.                                                                           |
| March 2026 | 0.2     | —      | Resolved OQ-1: Clerk selected as Identity Provider per L3-008.                                                                                                                                                                                                                                                                                |
| March 2026 | 0.3     | —      | Resolved all remaining open questions (OQ-2 through OQ-14). Access token 5 min, refresh token 1 day, unlimited sessions, 15 min idle / 8 hr absolute timeout, 3-attempt lockout, AWS KMS + ACM, CSP directives, rate limits, 30s revocation propagation, bi-annual pen testing, breach notification escalation chain. Status moved to Review. |
| March 2026 | 0.4     | —      | Expanded Security Control Matrix (Section 3.3) with comprehensive controls across all STRIDE categories and trust boundaries. Expanded PCI DSS SAQ-A mapping (Section 8.1) for Stripe gateway. Removed placeholder notes.                                                                                                                     |
| March 2026 | 0.5     | —      | Removed Clerk references from local demo scope note, threat-control matrix, IdP definition, and PCI DSS 7.2 row; replaced with custom JWT/bcrypt stub description.                                                                                                                                                                           |
