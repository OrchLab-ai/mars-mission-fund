# Autonomous Agent in Docker — Demo

A **self-contained** demo of an autonomous coding agent. Drop a feature request
into `PROMPT.md`, run `docker compose up`, and watch Claude Code plan the work,
break it into tasks, implement them one at a time, test and verify each change,
and capture screenshots — all inside a throwaway container.

No GitHub account, fork, or tokens required. The only credential you need is a
Claude token. The repo is **bind-mounted** into the container, so the agent edits
your real files on a throwaway demo branch — every change shows up live in your
editor (VS Code). Only the `node_modules` are container-only, so your host install
is never touched.

---

## The four pillars (what this demonstrates)

> **Build an Autonomous Agent in Docker.** Let an autonomous agent do the work;
> Docker provides the safety boundary.

| # | Pillar | Where it lives here |
|---|--------|---------------------|
| 01 | **Containerise** — codebase + test suite + Playwright in one image | `Dockerfile`, `docker-compose.yml` |
| 02 | **Agent Loop** — analyse → change → test → verify → repeat | `demo-loop.sh` + `prompts/` |
| 03 | **Guardrails** — token/cost cap, iteration cap, rollback on test failure | env vars in `.env`, enforced in `demo-loop.sh` |
| 04 | **Observe** — watch where it gets stuck and where it succeeds | streamed logs + `logs/` + `screenshots/` |

> Some runs will hit the **"Loop of Death"** — the agent thrashing on a task it
> can't finish. That is the point of the demo: the guardrails (iteration cap,
> rollback, stuck-detection) are what turn that failure into a safe, bounded
> stop instead of an infinite spend.

---

## Prerequisites

- **Docker** and Docker Compose. Nothing else — no Node, no Postgres on the host.
- A **Claude credential**: either a Claude Code OAuth token or an Anthropic API key.

Generate an OAuth token on a machine that has the Claude CLI:

```bash
claude setup-token
```

---

## Quick start

All commands run from this `autonomous-demo/` directory.

```bash
# 1. Configure credentials + guardrails
cp .env.example .env
#    then edit .env and paste your CLAUDE_CODE_OAUTH_TOKEN

# 2. Edit the feature request (an example is already provided)
#    open PROMPT.md and describe what you want built

# 3. Run it — picks a free web port (8080+), builds, runs the loop, then serves
./run.sh
```

> `./run.sh` finds the first free port from 8080 up and passes it to compose, so
> the browse step never fails on a taken port. Plain `docker compose up --build`
> also works (it uses `WEB_PORT`, default 8080).

Then watch the loop work. When it finishes, inspect the results:

```bash
cat logs/SUMMARY.md        # commits, files changed, screenshots
open screenshots/          # visual proof the feature works (macOS)
less logs/changes.diff     # the full diff the agent produced
```

### Browse the app it built

When the run finishes, the agent builds the production client and the **`web`**
service (nginx) serves it, reverse-proxying `/v1` to the backend. The run prints:

```text
  Browse the app the agent just built:
    → http://localhost:8080
```

Open that URL to click through the actual feature in a browser — the built site,
not a dev server. `./run.sh` auto-selects a free port starting at 8080, and the
printed URL always reflects the actual port. The container stays up serving it
until you press Ctrl-C. This is on by default; set `SERVE_AFTER=false` (and add
`--abort-on-container-exit`) if you'd rather the run just exit. Set a different
starting port with `WEB_PORT` in `.env`.

### Watch it work in your editor

Because the repo is bind-mounted, the agent's edits land in your real working
tree as it goes. Open the folder in VS Code and watch files change live, or open
**Source Control** to see the running diff on the demo branch. The branch name is
printed near the top of the run (`>>> Working on branch: demo/<timestamp>`).

### Reset after a run

The agent commits its work to a **demo branch in your repo**. Once you've
reviewed the diff, return to your previous branch and clean up:

```bash
git checkout main                  # or whatever branch you started on
git branch -D demo/<timestamp>     # the demo branch from the run output
```

To reset the container side (fresh container, DB, node_modules, outputs):

