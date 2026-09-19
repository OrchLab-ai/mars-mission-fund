# Data Management

> **Spec ID**: L3-004
> **Version**: 0.2
> **Status**: Approved
> **Rate of Change**: Sprint-level / tech decisions
> **Depends On**: L2-002 (Engineering Standard), L3-001 (Architecture), L3-002 (Security)
> **Depended On By**: L4-004 (domain/payments.md), L4-005 (domain/kyc.md)

---

## Purpose

> **Local demo scope**: Data classification scheme, data access layer patterns, schema migration strategy, and the right-to-erasure workflow design are **real** — they inform the local demo's data model. Retention enforcement automation, tiered storage, backup verification, data residency, and cross-border transfer mechanisms are theatre. The local demo uses a single PostgreSQL instance with no archival pipeline.

This spec governs how data is classified, stored, accessed, retained, archived, anonymised, backed up, recovered, and migrated across the Mars Mission Fund platform.

**In scope**: data classification scheme, retention policies, data lifecycle management, anonymisation and pseudonymisation, backup and recovery, data access patterns and controls, schema migration strategy, and data residency.

**Out of scope**:

- Threat models and compliance control matrices — governed by [Security](L3-002).
- Audit log architecture and immutability guarantees — governed by [Audit](L3-006).
- Infrastructure topology and storage technology selection — governed by [Architecture](L3-001).
- Backup frequency and failover mechanisms — governed by [Reliability](L3-003); this spec implements the data-specific requirements defined there.

---

## Inherited Constraints

From [Engineering Standard](L2-002):

- **Section 1.1 (Encryption)**: All sensitive data encrypted at rest using AES-256.
  Sensitivity is defined by the classification scheme in this spec.
- **Section 1.2 (Data Access)**: All database queries use parameterised queries or prepared statements.
  All data access goes through a data access layer enforcing parameterisation, logging, and access control.
- **Section 1.7 (Logging & Auditability)**: Every state mutation is logged.
  Sensitive data is never logged — resource identifiers only.
- **Section 6.1 (Structured Logging)**: PII, financial data, and credentials must never appear in log entries.
- **Section 7.4 (Deployments)**: Database migrations must be backward-compatible — the previous application version must function against the new schema.

From [Security](L3-002):

- RBAC model and access control policies defined in L3-002 govern who can access each data classification level (see Section 5).
- Encryption key management practices from L3-002 apply to all encryption at rest and in transit defined in this spec.
- GDPR and Australian Privacy Act compliance requirements from L3-002 inform retention and anonymisation rules.

---

## 1. Data Classification Scheme

All data in the Mars Mission Fund platform is classified into one of four sensitivity levels.
Classification determines encryption requirements, access controls, retention policies, and handling rules.

### 1.1 Classification Levels

| Level            | Definition                                                                                         | Encryption at Rest                                                        | Access Control                                                            | Examples (MMF Domain)                                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Public**       | Data intended for public consumption. Disclosure causes no harm.                                   | Not required (but may be encrypted by default depending on storage layer) | No restriction                                                            | Published proposal descriptions, public proposal images, platform statistics, public project milestones                                                         |
| **Internal**     | Data used for platform operations. Not intended for public access but not sensitive if disclosed.  | Required                                                                  | Authenticated users with appropriate role                                 | Internal proposal review notes, aggregate analytics, system configuration (non-secret), proposal category metadata                                              |
| **Confidential** | Data whose disclosure could harm individuals or the organisation. Includes PII and financial data. | Required (AES-256)                                                        | Role-based, need-to-know, logged access                                   | User profiles (name, email, address), donor contribution history, proposal financial details, payout records, transaction amounts, notification preferences     |
| **Restricted**   | Data whose disclosure could cause severe harm. Subject to regulatory requirements.                 | Required (AES-256), additional key management controls                    | Strict role-based, MFA required for access, all access logged and alerted | KYC identity documents (passport, licence), bank account details, payment card tokens, authentication credentials, encryption keys, sanctions screening results |

### 1.2 Classification Responsibilities

- Every data entity in the system must have an assigned classification level.
  Classification is assigned at design time and documented in the relevant L4 domain spec.
- When data from multiple classification levels is combined (e.g., a report containing both Internal and Confidential data), the combined dataset inherits the highest classification level present.
- Classification reviews occur when new data types are introduced or when regulatory requirements change.

