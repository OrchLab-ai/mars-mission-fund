# Mission Updates — Specification (v2)

This version replaces nothing.
`specs/mission-updates.spec.md` is the original and is left untouched.
Version 2 resolves what the original left ambiguous: ownership, proposal status, the wire format, auditing, the schema, backward compatibility, naming, and the look and copy of the client section.
The interview that produced it is recorded in `docs/cp-07/mission-updates-response.md`.

## Role

You are a senior full-stack engineer working in this codebase.
You follow the patterns already here rather than inventing new ones, and you do not touch code outside this feature unless a criterion below needs it.
Where this spec and the original disagree, this spec wins.

## Context

The product owner asked for "a blog engine".
In this app, that means Mission Updates: a short blog attached to each proposal.
The proposal's creator posts updates — progress, setbacks, milestone news — and anyone viewing the proposal page reads them, newest first.
The product vision already promises this: backers receive milestone updates.

### Naming

In this codebase "update" already means "edit a proposal": `updateProposal` in `queries.ts` and `routes.ts`, `UpdateProposalRequestSchema` in `packages/shared/src/proposal.ts`, `PUT /:id`, and `UpdateProposalRequest` in the client.
Nothing new may read as "edit a proposal".
Use exactly these names:

| Thing | Name |
| --- | --- |
| Database table | `proposal_updates` |
| URL path | `/v1/proposals/:id/updates` |
| Types and schemas | `MissionUpdate`, `MissionUpdateSchema`, `CreateMissionUpdateRequestSchema` |
| Server and client functions | `listMissionUpdates`, `createMissionUpdate` |
| Client hook | `useMissionUpdates` |
| Client component | `MissionUpdatesSection` |
| Audit action | `proposal.mission_update_posted` |
| Audit resource type | `proposal_update` |
| Heading on the page | "Mission updates" |

### Files and folders involved

- `packages/server/db/migrations/` — one new dbmate migration, `20261006000001_create_proposal_updates.sql`
- `packages/server/db/schema.sql` — edited by hand to match the migration (see the schema criteria)
- `packages/shared/src/proposal.ts` — the zod schemas and types for a mission update, exported through the existing `export * from './proposal.js'` in `packages/shared/src/index.ts`
- `packages/server/src/proposals/queries.ts` — `listMissionUpdates` and `createMissionUpdate`
- `packages/server/src/proposals/routes.ts` — the two endpoints, on the existing proposals router at `/v1/proposals`
- `packages/server/src/proposals/audit.ts` — the existing `writeAuditEvent`, used as it is
- `packages/server/src/__tests__/` — server tests, in a new `proposals.updates.test.ts` beside `proposals.test.ts`
- `packages/client/src/api/proposals.ts` — `listMissionUpdates` and `createMissionUpdate`, using `authedFetch` from `api/client.ts` for the post
- `packages/client/src/hooks/` — `useMissionUpdates`, beside `useProposal.ts`
- `packages/client/src/components/proposals/` — `MissionUpdatesSection` and its test
- `packages/client/src/pages/ProposalDetailPage.tsx` — where the section is rendered, beside `TeamSection`, `MilestonesSection` and `StretchGoalsSection`
- `packages/client/src/pages/ProposalDetailPage.test.tsx` — one permitted edit (see the compatibility criteria)
- `e2e/mission-updates.spec.ts` — one new Playwright spec

### The closest existing templates

- Server: the `PUT /:id` route in `routes.ts`.
  It runs `authenticate`, then `requireRole('Creator')`, then zod `safeParse` on the params (`RouteParamsSchema`, local to `packages/server/src/proposals/types.ts`) and on the body, then calls a query that returns a `reason` so that not-found, forbidden and a wrong state are told apart.
  The milestone routes show the `INVALID_PROPOSAL_STATE` error with `details: { currentStatus }`.
