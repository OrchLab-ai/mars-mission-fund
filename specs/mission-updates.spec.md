# Mission Updates — Specification

## Role

You are a senior full-stack engineer working in this codebase.
You follow the patterns already here rather than inventing new ones, and you do not touch code outside this feature unless a criterion below needs it.

## Context

Mission Updates is a short blog attached to each proposal.
The proposal's creator posts updates — progress, setbacks, milestone news — and anyone viewing the proposal page reads them, newest first.
The product vision already promises this: backers receive milestone updates.

Files and folders involved:

- `packages/server/db/migrations/` — one new dbmate migration for a `proposal_updates` table
- `packages/shared/src/proposal.ts` — the zod schemas and types for an update, exported through `packages/shared/src/index.ts`
- `packages/server/src/proposals/queries.ts` — the query functions for updates
- `packages/server/src/proposals/routes.ts` — the endpoints, on the existing proposals router at `/v1/proposals`
- `packages/server/src/__tests__/` — server tests
- `packages/client/src/api/proposals.ts` — the fetch and post functions
- `packages/client/src/hooks/` — a `useProposalUpdates` hook beside `useProposal.ts`
- `packages/client/src/components/proposals/` — an `UpdatesSection` component and its test
- `packages/client/src/pages/ProposalDetailPage.tsx` — where the section is rendered

The closest existing templates:

- Server: the `PUT /:id` route in `routes.ts` — `authenticate`, `requireRole('Creator')`, zod `safeParse` on params and body, then a query that tells not-found apart from forbidden
- Client: `MilestonesSection` and `TeamSection` — a titled section on the proposal page, with its test alongside it

Patterns and conventions that must be followed:

- Request and response shapes are zod schemas in `@mmf/shared`, and the server validates with them — no hand-rolled validation
- Errors go through `next(err)` with `status`, `code` and `details`, so the error handler returns `{ "error": { "code": ... } }`
- Successful responses are wrapped as `{ "data": ... }`
- Routes call query functions; SQL stays in `queries.ts` and is always parameterised
- The migration follows the existing ones: `-- migrate:up` / `-- migrate:down`, `UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `TIMESTAMPTZ NOT NULL DEFAULT now()`

## Standards

- Reference: `specs/standards/engineering.md`, and `specs/tech/security.md`, `specs/tech/frontend.md` and `specs/tech/audit.md` for the areas this touches
- Brand and copy: `specs/standards/brand.md`
- Tests required:
  - Server: Vitest + SuperTest in `packages/server/src/__tests__/`, covering every response code in the acceptance criteria
  - Client: Vitest + Testing Library beside the component — the list renders, the empty state renders, the form shows only for the creator
  - Coverage stays at or above the 80% threshold
- Error handling: every failure returns the standard error shape with a specific code; nothing leaks a stack trace or SQL
- Audit: posting an update writes an audit event, the same way other proposal changes do

## Acceptance criteria

Data:

- [ ] A migration creates `proposal_updates` with `id`, `proposal_id` (FK to `proposals`, cascade on delete), `author_id` (FK to `accounts`), `title`, `body` and `created_at`
- [ ] The migration has a working `migrate:down` that drops the table
- [ ] `dbmate -d packages/server/db/migrations up` applies it to the running database

API:

- [ ] `GET /v1/proposals/:id/updates` is public and returns `{ "data": [...] }`, newest first, each item with `id`, `title`, `body`, `authorName` (from `accounts.display_name`) and `createdAt`
- [ ] It returns an empty array for a proposal with no updates, and 404 `PROPOSAL_NOT_FOUND` for a proposal that does not exist
- [ ] `POST /v1/proposals/:id/updates` takes `{ "title", "body" }` and returns 201 with the created update
- [ ] Only the proposal's creator (`proposals.creator_id`) can post: no token is 401 `UNAUTHORIZED`, a non-Creator is 403 `FORBIDDEN`, and a Creator who does not own this proposal is also 403 `FORBIDDEN`
- [ ] An invalid id is 400 `INVALID_PROPOSAL_ID`; a missing or empty title or body is 400 `INVALID_REQUEST_BODY`
- [ ] Title is at most 120 characters and body at most 5,000; both are trimmed before saving

Client:

- [ ] The proposal page shows an "Updates" section listing every update newest first, with title, author, date and body
- [ ] With no updates it says so plainly instead of rendering an empty box
- [ ] The proposal's creator, signed in, sees a form to post an update; on success the new update appears at the top without a page reload
- [ ] Nobody else sees the form
- [ ] The section matches the look of the other sections on the page

Done:

- [ ] `./scripts/ci-check.sh` passes
- [ ] You have opened the proposal page in the browser, posted an update as its creator, and seen it appear

## Out of scope

- Editing or deleting an update
- Comments, reactions or likes
- Images, attachments or rich text — the body is plain text, rendered with its line breaks
- Notifying or emailing backers when an update is posted
- Pagination — a proposal will not have enough updates to need it yet
- Drafts or scheduled publishing
