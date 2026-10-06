# Mission Updates Interview Responses

This is the record of the interview for `specs/mission-updates.v2.spec.md`.
It starts from `specs/mission-updates.spec.md` and `specs/standards/brand.md`, and covers what they leave ambiguous: the existing proposal routes, the database schema, API conventions, and backward compatibility.
Answers are quoted as given, split one sentence per line.

---

## Question 1: Which column decides who the creator is, and what happens when it is empty?

*Evidence from the code and the running database:*

- *`proposals` has two owner columns, `creator_id` and `created_by`, and they disagree.*
- *The existing `PUT /:id` checks `creator_id`.*
- *The list endpoint returns `created_by` as `createdBy`.*
- *Two `Complete` proposals have `created_by` set and `creator_id` null.*
- *There is one Creator account in the database.*

*Asked which column is the ownership test, what happens for proposals with a null `creator_id`, and which cases a test must pin down.*

> Yes.
> creator_id is the only ownership test, exactly as PUT /:id does it.
> One rule for "who owns this proposal" across the API, and created_by is not used for permissions anywhere in this change.
>
> 1. Their creator cannot post updates, and there is no fallback and no data fix in this change.
>    Falling back to created_by would quietly create a second ownership rule, and backfilling creator_id is a data migration that belongs in its own change with its own review.
>    Record it in the spec as a known gap: proposals with no creator_id cannot receive updates until that data is fixed.
> 1. Pin down both.
>    One test that a Creator who matches created_by but not creator_id gets 403 FORBIDDEN, and one that a proposal with a null creator_id rejects every Creator with 403, rather than erroring or letting anyone in.

### Decisions recorded (Question 1)

- Ownership is `proposals.creator_id` only.
- `created_by` is never used for permissions in this change.
- A proposal with a null `creator_id` rejects every poster with 403 `FORBIDDEN`.
- There is no fallback to `created_by` and no data fix.
  The gap goes in the spec: proposals with no `creator_id` cannot receive updates until that data is fixed in a separate change.
- Two tests are required.
  One where a Creator matches `created_by` but not `creator_id` gets 403 `FORBIDDEN`.
  One where a null `creator_id` rejects every Creator with 403, with no error and no access.

---

## Question 2: Which statuses can receive updates, and which can be read publicly?

*Evidence from the code and the running database:*

- *`GET /:id` has no status filter, so every proposal is publicly readable whatever its status.*
- *The running database holds `Submitted` (4), `Approved` (1), `Rejected` (1), `Live` (6), `Funded` (3), `Settlement` (1) and `Complete` (2).*
- *The schema also allows `Draft`, `Under Review`, `Suspended`, `Failed` and `Cancelled`.*
- *Existing 409 codes are `PROPOSAL_NOT_EDITABLE` (on `PUT /:id`) and `INVALID_PROPOSAL_STATE` (on `launch` and the milestone routes).*

*Asked which statuses allow posting, which return updates publicly and what the others return, which error a blocked status gets, and whether status is checked before or after ownership.*

> 1. Posting is allowed on Live, Funded, Settlement and Complete.
>    Those are the statuses where backers exist and progress is real.
>    Draft, Submitted, Under Review, Approved, Rejected, Suspended, Failed and Cancelled cannot receive updates.
> 1. Reading follows the same list: Live, Funded, Settlement and Complete return their updates publicly.
>    For any other status, return 200 with an empty array, not 404.
>    The proposal itself is already publicly readable through GET /:id, so pretending it doesn't exist here would be inconsistent, and since posting is blocked in those statuses an empty list is simply the truth.
>
> Error: reuse 409 INVALID_PROPOSAL_STATE, with the current status in details, the same shape the launch route uses.
> Don't add a new code, and don't reuse PROPOSAL_NOT_EDITABLE, because that one is about editing a draft.
>
> Order: check ownership first, then status.
> A Creator who doesn't own the proposal gets 403 FORBIDDEN whatever its status, so a non-owner can't learn anything about a proposal's state by probing.
> 404 PROPOSAL_NOT_FOUND still comes before both.

