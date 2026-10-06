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
| `HARNESS_YOLO` | unset | `1` turns the permissions off (see below) |

## Permissions

By default the agent runs with `--settings harness/settings.json`,
`--permission-mode dontAsk` (anything not allowed is refused, not asked about) and
`--setting-sources local` (the project's `.claude/settings.json`, which allows `curl` and
`git push`, is not merged in). It is also told the rules up front with
`--append-system-prompt`, because a refused call only says it was denied.
The script prints `permissions: harness/settings.json` before the agent starts.

Allowed:

- Read, Edit and Write only on `./**`, the worktree (the agent's working directory). Glob and
  Grep are allowed too, and the Read deny rules below apply to them.
- Bash look-around commands: `cd`, `pwd`, `ls`, `cat`, `head`, `tail`, `wc`, `grep`, `find`,
  `sort`, `uniq`, `sed`, `cut`, `tr`, `comm`, `diff`.
- Bash checks: `npm test`, `npm run test`, `test:coverage`, `lint`, `lint:md`,
  `format:check`, `build`, and `npx vitest`, `npx tsc`, `npx eslint`, `npx prettier --check`.

Denied:

- Network: `curl`, `wget`, WebFetch, WebSearch.
- `git push`, `sudo`, `env`, `printenv`.
- `find` with `-exec`, `-execdir`, `-ok`, `-okdir`, `-delete` or `-fprint`; `sed -i`.
- Read, Edit and Write on the original checkout (`/workspace/repo/**`), the home directory
  (`~/**`), `/tmp`, `/etc` and `/proc`.
- Anything outside the worktree: absolute, `~` and `..` paths in Bash commands. This is
  best-effort pattern matching on the command text, not a sandbox.
- Everything else not listed above.

Set `HARNESS_YOLO=1` to restore the old behaviour (`--dangerously-skip-permissions`: the agent
can do anything in the container; use it only here). The script then prints
`permissions: OFF (HARNESS_YOLO=1)`.

```bash
HARNESS_YOLO=1 harness/run-task.sh harness/tasks/define-tokens.md
```