### 1.3 Classification Defaults

If a data entity does not have an explicitly assigned classification:

- Data containing any PII defaults to **Confidential**.
- Data containing financial instruments, credentials, or identity documents defaults to **Restricted**.
- All other data defaults to **Internal**.

No data defaults to Public — public classification must be an explicit, deliberate decision.

---

## 2. Retention Policies

Retention policies define how long data is kept before archival or deletion.
Retention periods are driven by regulatory requirements, business needs, and the principle of data minimisation — we do not retain data longer than necessary.

### 2.1 Retention Schedule

| Data Type                       | Classification  | Active Retention                    | Archive Retention                                          | Total Retention            | Regulatory Driver                             |
| ------------------------------- | --------------- | ----------------------------------- | ---------------------------------------------------------- | -------------------------- | --------------------------------------------- |
| KYC identity documents          | Restricted      | Duration of active account + 1 year | 7 years from account closure                               | ~8+ years                  | AML/CTF Act (Australia), GDPR                 |
| Transaction records             | Confidential    | 2 years                             | 7 years from transaction date                              | 7 years                    | Tax law, PCI DSS, AML/CTF Act                 |
| Audit logs                      | Confidential    | 1 year (hot storage)                | 7 years (cold storage)                                     | 7 years                    | Regulatory, [Audit](L3-006)                   |
| User profiles                   | Confidential    | Duration of active account          | 30 days after account closure (then anonymised or deleted) | Account lifetime + 30 days | GDPR right to erasure, Australian Privacy Act |
| Proposal content                | Internal/Public | Duration of proposal + 2 years      | 5 years from proposal close                                | ~7 years                   | Business continuity, dispute resolution       |
| Donor contribution history      | Confidential    | Duration of active account          | 7 years from transaction date                              | 7 years                    | Tax law, donor receipts                       |
| Payment card tokens             | Restricted      | Duration of active payment method   | Deleted on payment method removal                          | Variable                   | PCI DSS                                       |
| Session and authentication data | Internal        | Duration of session                 | 90 days                                                    | ~90 days                   | Security best practice                        |
| Analytics and telemetry         | Internal        | 1 year                              | 2 years (aggregated, anonymised)                           | 3 years                    | Business intelligence                         |
| System logs (non-audit)         | Internal        | 30 days (hot)                       | 1 year (cold)                                              | ~13 months                 | Operational needs                             |

### 2.2 Retention Enforcement

- Retention policies are enforced automatically.
  Manual deletion processes are not acceptable as the primary retention mechanism.
- Automated retention enforcement jobs run on a **daily** cadence to identify and process data that has exceeded its retention period.
- Data past its retention period must be either deleted or anonymised, depending on the data type (see Section 4).
- Retention enforcement must produce an audit record of what was deleted or anonymised, when, and by which process.

> **Local demo note**: Retention enforcement jobs are not active in the local demo environment. Retention behaviour can be demonstrated manually via admin tooling.

### 2.3 Legal Hold

- A legal hold mechanism must exist to suspend retention-based deletion for specified data when required by legal proceedings or regulatory investigation.
- Legal holds override automated retention enforcement.
- Legal holds must be scoped to specific data subjects, data types, or date ranges — not applied globally.
- Application and removal of legal holds must be logged in the audit trail.
- Legal holds are applied and removed **manually via admin tooling** by authorised personnel. Integration with external legal case management systems is not in scope.

---

## 3. Data Lifecycle

Data in the Mars Mission Fund platform moves through defined lifecycle stages.
Each stage has specific handling rules, access controls, and storage requirements.

### 3.1 Lifecycle Stages

```text
Creation → Active Use → Archival → Deletion/Anonymisation
```

| Stage                        | Description                                                                              | Storage Tier   | Access Pattern                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| **Creation**                 | Data enters the system via user input, API integration, or system generation.            | Primary (hot)  | Write-once, validated at system boundary per [Engineering Standard](L2-002), Section 1.4 |
| **Active Use**               | Data is actively read and updated by platform operations.                                | Primary (hot)  | Read/write by authorised roles                                                           |
| **Archival**                 | Data is no longer actively used but must be retained for regulatory or business reasons. | Archive (cold) | Read-only, access requires justification and audit logging                               |
| **Deletion / Anonymisation** | Data has exceeded its retention period or a deletion request has been fulfilled.         | N/A            | Irreversible removal or irreversible anonymisation                                       |