### Decisions recorded (Question 2)

- Posting is allowed only on `Live`, `Funded`, `Settlement` and `Complete`.
- Reading returns updates only for those four statuses.
  Any other status returns 200 with an empty array, never 404.
- A blocked status on `POST` returns 409 `INVALID_PROPOSAL_STATE` with `details: { currentStatus }`.
  No new error code is added.
- Check order on `POST`: invalid id (400), proposal not found (404), ownership (403), then status (409).

### Correction found while recording (Question 2)

The answer says this is "the same shape the launch route uses".
The `launch` route returns `INVALID_PROPOSAL_STATE` with empty `details`.
The `{ currentStatus: proposal.status }` shape is used by the milestone routes (`POST /:id/milestones/...`), which also use `INVALID_PROPOSAL_STATE`.
The spec follows the milestone routes.

### Also noted (Question 2)

The `launch` route allows a null `creator_id` through its ownership check ("allow null creatorId (unassigned)").
`PUT /:id` rejects it.
Per Question 1, updates follow `PUT /:id`.

---

## Follow-up to Question 2: is an empty list always the truth?

*Pushed back on the read rule from Question 2.*
*Routes already move `Live` and `Funded` proposals to `Cancelled` (`cancel`, `approve-cancel`) and `Failed` (`enforce-deadline`), and `Suspended` is in the schema.*
*Under the stated rule, updates posted earlier would be hidden once the proposal changed status.*
*Offered three options: keep the rule, allow reads on every status, or allow reads on the four statuses plus `Cancelled`, `Failed` and `Suspended`.*

> Option 2.
> Reading is allowed for every status, and posting stays limited to Live, Funded, Settlement and Complete.
>
> It is the simplest rule and the most honest one.
> An update, once posted, is part of the record backers were promised, so it should never disappear because the proposal changed state.
> Proposals that never reached Live will show an empty list because nothing was ever posted, not because something is hidden.
> It also removes a status check from the read path, so there is one less thing to get wrong.
>
> The creator's final explanation on a Cancelled or Failed proposal is a fair point, but it is a new capability with its own questions, like whether it is a one-off post and who gets told.
> Record it in the spec as out of scope for now rather than widening the posting rule.

### Decisions recorded, superseding the read rule (Follow-up to Question 2)

- `GET /v1/proposals/:id/updates` returns the stored updates for a proposal in any status.
  It checks only that the proposal exists (404 `PROPOSAL_NOT_FOUND` otherwise).
- `POST` stays limited to `Live`, `Funded`, `Settlement` and `Complete`.
- A creator posting a final explanation on a `Cancelled`, `Failed` or `Suspended` proposal is out of scope.
  Open questions for later: whether it is a one-off post, and who is notified.
- Updates are never hidden because a proposal changed state.

---

## Question 3: How is an update audited?

*Evidence from the code:*

- *The proposals code audits in three ways: `writeAuditEvent` into `audit_events` (best-effort, errors swallowed), `insertAuditLog` into `audit_log` (errors propagate), and inline inserts into `proposal_audit_events`.*
- *None of them runs in a transaction with the change.*

*Asked which mechanism, what the record holds, and whether a failed audit write should fail the post.*