```bash
docker compose down -v             # also removes the container-only node_modules volumes
rm -rf logs screenshots
```

---

## How to provide a prompt

The agent builds whatever is in **`PROMPT.md`**. That is the single input.

Write it like a brief for a junior engineer. The clearer the "done when", the
better the agent's plan:

```markdown
# Feature Request

## <Feature name>

<What the user should be able to do, and where it lives in the app.>

### What to build
- ...

### Done when
- `./scripts/ci-check.sh` passes
- <observable behaviour, e.g. "visiting /explore shows a Trending row">
```

### Ready-made examples (workshop exercises)

`PROMPT.md` ships with **Exercise 03 — Trending Missions** because it spans the
full stack and therefore produces a multi-step plan. You can paste any of these
instead (see the commented block at the bottom of `PROMPT.md`):

| Exercise | What it does | Good for showing |
|----------|--------------|------------------|
| **03 — Trending Missions** (default) | New full-stack feature on the Explore page | A long `tasks.md`, UI screenshots, E2E tests |
| **01 — Refactor-Rename** | Rename `Campaign` → `Proposal` across the codebase + a SQL migration | Large, mechanical, cross-cutting edits |
| **02 — Observability** | Add structured request logging middleware | A focused backend-only change (no screenshots) |

The full exercise descriptions live in the repo root: `../01-exercise-rename.md`,
`../02-exercise-olly.md`, `../03-exercise-new-feature.md`.

---

## How the loop works (Pillar 02)

`demo-loop.sh` is a small **state machine**. The outer loop in `entrypoint.sh`
calls it repeatedly; each call advances one state and exits, so the loop is
restart-safe (state is inferred from files on disk).

```text
            ┌─────────────┐
PROMPT.md → │ create-brief │  analyse the request → plan/ready/brief.md
            └──────┬──────┘
                   ▼
            ┌─────────────┐
            │ create-tasks │  decompose the brief → plan/ready/tasks.md
            └──────┬──────┘
                   ▼
            ┌──────────────┐   one task per iteration:
            │ execute-tasks │   implement → ci-check → screenshot → commit
            └──────┬───────┘   ↺ repeats until every task is [x]
                   ▼               (verify gate + rollback after each task)
            ┌─────────────┐
            │   verify     │  full ci-check + Playwright screenshots + summary
            └──────┬──────┘
                   ▼
                 done ✔
```

Each state hands Claude a focused prompt from `prompts/`:

| State | Prompt | Job |
|-------|--------|-----|
| `create-brief` | `prompts/create-brief.md` | Turn `PROMPT.md` into a brief |
| `create-tasks` | `prompts/create-tasks.md` | Decompose the brief into `tasks.md` |
| `execute-tasks` | `prompts/execute-tasks.md` | Implement + verify ONE task, then stop |
| `verify` | `prompts/verify.md` | Prove the feature works, capture screenshots |
| (CI repair) | `prompts/remediate.md` | Fix a failing `ci-check.sh` |

### Plan-First Orchestration (two agents)

The loop deliberately splits into a **Planning Agent** and a **Coding Agent**
that run as *separate* Claude invocations with separate context — the executor
sees only the written plan (`brief.md` + `tasks.md`), never the planning
conversation. The plan is an explicit, reviewable artifact, not a vague
instruction.

| Aspect | Planning Agent (`create-brief` → `create-tasks`) | Coding Agent (`execute-tasks` → `verify`) |
| ------ | ------------------------------------------------ | ----------------------------------------- |
| Input | the request in `PROMPT.md` | the plan (`brief.md` + `tasks.md`) |
| Produces | a structured plan: breaking changes, affected files, migration steps, and verification criteria (which tests must pass) | working code, committed step by step |
| In Docker | writes no code | executes each step and runs the tests |
| Playwright | — | verifies the UI hasn't broken |

Claude runs with `--dangerously-skip-permissions` (safe — it is sandboxed in the
container) and the Playwright MCP server for browser-driven verification.

---

## Guardrails (Pillar 03)

All configurable in `.env`. These are the safety boundary — tune them live to
show their effect.

