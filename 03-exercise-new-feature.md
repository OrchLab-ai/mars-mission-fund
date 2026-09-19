# Exercise 03 — New Feature (Trending Missions)

## The challenge

Add a *Trending Missions* section to the Explore Missions page.
It should show the 3 most popular live proposals by contributor count, displayed as a horizontal row above the main proposal grid.

## What you are building

- **Database**: a new query against the `proposals` table, filtered to `Live` status, ordered by `contributor_count` descending, limited to 3
- **Server**: a new API endpoint `GET /v1/proposals/trending` that returns the top 3 as proposal summaries
- **Shared types**: a type for the trending response (or reuse `ProposalSummary`)
- **Client API**: a new fetch function in `packages/client/src/api/proposals.ts`
- **UI**: a new section at the top of the Explore Missions page (`packages/client/src/pages/ProposalsPage.tsx`, routed at `/proposals`)
- **Tests**: server and client tests for the new endpoint and component

## Why this is hard without AI

Adding a feature that spans the full stack in an unfamiliar codebase requires:

- Finding where the Explore Missions page lives and how it currently fetches data
- Understanding the server's route structure and query conventions
- Understanding the database schema to find the right columns for ranking
- Adding shared types that both server and client agree on
- Following the existing client API pattern so the new function fits consistently
- Placing the UI section correctly using existing component primitives

Estimated time without AI assistance: **3–6 hours** (mostly spent reading and navigating the codebase before writing a single line).

## Suggested prompt

```text
Add a "Trending Missions" section to the Explore Missions page.
It should show the 3 most popular live proposals by contributor count.
Display them in a horizontal row above the main proposal grid.
Add a GET /v1/proposals/trending endpoint on the server.
Follow the existing patterns for routes, queries, shared types, and client API functions.
Add tests at the server and client layers.
```

## Success criteria

- `npm run build` passes with no TypeScript errors
- `npm run test` passes
- Start the full stack (`./scripts/run-local.sh`) and visit `/proposals`
- A *Trending Missions* row appears above the main grid
- `git diff main --stat` shows changes in at least 6 files spanning server, shared, and client packages