> 1. Use writeAuditEvent in audit.ts, writing to audit_events, with action proposal.update_posted, resource type proposal_update and resource id set to the new update's id.
>    Of the three tables, it is the closest to the audit standard in specs/tech/audit.md: it carries actor, outcome, correlation id and before and after state.
>    ADR 0002 already names it as the place for proposal lifecycle events.
> 1. Record the update id, the proposal id, the author's account id and the body length.
>    Leave out the title and the body.
>    The update itself is the record of what was said, so the audit trail only needs who posted what, where and when, by reference.
>    Copying up to 5,000 characters of creator-written text into the audit table duplicates it and risks pulling personal data into audit logs, which the audit standard forbids.
> 1. No, the post does not fail.
>    ADR 0002 says audit writes in this demo happen after the change, not in the same transaction, and writeAuditEvent is best-effort, so this follows the documented standard rather than inventing a transaction for one route.
>    The spec records it as a known limitation: a post can exist without its audit record if the audit insert fails.
>    A test must assert that a successful post writes exactly one proposal.update_posted row with the right update id, proposal id, actor and body length, and no title or body.
>    A second test must assert that when the audit insert throws, the post still returns 201 and the update is saved.

### Claims checked against the repo (Question 3)

- ADR-0002 does name `writeAuditEvent` for proposal lifecycle events, and says it is best-effort and runs after the state change, not in a transaction.
- `specs/tech/audit.md` requires reference-only audit data and no PII in state snapshots.
  It also says audit failures must not cause the originating operation to fail.
- The `audit_events` table does have `correlation_id`, but no proposals route passes one today.
  The correlation id is available as `res.locals['correlationId']`.

### Decisions recorded (Question 3)

- Mechanism: `writeAuditEvent` into `audit_events`.
- Action `proposal.update_posted`, resource type `proposal_update`, resource id the new update's id.
- The record holds the update id, the proposal id, the author's account id and the body length.
  It never holds the title or the body.
- A failed audit write does not fail the post.
  The spec records the known limitation: a post can exist without its audit record.
- Required tests:
  - A successful post writes exactly one `proposal.update_posted` record with the right update id, proposal id, actor and body length, and no title or body.
  - When the audit insert throws, the post still returns 201 and the update is saved.

### Assumptions I added (not stated in the answer) (Question 3)

- `actorId` is the author's account id, `actorType` is `user`, and `outcome` is `success`.
- The proposal id and body length go in `newState` as `{ proposalId, bodyLength }`.
- The new route passes `res.locals['correlationId']` as `correlationId`, since the answer cites the correlation id as a reason for choosing this table.
- The server tests use a mocked pool, so "writes exactly one row" means exactly one `INSERT INTO audit_events` call with those parameters.

---

## Question 4: What does an update look like on the wire?

*Evidence from the code and the running API:*

- *`accounts.display_name` is nullable.*
- *`GET /v1/proposals/:id` already returns `creatorId` publicly.*
- *The original spec fixed the GET item fields and said `POST` returns "the created update" without a shape.*

*Asked about a null author name, whether to expose the author id, the shape of the `POST` 201 body, the ordering tie-break, and how trimming and validation work.*

> 1. Return null from the API and let the client decide.
>    The API reports data, and wording is a presentation choice.
>    The client shows "Mission crew" when authorName is null, which fits the brand voice.
>    Never fall back to the email address.
> 1. Yes, include authorId.
>    creatorId is already public on GET /:id, so this exposes nothing new, and it lets the client mark creator posts without a second lookup.
> 1. Exactly the same shape as a GET item, including authorName.
>    One shape everywhere means the client can put the new update straight at the top of the list with no special case.
>    Use a single query with INSERT ... RETURNING joined to accounts, or the insert followed by the same select the GET uses.
>    Never return the raw table row.
> 1. Yes, created_at DESC, id DESC.
>    The id tie-break makes the order fully deterministic, so tests that insert quickly never flake.
>
> Trimming and validation: trim first, then validate, so a title or body that is only whitespace is empty and returns 400 INVALID_REQUEST_BODY.
> The 120 and 5,000 limits apply after trimming.
> Only leading and trailing whitespace is trimmed, and internal line breaks are kept exactly as sent, with no collapsing.
> The client renders them as line breaks in plain text, never as HTML.

### Claims checked against the repo (Question 4)