### 3.2 Stage Transitions

- **Creation → Active Use**: Immediate upon successful validation and persistence.
- **Active Use → Archival**: Triggered by retention policy (data exceeds active retention period) or by business event (e.g., account closure, proposal completion).
- **Archival → Deletion/Anonymisation**: Triggered by retention policy (data exceeds archive retention period) or by right-to-erasure request.

### 3.3 Immutable Data

Some data types are immutable after creation and do not transition through Active Use in the read/write sense:

- Audit log entries (governed by [Audit](L3-006))
- Transaction records (once settled)
- KYC verification results

Immutable data moves directly from Creation to a read-only Active state and then follows normal archival and deletion schedules.

---

## 4. Anonymisation and Pseudonymisation

### 4.1 Definitions

- **Anonymisation**: Irreversible removal of all identifying information such that the data subject cannot be re-identified, even by the data controller.
  Anonymised data is no longer personal data under GDPR or the Australian Privacy Act.
- **Pseudonymisation**: Replacement of identifying information with artificial identifiers.
  The mapping between pseudonyms and real identities is stored separately and protected.
  Pseudonymised data is still personal data under GDPR.

### 4.2 When to Anonymise

- **Right-to-erasure requests (GDPR Article 17)**: When a data subject requests deletion, data that must be retained for legal or regulatory reasons (e.g., transaction records for tax compliance) is anonymised rather than deleted.
  Data with no retention requirement is deleted outright.
- **Retention expiry**: When Confidential data exceeds its archive retention period and is still needed for aggregate analytics, it is anonymised before the underlying records are deleted.
- **Analytics and reporting**: Data used for platform analytics, donor trends, and impact reporting must be anonymised or aggregated before use.
  No analytics pipeline may process identifiable personal data.

### 4.3 Anonymisation Requirements

- Anonymisation must be irreversible.
  There must be no technical mechanism to re-identify anonymised data.
- Anonymisation must address all direct identifiers (name, email, address, phone, government IDs) and indirect identifiers that could enable re-identification in combination (date of birth + postcode + donation amount).
- The anonymisation technique is **k-anonymity**: each released record must be indistinguishable from at least *k*-1 other records on quasi-identifier attributes. The value of *k* is determined per dataset based on re-identification risk assessment, with a minimum of *k* = 5.
- Quasi-identifiers (e.g., date of birth, postcode, donation amount ranges) are generalised or suppressed to achieve the target *k* value.
- The anonymisation approach must be documented and reviewed against re-identification risk before deployment.

### 4.4 Pseudonymisation Requirements

- Pseudonymisation is used in environments where data must be realistic but not identifiable — e.g., staging environments, QA testing, and internal analytics that require relational integrity.
- The pseudonym-to-identity mapping must be stored separately from the pseudonymised data, encrypted at rest (AES-256), and accessible only to Restricted-level access roles.
- Pseudonymisation must preserve referential integrity — records linked by a user ID must remain linked by the same pseudonym.

### 4.5 Right-to-Erasure Workflow

When a data subject exercises their right to erasure:

1. Identify all data associated with the data subject across all services and storage systems.
1. Categorise each data element as: deletable (no retention requirement), anonymisable (retention requirement exists), or exempt (legal hold in effect).
1. Delete all deletable data.
1. Anonymise all anonymisable data.
1. Log the erasure action (what was deleted, what was anonymised, what was exempt and why) in the audit trail.
1. Confirm completion to the data subject within the regulatory timeframe (GDPR: 30 days).

**Backup handling**: Right-to-erasure requests are not retroactively applied to existing backups. Backups containing deleted or anonymised data are accepted as-is and will expire naturally according to the backup retention schedule (see Section 6.3). This approach is documented in the platform's GDPR compliance record as a proportionate measure, given that backup data is encrypted, access-controlled, and time-bounded.

---

## 5. Data Access Patterns and Controls

### 5.1 Access by Classification Level

| Classification   | Who Can Access                                                       | Access Mechanism                                    | Logging                                               |
| ---------------- | -------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| **Public**       | Any user, including unauthenticated visitors (via public APIs/pages) | Standard API/UI                                     | Standard request logging                              |
| **Internal**     | Authenticated platform users with appropriate role                   | RBAC via data access layer                          | Standard structured logging                           |
| **Confidential** | Users with explicit need-to-know role assignment                     | RBAC via data access layer, attribute-based filters | All access logged with actor, resource, and purpose   |
| **Restricted**   | Users with Restricted-access role, MFA verified                      | RBAC + MFA challenge, via data access layer         | All access logged, alerted, and periodically reviewed |

