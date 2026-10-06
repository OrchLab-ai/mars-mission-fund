# Headless harness

Runs one task with Claude Code (`claude -p`) in its own git worktree.

```bash
harness/run-task.sh harness/tasks/define-tokens.md
```

Each run gets an id from the timestamp and a folder `/workspace/runs/<id>/`:

- `repo/` — git worktree on a new branch `harness/<id>` cut from the current HEAD, where the agent works. Your checkout is not touched.
- `events.jsonl` — every stream-json event, as it arrived.
- `run.log` — `npm ci` output, tool-call lines and claude's stderr.
- `result.md` — the agent's final message: its answer to the task.

The record is outside the worktree, so removing the worktree keeps it
(`git worktree remove /workspace/runs/<id>/repo`).

Whatever the agent changed is committed to the branch. The script prints the run id,
branch, model that ran, turns and cost, then the agent's final message, and exits with
the agent's status (non-zero on failure; 124 on timeout).

## Settings (environment variables)

| Variable | Default | Meaning |
|---|---|---|
| `HARNESS_MODEL` | `sonnet` | `--model` alias or full name |
| `MAX_TURNS` | `25` | turn cap |
| `TIMEOUT_SECONDS` | `900` | wall-clock limit |

## Permissions

By default the agent runs under `harness/settings.json` with `--permission-mode dontAsk`,
so anything not allowed is refused rather than waiting for an answer nobody gives. It also
runs with `--setting-sources local`, so the project's `.claude/settings.json` (which allows
`curl` and `git push`) is not merged in. The run prints `permissions: harness/settings.json`
before the agent starts.

Allowed:

- Read and edit files inside the worktree, plus Glob and Grep.
- Tests: `npm test`, `npm run test ...`, `npm run test:coverage`, `npx vitest ...`.
- Lint: `npm run lint`, `npm run lint:md`, `npm run format:check`, `npx eslint`,
  `npx prettier --check`.
- Type-check: `npm run build -w @mmf/shared`, `npx tsc ...`.
- `git status` and `git diff`.

Denied (a deny always beats an allow):

- Network: `curl`, `wget`, WebFetch, WebSearch.
- `git push` and `sudo`.
- Printing the environment: `env`, `printenv`.
- Reading or editing `/etc` and your home directory. Everything else outside the worktree
  is not allowed, so it is refused too.

Set `HARNESS_YOLO=1` to run with `--dangerously-skip-permissions` instead, so the agent
can do anything in the container. The run then prints `permissions: OFF (HARNESS_YOLO=1)`.
Use it only here.