- `creatorId` is returned publicly: a live `GET /v1/proposals/00000000-0005-0000-0000-000000000005` returns `"creatorId":"22222222-2222-2222-2222-222222222222"`.

### Decisions recorded (Question 4)

- The item shape, used by `GET` and by the `POST` 201 body alike, is `id`, `title`, `body`, `authorId`, `authorName` and `createdAt`.
- `authorName` is `null` when `accounts.display_name` is null.
  The API never falls back to the email address.
  The client shows "Mission crew" for a null name.
- The `POST` 201 body is never the raw table row.
  It comes from an `INSERT ... RETURNING` joined to `accounts`, or from the insert followed by the same select that `GET` uses.
- Ordering is `created_at DESC, id DESC`.
- Validation: trim first, then validate.
  A whitespace-only title or body returns 400 `INVALID_REQUEST_BODY`.
  The limits (title 120, body 5,000) apply after trimming.
  Only leading and trailing whitespace is trimmed, and internal line breaks are kept exactly as sent.
- The client renders the body as plain text with its line breaks, never as HTML.

### Assumptions I added (not stated in the answer) (Question 4)

- The item shape does not include `proposalId`, because every item belongs to the proposal in the URL.
  Your answer named the other six fields and did not mention `proposalId`, so I left it out.
- Plain-text rendering means React's default text escaping plus `white-space: pre-wrap`.

---

## Question 5: What exactly does the `proposal_updates` table look like?

*Evidence from `packages/server/db/schema.sql` and the migrations:*

- *The proposal child tables (`proposal_milestones`, `proposal_team_members`, `proposal_stretch_goals`, `proposal_audit_events`) cascade on proposal delete.*
  *`milestone_evidence`, `notifications` and `audit_log` do not.*
- *Every FK to `accounts` has no `ON DELETE` clause, so it is `NO ACTION`.*
- *Existing tables use plain `TEXT NOT NULL` with no `CHECK` constraints.*
- *Only some FK columns have an `idx_` index.*
- *`schema.sql` is a committed dbmate dump, and the newest migration is `20260401000001_rename_campaigns_to_proposals.sql`.*

*Asked about the `author_id` delete behaviour, database `CHECK`s, an index, and how the dump and the `migrate:down` check are handled.*

> 1. Keep the default NO ACTION, with author_id NOT NULL.
>    Accounts in this app are deactivated, not deleted, so an update naturally outlives its author's active status, and the database refusing to delete an account with posts is a safeguard, not a problem.
>    It also keeps authorId always present in the API.
>    If hard account deletion is ever built, that change decides what happens to its posts.
> 1. Add the CHECKs: title between 1 and 120 characters and body between 1 and 5,000.
>    Zod stays the first line and gives the friendly 400.
>    The database is the backstop against anything that bypasses the API, like a seed script or a direct insert.
>    It costs two lines in the migration, and this is a new table, so it doesn't need to match the older ones' omissions.
> 1. Add the index on (proposal_id, created_at DESC, id DESC).
>    It exactly matches the only read query, including the tie-break, and it is the right habit even if the table is small today.
> 1. Yes, commit the regenerated schema.sql in the same change as the migration, so the dump never drifts from the migrations.
>    Name the migration with a timestamp after 20260401000001.
>    For migrate:down, the acceptance check is running up, down and up again against the dev database and seeing each step succeed, with that recorded as a done criterion.
>    No automated test, because no other migration has one and the test suite doesn't run migrations.

### Claims checked against the repo (Question 5)

- Account deactivation is described in the specs (`specs/README.md` lists it under L4-001), but it is not implemented.
  The `accounts` table has no status or deactivation column, and there is no account delete route in `packages/server/src/users` or `packages/server/src/auth`.
  The decision stands either way: today no account can be deleted through the app.
- The database `CHECK` and the index are consistent with the existing conventions and the read query.
- "Commit the regenerated schema.sql" has two practical problems in this environment.
  See the follow-up below.