### 5.2 Data Access Layer

As required by [Engineering Standard](L2-002), Section 1.2, all data access goes through a data access layer.
This layer enforces:

- Parameterised queries only.
- Classification-based access control checks before data retrieval.
- Structured access logging (who accessed what, when, and via which operation).
- Data masking for Confidential and Restricted fields in non-privileged contexts (e.g., showing `****1234` for card numbers).

### 5.3 Cross-Service Data Access

Services may only access data they own.
If a service needs data owned by another service, it must request it via the owning service's API — not by directly querying another service's data store.

This boundary is enforced at the infrastructure level (separate database credentials per service) and at the application level (service-to-service API contracts).

Cross-service data access patterns must be documented in the relevant [Architecture](L3-001) service boundary definitions.

### 5.4 Bulk Data Access

Bulk data exports (reporting, analytics, regulatory submissions) must:

- Be authorised by a role with explicit bulk-access permission.
- Be logged as a distinct audit event including scope, row count, and classification level of exported data.
- Apply anonymisation or pseudonymisation where the bulk use case does not require identified data.
- Never be performed against production data stores directly — use read replicas or dedicated reporting stores.

---

## 6. Backup and Recovery

### 6.1 Backup Requirements

Backup frequency and recovery targets are defined in [Reliability](L3-003).
This spec defines the data-specific implementation requirements.

- All backups must be encrypted at rest using AES-256, per [Engineering Standard](L2-002), Section 1.1.
- Backup encryption keys must be managed separately from the data encryption keys used for live data.
- Backups must maintain data classification metadata — a backup of Restricted data is itself Restricted.
- Backup storage must reside in a different failure domain (availability zone or region) from primary storage.

### 6.2 Recovery Requirements

- Recovery procedures must be documented, tested, and executable by on-call engineers without requiring access to documentation outside the runbook.
- Recovery testing must occur at a defined cadence (minimum quarterly) to verify that backups are restorable and that recovered data is consistent.
- Recovery time objectives (RTO) and recovery point objectives (RPO) are defined in [Reliability](L3-003).
  This spec ensures the data layer can meet those targets.

### 6.3 Backup Schedule

Backups are taken at two cadences:

- **Incremental (delta) backups**: every 15 minutes, capturing changes since the last backup.
- **Full snapshots**: daily, capturing the complete state of each data store.

> **Local demo note**: Backup infrastructure is not active in the local demo environment. The schedule above represents the production target.

### 6.4 Backup Retention

- Backups follow their own retention schedule, separate from the data retention schedule in Section 2.
- Backup retention must be at least as long as the shortest regulatory retention period for the data they contain.
- Right-to-erasure requests are **not** retroactively applied to existing backups. Backups containing deleted or anonymised data expire naturally according to backup retention periods. This is acceptable because backups are encrypted at rest, access-controlled at the Restricted level, and time-bounded (see Section 4.5 for rationale).

---

## 7. Migration Strategy

### 7.1 Schema Migration Principles

As required by [Engineering Standard](L2-002), Section 7.4:

- All schema migrations must be backward-compatible.
  The previous application version must function correctly against the new schema.
- Migrations are versioned, idempotent, and applied automatically as part of the deployment pipeline.
- Every migration has a corresponding rollback migration that can reverse the schema change without data loss.

### 7.2 Migration Patterns

| Change Type        | Pattern                                                                                  | Notes                                      |
| ------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------ |
| Add column         | Add with default or nullable                                                             | Previous version ignores new column        |
| Remove column      | Two-phase: (1) stop writing, (2) drop in next release                                    | Previous version can still read the column |
| Rename column      | Two-phase: (1) add new column + dual-write, (2) drop old column in next release          | Maintains backward compatibility           |
| Change column type | Two-phase: (1) add new column with new type + dual-write + backfill, (2) drop old column | Never alter a column type in place         |
| Add table          | Straightforward                                                                          | No backward compatibility concern          |
| Remove table       | Two-phase: (1) stop all access, (2) drop in next release after verification              | Verify no remaining consumers              |

### 7.3 Data Migration

Migrations that transform existing data (not just schema) must:

- Be tested against a production-scale dataset in a staging environment before execution.
- Include validation checks that verify data integrity after migration.
- Be reversible or have a documented recovery plan.
- Be performed during a maintenance window if they affect Restricted or Confidential data at scale.
- Produce audit records of what was transformed.

---

## 8. Data Residency and Sovereignty

### 8.1 Primary Data Region

The primary data region is **US (United States)**. All data classifications are stored and processed in US-based infrastructure unless otherwise specified.

### 8.2 Requirements

- Personal data of users residing in the EU must be stored and processed in a manner compliant with GDPR data transfer requirements. Cross-border transfers from EU to US rely on Standard Contractual Clauses (SCCs) or equivalent adequacy mechanisms.
- Personal data of Australian users must comply with the Australian Privacy Principles regarding cross-border disclosure.
- Specific data centre locations within the US are determined by infrastructure decisions in [Architecture](L3-001).

### 8.3 Multi-Region and Edge Considerations

- Multi-region replication is not currently in use. If introduced, data classification constraints must be maintained — Restricted and Confidential data replication requires explicit approval and documentation.
- CDN and edge caching is permitted only for Public-classified content. Cache TTLs and invalidation policies are defined in [Architecture](L3-001).

> **Local demo note**: Data residency is not enforced in the local demo environment. All data resides on the local machine.

---

## 9. Interface Contracts

### 9.1 L3-002 (Security) Interface

| This Spec Provides                                                                                                | Security Spec Provides                                                                                   |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Data classification scheme (Section 1) defining what "sensitive" means for encryption and access control purposes | RBAC model defining roles and permissions that map to classification-level access                        |
| Anonymisation and pseudonymisation rules (Section 4) for privacy compliance                                       | Compliance control matrix (GDPR, Australian Privacy Act, PCI DSS) informing retention and handling rules |
| Backup encryption requirements (Section 6)                                                                        | Encryption key management architecture and key rotation policies                                         |

### 9.2 L3-001 (Architecture) Interface

| This Spec Provides                                                         | Architecture Spec Provides                                                                     |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Data access layer requirements (Section 5.2) — what the layer must enforce | Data access layer implementation — technology choice, service placement, connection management |
| Cross-service data boundary rules (Section 5.3)                            | Service boundary definitions and inter-service communication patterns                          |
| Data residency requirements (Section 8)                                    | Infrastructure topology, region selection, replication strategy                                |

### 9.3 L3-003 (Reliability) Interface

| This Spec Provides                                                                            | Reliability Spec Provides                                                     |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Backup implementation requirements (Section 6) — encryption, classification, recovery testing | Backup frequency, RTO, RPO targets                                            |
| Data lifecycle stages affecting availability (Section 3) — archival reduces hot-storage load  | Availability targets and failover strategies that the data layer must support |

### 9.4 L4-004 (Payments) Interface

| This Spec Provides                                                                                | Payments Spec Provides                                                       |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Classification of payment data (Restricted) and retention rules for transaction records (7 years) | Specific payment data types, tokenisation approach, PCI DSS scope boundaries |
| Anonymisation rules for financial data subject to right-to-erasure                                | Definition of which financial records are legally exempt from erasure        |

### 9.5 L4-005 (KYC) Interface

| This Spec Provides                                                          | KYC Spec Provides                                                                             |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Classification of KYC documents (Restricted) and retention rules (7+ years) | Specific document types, verification workflows, jurisdictional requirements                  |
| Right-to-erasure handling for identity documents                            | Definition of which identity records are legally required to be retained post-erasure request |

---

## Change Log

| Date       | Version | Author | Summary                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | ------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| March 2026 | 0.1     | —      | Initial stub. Data classification scheme (four levels with MMF examples), retention policies by data type, data lifecycle stages, anonymisation and pseudonymisation rules, right-to-erasure workflow, data access patterns and controls, backup and recovery requirements, schema and data migration strategy, data residency placeholders, interface contracts with L3-001/L3-002/L3-003/L4-004/L4-005. |
| March 2026 | 0.2     | —      | Resolved all open questions (OQ-1 through OQ-6). Set primary data region to US. Adopted k-anonymity for anonymisation. Set daily retention enforcement cadence. Confirmed manual legal hold process. Defined backup schedule (15-min deltas, daily full). Accepted backup-expiry approach for right-to-erasure propagation. Added local demo notes throughout.                                            |