- Audit: the `contribute` and `launch` routes call `writeAuditEvent` after the change.
- Client: `MilestonesSection` and `TeamSection` — a titled section on the proposal page, with its test beside it.
  `useProposal.ts` is the pattern for a `useQuery` hook.
  `ProposalFormPage.test.tsx` shows how to wrap a component in a `QueryClientProvider` in a test.
- Playwright: `e2e/creator-dashboard.spec.ts` has a `login` helper that signs in through `/login`.

### Patterns and conventions that must be followed

- Request and response shapes are zod schemas in `@mmf/shared`, and the server validates with them — no hand-rolled validation.
- Errors go through `next(err)` with `status`, `code` and `details`, so the error handler returns `{ "error": { "code": ... } }`.
- Successful responses are wrapped as `{ "data": ... }`.
- Routes call query functions.
  SQL stays in `queries.ts` and is always parameterised.
- The migration follows the existing ones: `-- migrate:up` and `-- migrate:down`, `UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `TIMESTAMPTZ NOT NULL DEFAULT now()`.
- The tests mock the `pg` pool, as `proposals.test.ts` does.

## Standards

- Reference: `specs/standards/engineering.md`, and `specs/tech/security.md`, `specs/tech/frontend.md` and `specs/tech/audit.md` for the areas this touches.
- Audit: `specs/adrs/0002-audit-log-demo-simplification.md` governs how audit rows are written in this demo.
- Brand and copy: `specs/standards/brand.md`.
  Its voice rules (section 4) and accessibility rules (section 5) apply.
  Its visual rules are version 2.0, which is still a Draft and whose new Tier 2 tokens are not in `tokens.css`, so the look is governed by the criteria below instead.
- Tests required:
  - Server: Vitest and SuperTest in `packages/server/src/__tests__/`, covering every response code in the acceptance criteria.
  - Client: Vitest and Testing Library beside the component.
  - End to end: one Playwright spec, run with `./scripts/run-e2e.sh`.
  - Coverage stays at or above the 80% threshold.
- Error handling: every failure returns the standard error shape with a specific code.
  Nothing leaks a stack trace or SQL.

## Acceptance criteria

### Data

- [ ] **D1.** `packages/server/db/migrations/20261006000001_create_proposal_updates.sql` creates `proposal_updates` with:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE`
  - `author_id UUID NOT NULL REFERENCES accounts(id)`, with the default `NO ACTION`
  - `title TEXT NOT NULL`
  - `body TEXT NOT NULL`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- [ ] **D2.** The table has `CHECK` constraints that `char_length(btrim(title))` is between 1 and 120 and `char_length(btrim(body))` is between 1 and 5,000.
  A direct insert of a whitespace-only or over-long value fails.
- [ ] **D3.** The migration creates `idx_proposal_updates_proposal_id_created_at` on `(proposal_id, created_at DESC, id DESC)`.
- [ ] **D4.** `migrate:down` drops the table.
- [ ] **D5.** The migration applies with `dbmate --no-dump-schema -d packages/server/db/migrations up`, which never writes a stray `db/schema.sql` at the repo root.
  Running `up`, then `down`, then `up` again against the dev database succeeds at each step.
- [ ] **D6.** `packages/server/db/schema.sql` is edited by hand, in `pg_dump`'s style, in the same change.
  It contains the new table, its `CHECK` constraints, its foreign keys and its index, matching the migration exactly.

### Shared schemas

- [ ] **S1.** `MissionUpdateSchema` describes `id` (uuid), `title`, `body`, `authorId` (uuid), `authorName` (string or null) and `createdAt` (coerced to a date).
  `MissionUpdate` is the inferred type.
- [ ] **S2.** `CreateMissionUpdateRequestSchema` takes `{ title, body }`, trims both, then requires 1 to 120 characters for the title and 1 to 5,000 for the body.
  Only leading and trailing whitespace is trimmed.
  Internal line breaks are kept exactly as sent.
- [ ] **S3.** Both are exported from `@mmf/shared`.
  `ProposalSummarySchema`, `ProposalDetailSchema` and `UpdateProposalRequestSchema` are not changed.

### API