### Decisions recorded (Question 5)

- Table `proposal_updates`, with `author_id UUID NOT NULL REFERENCES accounts(id)` and the default `NO ACTION`.
- `proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE`, as in your original spec.
- `CHECK` constraints for non-empty and the length limits (title 1 to 120, body 1 to 5,000), in addition to the zod limits.
- An index on `(proposal_id, created_at DESC, id DESC)`.
- The migration timestamp is later than `20260401000001`.
- `migrate:down` drops the table.
  The acceptance check is running `up`, `down` and `up` again against the dev database, with each step succeeding.
  There is no automated migration test.
- A known gap goes in the spec: if hard account deletion is ever built, that change decides what happens to an author's updates.

### Assumptions I added (not stated in the answer) (Question 5)

- The `CHECK` counts characters after trimming, for example `char_length(btrim(title)) BETWEEN 1 AND 120`.
  A plain `char_length(title) >= 1` would let a whitespace-only value through on a direct insert, which the API rejects.
- The index is named `idx_proposal_updates_proposal_id_created_at`, following the `idx_<table>_<column>` convention.

---

## Follow-up to Question 5: how does `schema.sql` get updated?

*Pushed back on "commit the regenerated `schema.sql`" with two facts from this environment:*

- *`pg_dump` is not installed in the container, so `dbmate up` cannot produce a new dump here.*
- *No `DBMATE_*` setting exists, so `dbmate`'s default schema file is `./db/schema.sql` relative to the current directory.*
  *The spec's command run from the repo root would write a stray `db/schema.sql` and leave `packages/server/db/schema.sql` untouched.*
  *`scripts/run-e2e.sh` avoids this with `--no-dump-schema`.*

*Offered three options: add `--schema-file` and dump elsewhere, edit `schema.sql` by hand, or leave it out of this change.*

> Option 2: edit schema.sql by hand, in pg_dump's style, in the same change.
>
> Nothing executes schema.sql.
> CI, the e2e scripts and local setup all build the database by running the migrations, so the file is the readable reference for the current schema.
> That is what agents and people open to understand the tables, which makes keeping it accurate matter more than keeping it machine-generated.
> It is also how the cp-02 rename was handled.
> Note in the spec that it was hand-edited, and that a later real pg_dump may reorder it, which is harmless.
>
> Change the spec's migration command to dbmate --no-dump-schema -d packages/server/db/migrations up, so it never writes a stray db/schema.sql at the repo root.
>
> Update the done criterion to say the migration applies with that command, that migrate up, down and up again each succeed against the dev database, and that schema.sql contains the new table, its CHECK constraints, its foreign keys and its index, matching the migration exactly.

### Claims checked against the repo (Follow-up to Question 5)

- Nothing executes `schema.sql`: no script, workflow or `package.json` references it, and only `CLAUDE.md` names it as the schema reference.
- The cp-02 commit (`a4bf85c`) did change `schema.sql` in the same change as its rename migration.
  The diff cannot show whether it was edited by hand or regenerated, so the spec does not claim that precedent.

### Decisions recorded (Follow-up to Question 5)

- `packages/server/db/schema.sql` is edited by hand, in `pg_dump`'s style, in the same change as the migration.
  The spec notes that it was hand-edited and that a later real `pg_dump` may reorder it, which is harmless.
- The migration command in the spec is `dbmate --no-dump-schema -d packages/server/db/migrations up`.
- The done criterion has three parts:
  - The migration applies with that command.
  - `up`, `down` and `up` again each succeed against the dev database.
  - `schema.sql` contains the new table, its `CHECK` constraints, its foreign keys and its index, matching the migration exactly.

---

## Question 6: What must not break, and what do we call things?

*Evidence from the code:*

