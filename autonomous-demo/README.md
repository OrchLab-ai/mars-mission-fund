# Autonomous Agent in Docker — Demo

An autonomous coding agent in a container. Put a feature request in `PROMPT.md`,
start the agent, and watch Claude Code plan the work, break it into tasks,
implement them one at a time, test and verify each change, and capture
screenshots — all inside a throwaway container.

This is Level 4 of the workshop. It runs as the `autonomous-agent` service of the
workshop stack (`docker-compose.workshop.yml` in the workshop repository), which
bind-mounts this repository as `app/`. The agent edits your real files on a
throwaway demo branch, so every change shows up live in your editor. Only
`node_modules` are container-only.

---

## The four pillars (what this demonstrates)

> **Build an Autonomous Agent in Docker.** Let an autonomous agent do the work;
> Docker provides the safety boundary.

| # | Pillar | Where it lives here |
|---|--------|---------------------|
| 01 | **Containerise** — codebase + test suite + Playwright in one image | `Dockerfile`, the `autonomous-agent` service |
| 02 | **Agent Loop** — analyse → change → test → verify → repeat | `demo-loop.sh` + `prompts/` |
| 03 | **Guardrails** — token/cost cap, iteration cap, rollback on test failure | env vars on the service, enforced in `demo-loop.sh` |
| 04 | **Observe** — watch where it gets stuck and where it succeeds | streamed logs + `logs/` + `screenshots/` |

> Some runs will hit the **"Loop of Death"** — the agent thrashing on a task it
> can't finish. That is the point of the demo: the guardrails (iteration cap,
> rollback, stuck-detection) are what turn that failure into a safe, bounded
> stop instead of an infinite spend.

---

## Running it

From the root of the workshop repository — the stack from the start of the day
must already be set up, and its `.env` holds the same Claude credential the
rest of the day uses:

```bash
# 1. Edit the feature request (Mission Updates is the default)
#    open app/autonomous-demo/PROMPT.md

# 2. Build the image, start the agent, watch the loop
docker compose -f docker-compose.workshop.yml --profile l4 up --build autonomous-agent
```

When it finishes, inspect the results (paths from the workshop root):

```bash
cat app/autonomous-demo/logs/SUMMARY.md     # commits, files changed, screenshots
less app/autonomous-demo/logs/changes.diff  # the full diff the agent produced
ls screenshots/                             # visual proof the feature works
```

### Watch it work in your editor

Because the repository is bind-mounted, the agent's edits land in your working
tree as it goes. Open **Source Control** in your editor to see the running diff
on the demo branch. The branch name is printed near the top of the run
(`>>> Working on branch: demo/<timestamp>`).

### Reset after a run

The agent commits its work to a **demo branch** cut from wherever you started.
Once you've reviewed the diff, go back to your own branch and delete the demo
one (from `app/`):

```bash
git checkout -                     # the branch you were on before the run
git branch -D demo/<timestamp>     # the demo branch from the run output
```

Or jump to any checkpoint with `./checkpoint.sh <n>` from the workshop root.

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

### Ready-made examples

`PROMPT.md` ships with **Mission Updates** — the feature built by hand earlier in
the day — because it spans the full stack and therefore produces a multi-step
plan, and you can compare the agent's result with your own. You can paste either
of these instead (see the commented block at the bottom of `PROMPT.md`):

| Request | What it does | Good for showing |
|---------|--------------|------------------|
| **Mission Updates** (default) | Owners post updates; backers read them on the proposal page | A long `tasks.md`, UI screenshots, E2E tests |
| **Site footer** | One small UI component | A fast run that ends in a screenshot |
| **Trending Missions** | A read-only row on the Explore page | Full stack without forms |

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

Set them in the workshop's `.env` (the `autonomous-agent` service passes them
through). These are the safety boundary — tune them live to show their effect.

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
app/autonomous-demo/
├── logs/
│   ├── SUMMARY.md            # commits, files changed, screenshots, rollback count
│   ├── changes.diff          # full diff vs where the run started
│   ├── tasks.md              # the plan the agent generated
│   ├── demo-<state>-*.log    # raw Claude output per state
│   ├── ci-check-*.log        # CI runs
│   └── gate-*.log            # verify-gate runs (rollback decisions)
screenshots/                  # in the workshop root
├── TASK-01.png ...           # per-task visual checks
└── VERIFY-*.png              # final feature confirmation
```

---

## Files in this folder

```text
autonomous-demo/
├── README.md            # this file
├── Dockerfile           # Pillar 01: Claude Code + Playwright MCP + dbmate + repo deps
├── entrypoint.sh        # use mounted repo, install deps, migrate DB, run the loop
├── demo-loop.sh         # Pillars 02/03/04: the state machine + guardrails
├── prompts/             # one prompt per state
├── PROMPT.md            # ← YOUR feature request (the only input)
├── .gitignore           # ignores logs/
└── .dockerignore
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `No Claude credentials` on start | Set `CLAUDE_CODE_OAUTH_TOKEN` (or `ANTHROPIC_API_KEY`) in the workshop's `.env` — `./verify-setup.sh` checks it. |
| `PROMPT.md is missing or empty` | Put your feature request in `PROMPT.md`. |
| Agent stops with **"stuck"** | Expected for hard prompts — that's the guardrails working. Read `logs/` to see where; simplify `PROMPT.md` or raise `MAX_ITERATIONS` / `MAX_ROLLBACKS`. |
| Slow first run | The image downloads Chromium and runs `npm ci`. Subsequent runs reuse the build cache. |
| Want to re-run cleanly | Delete the demo branch (see "Reset after a run") and `rm -rf app/autonomous-demo/logs`. |
| Out of memory | The agent has a 4 GB limit in `docker-compose.workshop.yml`; raise `mem_limit` if your machine allows. |

> **Cost note:** an autonomous run makes many model calls. `MAX_TURNS`,
> `MAX_ITERATIONS`, and `TIMEOUT_SECONDS` bound the spend — keep them modest for
> a live demo and raise them only if you want the agent to tackle bigger work.