- [ ] **A1.** `GET /v1/proposals/:id/updates` is public and returns `{ "data": [...] }` with status 200.
  Each item has `id`, `title`, `body`, `authorId`, `authorName` and `createdAt`.
  `authorName` comes from `accounts.display_name`.
- [ ] **A2.** Items are ordered `created_at DESC, id DESC`.
  A test inserts two updates with the same `created_at` and checks they come back in descending `id` order.
- [ ] **A3.** `authorName` is `null` when the author's `display_name` is null.
  The API never falls back to the author's email address.
- [ ] **A4.** The endpoint returns the stored updates for a proposal in any status.
  It returns an empty array for a proposal with no updates, 404 `PROPOSAL_NOT_FOUND` for a proposal that does not exist, and 400 `INVALID_PROPOSAL_ID` for an id that is not a uuid.
- [ ] **A5.** `POST /v1/proposals/:id/updates` takes `{ "title", "body" }` and returns 201 with `{ "data": <item> }`.
  The item has exactly the shape of a `GET` item, including `authorName`, and is never the raw table row.
  The saved title and body are trimmed, and internal line breaks are preserved.
- [ ] **A6.** Authentication and role: no token is 401 `UNAUTHORIZED`, and a signed-in user whose role is not Creator is 403 `FORBIDDEN`.
- [ ] **A7.** Ownership uses `proposals.creator_id` only, exactly as `PUT /:id` does.
  A Creator who does not own the proposal is 403 `FORBIDDEN` whatever the proposal's status.
  `created_by` is never used for permissions.
- [ ] **A8.** A Creator whose id matches `created_by` but not `creator_id` gets 403 `FORBIDDEN`.
  A test pins this down.
- [ ] **A9.** A proposal whose `creator_id` is null rejects every Creator with 403 `FORBIDDEN`.
  It neither errors nor lets anyone in.
  A test pins this down.
- [ ] **A10.** Posting is allowed only when the proposal's status is `Live`, `Funded`, `Settlement` or `Complete`.
  For each of `Draft`, `Submitted`, `Under Review`, `Approved`, `Rejected`, `Suspended`, `Failed` and `Cancelled`, the owner gets 409 `INVALID_PROPOSAL_STATE` with `details: { currentStatus: <that status> }`.
  A test covers every one of the twelve statuses.
- [ ] **A11.** Ownership is checked before status.
  A Creator who does not own a proposal in a blocked status gets 403 `FORBIDDEN`, not 409.
- [ ] **A12.** A missing, empty or whitespace-only title or body is 400 `INVALID_REQUEST_BODY`.
  A title of 121 characters or a body of 5,001 characters is 400 `INVALID_REQUEST_BODY`.
  A title of 120 characters and a body of 5,000 characters are accepted.
- [ ] **A13.** An id that is not a uuid is 400 `INVALID_PROPOSAL_ID`.
  A proposal that does not exist is 404 `PROPOSAL_NOT_FOUND`, and it is checked before the ownership and status checks.
- [ ] **A14.** Every failure returns the standard error shape.
  No response contains a stack trace or SQL.
  All SQL is parameterised.

### Audit

- [ ] **U1.** A successful post calls `writeAuditEvent` exactly once, after the update is saved.
  The audit insert into `audit_events` has `action` `proposal.mission_update_posted`, `resource_type` `proposal_update`, `resource_id` the new update's id, `actor_id` the author's account id, `actor_type` `user` and `outcome` `success`.
  It has the request's correlation id, and `new_state` of `{ proposalId, bodyLength }`.
- [ ] **U2.** The audit record contains neither the title nor the body.
  A test asserts that neither string appears in any parameter of the audit insert.
- [ ] **U3.** When the audit insert throws, the post still returns 201 and the update is saved.
  A test asserts this.
- [ ] **U4.** A request that fails with a 4xx writes no audit record.

### Compatibility

- [ ] **K1.** `GET /v1/proposals` and `GET /v1/proposals/:id` return exactly what they return today.
  No `updates` array is embedded and no `updateCount` is added.
  The existing server tests pass without modification.