- *"Update" already means "edit a proposal" in six files: `updateProposal` in `queries.ts` and `routes.ts`, `UpdateProposalRequestSchema` in `shared/src/proposal.ts`, `PUT /:id`, and `UpdateProposalRequest` in the client API and form page.*
- *`e2e/proposals.spec.ts` looks for the "Milestones" heading on the detail page, and `ProposalDetailPage.test.tsx` renders it.*

*Asked to confirm the existing response contracts, to choose names that do not read as "edit a proposal", and whether to require a Playwright e2e.*

> 1. Confirmed.
>    GET /v1/proposals and GET /v1/proposals/:id return exactly what they return today, with no embedded updates array and no updateCount.
>    ProposalDetailSchema and ProposalSummarySchema stay unchanged.
>    Updates are only ever fetched from their own endpoint, so the feature can be added, or removed, without touching any existing contract.
> 1. Use your names: MissionUpdate, MissionUpdateSchema, CreateMissionUpdateRequestSchema, listMissionUpdates, createMissionUpdate and useMissionUpdates.
>    The component is MissionUpdatesSection and the audit action is proposal.mission_update_posted, so no name containing "update" means editing a proposal.
>    The table stays proposal_updates, and the path stays /v1/proposals/:id/updates.
>    The heading on the page reads "Mission updates".
> 1. Yes, require one Playwright e2e.
>    Signed in as the seeded creator, open a Live proposal they own, post an update, and see it appear at the top of the Mission updates section without a reload.
>    Signed out, the same page shows the update and no form.
>    Locate the update inside the Mission updates section, not anywhere on the page, so it can't collide with other text.
>    The existing ProposalDetailPage.test.tsx and proposals.spec.ts must keep passing unchanged, and they get no edits to make room for the new section.
>    The manual browser check stays as well, because the e2e proves it works and the manual check proves it looks right in the brand.

### Claims checked against the repo (Question 6)

- The seeded `Demo Creator` account owns all six `Live` proposals, so "a Live proposal they own" exists in the seed data.
- `e2e/proposals.spec.ts` asserts only the "Milestones" heading, and only if it is present, so a new section does not disturb it.
- **Conflict found.**
  `ProposalDetailPage.test.tsx` mocks `useProposal` and `useAuthContext` and renders the page with no `QueryClientProvider`.
  A `useMissionUpdates` hook built on `useQuery` and rendered inside the page would throw "No QueryClient set", so both existing tests would fail.
  "Must pass unchanged, with no edits" cannot hold with that design.
  See the follow-up below.

### Decisions recorded (Question 6)

- `GET /v1/proposals` and `GET /v1/proposals/:id` return exactly what they return today.
  No `updates` array is embedded and no `updateCount` is added.
  `ProposalDetailSchema` and `ProposalSummarySchema` do not change.
- Names:
  - Types and schemas: `MissionUpdate`, `MissionUpdateSchema`, `CreateMissionUpdateRequestSchema`.
  - Server and client functions: `listMissionUpdates`, `createMissionUpdate`.
  - Hook: `useMissionUpdates`.
  - Component: `MissionUpdatesSection`.
  - The page heading reads "Mission updates".
  - The table stays `proposal_updates` and the path stays `/v1/proposals/:id/updates`.
- One Playwright e2e is required.
  Signed in as the seeded creator, it opens a `Live` proposal they own, posts an update, and sees it at the top of the "Mission updates" section without a reload.
  Signed out, the same page shows the update and no form.
  The update is located inside the "Mission updates" section, not anywhere on the page.
- The manual browser check stays in the done criteria, as the check that the section looks right in the brand.
- `ProposalDetailPage.test.tsx` and `proposals.spec.ts` must keep passing, with no edits made to make room for the new section.
  This is subject to the conflict above.

### Supersedes Question 3 (Question 6)

The audit action is now `proposal.mission_update_posted`, not `proposal.update_posted`.
The tests required in Question 3 assert the new action name.
The resource type, `proposal_update`, was not discussed again, and the spec keeps it as the table name.

---

