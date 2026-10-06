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
| `HARNESS_YOLO` | unset | `1` turns the permissions below off |

## Permissions

By default the agent runs with `--settings harness/settings.json --setting-sources local
--permission-mode dontAsk`. `dontAsk` refuses anything not allowed instead of waiting for
an answer nobody gives, and `local` keeps the project's `.claude/settings.json` (which
allows `curl` and `git push`) from being merged in. The file is read from your checkout,
not the worktree, so the agent cannot edit its own rules. The script prints one line
before the agent starts: `permissions: harness/settings.json`.

### Allowed

- Reading, searching and editing files under the worktree.
- Tests, lint, type-check and build: `npm test`, `npm run test|lint|lint:md|format:check|build`,
  `npx vitest`, `npx tsc`, `npx eslint`, `npx prettier --check`.
- `ls` and read-only git: `git status`, `git diff`, `git log`.

### Denied

- Network tools: `curl`, `wget`, WebFetch, WebSearch.
- `git push`, `sudo`, and printing the environment: `env`, `printenv`, `export`.
- Starting another `claude`.
- Your original checkout, your home directory, `/etc`, `/proc` and `/tmp`.

Anything not listed is refused too.

Limits: these are rules about which tool calls Claude Code accepts, not a sandbox. An
allowed command runs its own code, so a test file can still do what the agent cannot do
directly. `tasks/probe-permissions.md` measures exactly that.

**Switch:** `HARNESS_YOLO=1 harness/run-task.sh <task>` restores
`--dangerously-skip-permissions` and prints `permissions: OFF (HARNESS_YOLO=1)`. Use it only
here, in the container.