- [ ] **K2.** Existing assertions in `ProposalDetailPage.test.tsx` and `e2e/proposals.spec.ts` are not changed, removed or weakened.
  The only permitted edit to any existing test is a `vi.mock` for `useMissionUpdates` added to `ProposalDetailPage.test.tsx`, beside the existing `useProposal` mock, so the page renders as before.
  Any other change to an existing test means the feature broke something, and it is fixed in the feature, not in the test.

### Client

- [ ] **C1.** `listMissionUpdates` and `createMissionUpdate` in `packages/client/src/api/proposals.ts` call the two endpoints.
  The list parses its response with `MissionUpdateSchema`.
  The post uses `authedFetch`.
- [ ] **C2.** `useMissionUpdates` is built on `useQuery`, like the other data hooks.
  Posting an update refreshes the list through `invalidateQueries` or an equivalent cache update, so the new update appears without a page reload.
- [ ] **C3.** `MissionUpdatesSection` renders inside `ProposalDetailPage`, beside the other proposal sections, with the heading "Mission updates".
  The section is a labelled region, so it can be located by its heading.
- [ ] **C4.** The section lists updates in the order the API returns them, newest first, each as a card with the title, the author, the date and the body.
  A null author is shown as "Mission crew".
- [ ] **C5.** The body is shown as plain text with its line breaks.
  A test renders a body containing a tag such as `<b>x</b>` and finds it as literal text, not as markup.
- [ ] **C6.** With no updates, a reader sees "No updates yet. When the crew posts progress, it lands here first."
  The creator sees "Your crew is waiting to hear from you. Post the first update above."
  Neither renders an empty box.
- [ ] **C7.** The form is shown only to a signed-in user whose role is Creator and whose id equals the proposal's `creatorId`.
  A test checks that it is absent when signed out, when signed in as a Backer, and when signed in as a Creator who does not own the proposal.
- [ ] **C8.** The form sits above the list, directly under the heading.
  It has a "Title" field with the help text "Keep it short, like a headline. Up to 120 characters." and a "What's happening?" field with the help text "Progress, setbacks, what's next. Plain text, up to 5,000 characters."
  Each label is tied to its field, and each help text is linked to its field with `aria-describedby`.
  The submit button reads "Post update" and is disabled while a post is in flight.
- [ ] **C9.** After a successful post the new update appears at the top of the list and the form clears.
  There is no separate success message.
- [ ] **C10.** After a failed post the form shows "That update didn't go through. Your text is still here, so try posting again." and keeps the typed title and body.
- [ ] **C11.** If the list fails to load, the section shows "We couldn't load the updates right now. Refresh the page to try again."
- [ ] **C12.** The copy contains no word forbidden by `brand.md` section 4.3, and no exclamation mark.
- [ ] **C13.** The section's styles use only Tier 2 tokens that exist in `packages/client/src/tokens.css`: `--color-bg-surface`, `--color-border-subtle`, `--radius-card` and `--space-4`, plus the other existing tokens the sibling sections use for text and type.
  It does not use `--color-border-default` or `--color-surface-card`, and it adds no new semantic tokens.
  Each update renders as a visible card.
- [ ] **C14.** Client tests beside the component cover: the list renders in order, the null-author label, line breaks and literal markup, both empty states, the form shown only to the owning creator, a successful post, a failed post that keeps the text, and the load failure.

### End to end

- [ ] **E1.** `e2e/mission-updates.spec.ts` signs in as the seeded creator (`creator@example.com`), opens a `Live` proposal that creator owns, posts an update, and sees it appear at the top of the "Mission updates" section without a page reload.
  The check that no reload happened is explicit, for example a marker set on `window` before posting that is still there afterwards.
- [ ] **E2.** Signed out, the same page shows the update and no form.
- [ ] **E3.** The update is located inside the "Mission updates" section, not anywhere on the page, so it cannot collide with other text.

### Done