## Follow-up to Question 6: rendering a data-fetching section without breaking the existing test

*Pushed back on "must pass unchanged, with no edits".*
*`ProposalDetailPage.test.tsx` mocks `useProposal` and `useAuthContext` and renders the page with no `QueryClientProvider`.*
*A `useQuery`-based `useMissionUpdates` inside the page would throw "No QueryClient set", so both existing tests would fail.*
*Offered three options: allow one additive mock in the test, use a plain-`fetch` hook with no provider, or render the section outside `ProposalDetailPage`.*

> Option 1.
> Allow one small, additive edit to ProposalDetailPage.test.tsx: a vi.mock for useMissionUpdates, alongside the existing useProposal mock.
> Keeping useQuery is worth far more than keeping one test file byte-for-byte identical.
> The pattern gives caching and invalidateQueries for the "appears at the top" behaviour, and it matches every other hook.
> The section belongs where the other proposal sections are.
>
> My "no edits" rule was too strict.
> What I meant was that the existing behaviour must not change.
> The spec should say: existing assertions in ProposalDetailPage.test.tsx and proposals.spec.ts are not changed, removed or weakened.
> The only permitted edit is adding a mock for the new hook, so the page renders as before.
> Any other change to an existing test means the feature broke something, and that must be fixed in the feature, not in the test.

### Decisions recorded, replacing the "no edits" rule (Follow-up to Question 6)

- `useMissionUpdates` is built on `useQuery`, like every other data hook.
  A posted update appears at the top of the list through `invalidateQueries` (or an equivalent cache update), without a reload.
- `MissionUpdatesSection` renders inside `ProposalDetailPage`, beside the other proposal sections.
- Existing assertions in `ProposalDetailPage.test.tsx` and `e2e/proposals.spec.ts` are not changed, removed or weakened.
- The only permitted edit to an existing test is adding a `vi.mock` for `useMissionUpdates` in `ProposalDetailPage.test.tsx`, so the page renders as before.
- Any other change to an existing test means the feature broke something, and the fix belongs in the feature.

---

## Question 7: Which look does the section follow, and what does it say?

*Evidence from the code:*

- *`MilestonesSection` and `StretchGoalsSection` style their cards with `--color-border-default` and `--color-surface-card`.*
  *Neither token is defined anywhere.*
  *Six files use them: `MilestonesSection`, `StretchGoalsSection`, `ProposalFilters`, `ReviewActionsPanel`, `AdminActionsPanel` and `ProposalDetailPage`.*
  *In those components the border and card background silently drop out.*
- *`brand.md` v2.0 §3.2 describes a card with a 1.5px ink border, but its Tier 2 tokens (`--color-border-card`, `--border-width`, `--space-card`) are not in `tokens.css`.*
- *The Tier 2 tokens that exist and work include `--color-bg-surface`, `--color-border-subtle`, `--radius-card` and `--space-4`.*

*Asked which look to follow (copy the siblings, use only existing tokens, or build to `brand.md` and add the missing tokens), and for the exact words for each state.*

> Part A: Option 2.
> Use only the Tier 2 tokens that exist (--color-bg-surface, --color-border-subtle, --radius-card, --space-4), so each update renders as a visible card.
> Copying an undefined token on purpose builds the bug into new code, and adding semantic tokens is a design-system change that belongs in its own reviewed change, not inside a feature.
> Record the undefined --color-border-default and --color-surface-card in the spec as a known issue, out of scope and fixed separately.
> When they are fixed, the neighbours will match the new section rather than the other way round.
>
> Part B:
>
> Heading: Mission updates
>
> Empty state for readers: No updates yet. When the crew posts progress, it lands here first.
>
> Empty state for the creator: Your crew is waiting to hear from you. Post the first update below.
>
> Form labels: Title, and What's happening?
>
> Title help text: Keep it short, like a headline. Up to 120 characters.
>
> Body help text: Progress, setbacks, what's next. Plain text, up to 5,000 characters.
>
> Submit button: Post update
>
> Success: no separate message. The update appears at the top of the list and the form clears, which is the confirmation.
>
> Failed post: That update didn't go through. Your text is still here, so try posting again.
>
> Failed load: We couldn't load the updates right now. Refresh the page to try again.
>
> Null author: Mission crew