| Variable | Default | What it caps |
|----------|---------|--------------|
| `MAX_ITERATIONS` | `30` | Total outer-loop iterations before a hard stop |
| `MAX_TURNS` | `40` | Turns per Claude invocation — the **cost cap** |
| `TIMEOUT_SECONDS` | `1800` | Wall-clock per Claude invocation |
| `ROLLBACK_ON_FAILURE` | `true` | If the verify gate fails after a task, `git reset --hard` discards that task's changes |
| `MAX_ROLLBACKS` | `3` | Give up on a single task after this many rollbacks (stops the Loop of Death) |
| `COOLDOWN_SECONDS` | `3` | Pause between iterations |

**Rollback on test failure** is the headline guardrail: after a task is
implemented, the loop runs a fast type-check/build gate. If it fails, the broken
work is rolled back to the pre-task commit and retried — bounded by
`MAX_ROLLBACKS`. The agent never builds on top of broken code, and it can never
spin forever.

There are also two automatic backstops: per-state repeat detection and
per-task "no-progress" detection. Any of them can end the run with a **stuck**
exit, which `entrypoint.sh` reports clearly.

---

## What to observe (Pillar 04)

While it runs, watch the streamed output for the state banners
(`>>> State: execute-tasks`), the task counter (`Tasks remaining: 6 -> 5`), and
the guardrail messages (`Verify gate FAILED — rolling back...`).

Good questions for the audience:

- Where did it get stuck, and which guardrail caught it?
- Did it roll back? How many times before it found a working approach?
- Did the screenshots actually show the feature working?

Everything is persisted on the host for review after the run:

```text
autonomous-demo/
├── logs/
│   ├── SUMMARY.md            # commits, files changed, screenshots, rollback count
│   ├── changes.diff          # full diff vs main
│   ├── tasks.md              # the plan the agent generated
│   ├── demo-<state>-*.log    # raw Claude output per state
│   ├── ci-check-*.log        # CI runs
│   └── gate-*.log            # verify-gate runs (rollback decisions)
└── screenshots/
    ├── TASK-01.png ...        # per-task visual checks
    └── VERIFY-*.png           # final feature confirmation
```

---

## Files in this folder

```text
autonomous-demo/
├── README.md            # this file
├── run.sh               # launcher: pick a free web port, then docker compose up
├── Dockerfile           # Pillar 01: Claude Code + Playwright MCP + dbmate + repo deps
├── docker-compose.yml   # Pillar 01: agent + Postgres + nginx (web), volume mounts
├── entrypoint.sh        # use mounted repo, install deps, migrate DB, run the loop, serve
├── demo-loop.sh         # Pillars 02/03/04: the state machine + guardrails
├── nginx.conf           # web service: serve client build + proxy /v1 to backend
├── mcp.json             # demo MCP config: Playwright --output-dir /screenshots
├── prompts/             # one prompt per state
├── PROMPT.md            # ← YOUR feature request (the only input)
├── .env.example         # credentials + guardrail config
├── .gitignore           # ignores .env, logs/, screenshots/
└── .dockerignore
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `No Claude credentials` on start | Set `CLAUDE_CODE_OAUTH_TOKEN` (or `ANTHROPIC_API_KEY`) in `.env`. |
| `PROMPT.md is missing or empty` | Put your feature request in `PROMPT.md`. |
| Agent stops with **"stuck"** | Expected for hard prompts — that's the guardrails working. Read `logs/` to see where; simplify `PROMPT.md` or raise `MAX_ITERATIONS` / `MAX_ROLLBACKS`. |
| Slow first run | The image downloads Chromium and runs `npm ci`. Subsequent runs reuse the build cache. |
| Want to re-run cleanly | `docker compose down -v && rm -rf logs screenshots`. |
| Out of memory | The agent has a 4 GB limit in `docker-compose.yml`; raise `mem_limit` if your machine allows. |

> **Cost note:** an autonomous run makes many model calls. `MAX_TURNS`,
> `MAX_ITERATIONS`, and `TIMEOUT_SECONDS` bound the spend — keep them modest for
> a live demo and raise them only if you want the agent to tackle bigger work.