- [ ] **X1.** `./scripts/ci-check.sh` passes, including the 80% coverage threshold.
- [ ] **X2.** `./scripts/run-e2e.sh` passes, including the new spec and the existing `proposals.spec.ts`.
- [ ] **X3.** You have opened a `Live` proposal's page in the browser, signed in as its creator, posted an update, and seen it appear.
  You have looked at it and confirmed it looks right in the brand, and saved a screenshot to `/screenshots`.
  The e2e proves it works, and this check proves it looks right.

## Out of scope

- Editing or deleting an update.
- Comments, reactions or likes.
- Images, attachments or rich text — the body is plain text, rendered with its line breaks.
- Notifying or emailing backers when an update is posted.
- Pagination — a proposal will not have enough updates to need it yet.
- Drafts or scheduled publishing.
- A creator's final explanation on a `Cancelled`, `Failed` or `Suspended` proposal.
  It is a new capability with open questions: whether it is a one-off post, and who is told.
- Backfilling `creator_id` on proposals that have only `created_by`.
- Fixing the undefined tokens listed under Known issues, adding or changing Tier 2 tokens, and implementing the `brand.md` version 2.0 token set.
- Unifying the three audit tables.
- What happens to an author's updates if hard account deletion is ever built.
  That change decides it.

## Known issues

These are recorded, not fixed, in this change.

1. **Proposals with no `creator_id` cannot receive updates.**
   The two `Complete` proposals in the seed data have `created_by` set and `creator_id` null.
   Until `creator_id` is backfilled in its own reviewed change, nobody can post on them.
   Ownership has one rule, and `created_by` is not a fallback.
1. **A post can exist without its audit record.**
   `writeAuditEvent` is best-effort and runs after the change, not in the same transaction, as ADR-0002 documents.
   If the audit insert fails, the post is still saved.
1. **Two design-system tokens are undefined.**
   `--color-border-default` and `--color-surface-card` are defined nowhere, yet six existing components use them: `MilestonesSection`, `StretchGoalsSection`, `ProposalFilters`, `ReviewActionsPanel`, `AdminActionsPanel` and `ProposalDetailPage`.
   Their card borders and backgrounds silently drop out, so the sibling sections render without card edges until this is fixed separately.
   When it is, the neighbours will match the new section rather than the other way round.
1. **`schema.sql` is hand-edited.**
   A later real `pg_dump` may reorder it, which is harmless.
1. **`brand.md` version 2.0 is only partly applied.**
   It is a Draft, and its new Tier 2 tokens (such as `--color-border-card`) are not in `tokens.css`.

## Assumptions

Confirmed in the interview:

- Ownership is `proposals.creator_id` only, and the `launch` route's different handling of a null `creator_id` is not followed.
- The migration file is `20261006000001_create_proposal_updates.sql`, dated today.
- The audit record has actor type `user`, outcome `success`, the request's correlation id (from `res.locals['correlationId']`), and `new_state` of `{ proposalId, bodyLength }`.
- The `CHECK` constraints count characters after trimming.
- The item has no `proposalId`, because the URL gives it.
- The e2e file is `e2e/mission-updates.spec.ts`.

Assumed, not asked, so please check them:

- The checks on `POST` run in this order: authentication 401, role 403, id 400, body 400, then the proposal lookup (404), ownership (403) and status (409).
  This follows `PUT /:id`, which validates the body before looking the proposal up.
- The hook's query key is `['proposal', id, 'mission-updates']`, and posting uses a `useMutation` that invalidates it.
- The submit button is disabled while a post is in flight, to prevent a double post.
- The seeded creator's password is `creator-demo-pass`, as in `e2e/creator-dashboard.spec.ts`.
- The seeded creator owns all six `Live` proposals in the seed data, so the e2e can pick any one of them.
- The author of a new update is always the signed-in user's id, which for an owner equals `creator_id`.
- Plain-text rendering means React's default text escaping plus `white-space: pre-wrap`.
- A user whose role is Administrator is not a Creator, so is 403, as in the original spec.
