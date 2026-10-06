# Feature Request

> This is the request the **Planning Agent** turns into a structured plan, which
> the **Coding Agent** then executes step by step (see the README's "Plan-First
> Orchestration"). Replace it with your own — keep it concrete: what the user
> should be able to do, where it lives, and how to tell it works.
>
> The default is **Mission Updates**, the feature built by hand earlier in the day.
> It spans database → server → shared types → client → UI → tests, so the planner
> produces a multi-step `tasks.md` the loop executes one task at a time.

## Mission Updates

The owner of a proposal can post short updates to it, and backers read them on the
proposal's page. (The funding entity is called a proposal in this codebase — it was
named Campaign until the rename challenge; use whichever name the code uses now.)

If a spec for this feature exists in `specs/` (for example
`specs/mission-updates.spec.md`), it is the source of truth: build what it says and
satisfy its acceptance criteria. Otherwise, build the following.

### What to build

- **Database**: a migration adding an updates table — title, body, created
  timestamp, and a foreign key to the owning proposal.
- **Server**: endpoints to create an update (owner only) and to list a proposal's
  updates, newest first. Follow the existing route/query conventions in the
  proposal feature folder.
- **Shared types**: Zod schemas and types for the request and response.
- **Client API**: fetch functions following the existing pattern in
  `packages/client/src/api/`.
- **UI**: an updates section on the proposal detail page, plus a form for the owner
  to post one, using existing component primitives and design tokens.
- **Tests**: server and client tests for the endpoints and components, plus a
  Playwright E2E test for posting and reading an update.

### Done when

- `./scripts/ci-check.sh` passes (type-check, lint, format, build, unit tests).
- An owner can post an update, and it appears first in the list on the proposal
  page for everyone.
- Someone who is not the owner cannot post one.
- The change spans server, shared, and client packages.

<!--
Other ready-made options — paste one in place of the section above:

  • SMALL VISUAL (fast, ~1-2 tasks, produces a UI screenshot):
    Add an always-visible site footer to the web app. Create a `Footer`
    component under packages/client/src/ (existing patterns + Tailwind design
    tokens) showing the tagline "Every dollar moves the launch window closer"
    and "© 2026 Mars Mission Fund", mounted at the bottom of the app layout so
    it appears on every page. No backend/DB/deps, no E2E — a screenshot is the
    verification. Done when ci-check passes and the footer is visible at
    http://localhost:5173.

  • FULL-STACK READ-ONLY (a new query, endpoint and section, no forms):
    Add a "Trending Missions" section to the Explore page showing the 3 most
    popular live missions by contributor count, as a horizontal row above the
    main grid: a query, a GET endpoint following the existing conventions, a
    client fetch function, the section itself, and server, client and E2E
    tests. Done when ci-check passes and /explore shows the row.
-->