### Decisions recorded (Question 7)

- The section uses only Tier 2 tokens that exist in `tokens.css`: `--color-bg-surface`, `--color-border-subtle`, `--radius-card` and `--space-4`.
  Each update renders as a visible card.
  It does not use `--color-border-default` or `--color-surface-card`, and it adds no new semantic tokens.
- Known issue, recorded in the spec and out of scope: `--color-border-default` and `--color-surface-card` are undefined in six files.
  They are fixed in a separate change, after which the neighbouring sections will match this one.
- Copy, exactly as given:
  - Heading: "Mission updates".
  - Reader empty state: "No updates yet. When the crew posts progress, it lands here first."
  - Creator empty state: "Your crew is waiting to hear from you. Post the first update below."
  - Form labels: "Title" and "What's happening?".
  - Title help text: "Keep it short, like a headline. Up to 120 characters."
  - Body help text: "Progress, setbacks, what's next. Plain text, up to 5,000 characters."
  - Submit button: "Post update".
  - Success: no separate message.
    The update appears at the top of the list and the form clears.
  - Failed post: "That update didn't go through. Your text is still here, so try posting again."
  - Failed load: "We couldn't load the updates right now. Refresh the page to try again."
  - Null author: "Mission crew".
- The failed-post copy makes a testable requirement: after a failed post, the form keeps the typed title and body.

### Copy checked against `brand.md` §4 (Question 7)

- No forbidden word appears: no "donate", "donor", "revolutionary", "stakeholder" or "pledge level".
- No exclamation marks.
- Both empty states invite rather than describe an absence.

### Assumptions I added (not stated in the answers) (Question 7)

- The creator's form renders below the list region, because the creator empty state says "Post the first update below".
  With many updates this puts the form far down the page.
- Title and body help text are linked to their fields with `aria-describedby`, and each label is tied to its field, so the form meets the accessibility rules in `brand.md` §5.

---

## Confirmation of the summary

*Showed a summary of every decision and seven assumptions, and asked for corrections before drafting `specs/mission-updates.v2.spec.md`.*

> Confirmed, with two corrections.
>
> 5 is wrong: put the creator's form above the list, directly under the heading.
> New updates appear at the top, so the form should sit where the result lands, and the creator should never have to scroll past every past update to post.
> Change the creator's empty state to: Your crew is waiting to hear from you. Post the first update above.
>
> 7: add one more known issue, that --color-border-default and --color-surface-card are undefined and used by six existing components, so the sibling sections render without card edges until that is fixed separately.
>
> 1, 2, 3, 4 and 6 are right as written.

### Decisions recorded, superseding Question 7 (Confirmation)

- The creator's form renders above the list, directly under the "Mission updates" heading.
  This replaces the assumption that it renders below.
- The creator's empty state reads: "Your crew is waiting to hear from you. Post the first update above."
  This replaces the "below" wording in Question 7.
- The known-issue list in the spec includes the undefined `--color-border-default` and `--color-surface-card`, used by six existing components.
  The sibling sections render without card edges until that is fixed separately.

### Assumptions confirmed (Confirmation)

- The migration is `packages/server/db/migrations/20261006000001_create_proposal_updates.sql`.
- The audit record has actor type `user`, outcome `success`, `newState` of `{ proposalId, bodyLength }`, the request's correlation id, and resource type `proposal_update`.
- The `CHECK` constraints use `char_length(btrim(...))`.
- The item has no `proposalId`.
- The e2e file is `e2e/mission-updates.spec.ts`.
