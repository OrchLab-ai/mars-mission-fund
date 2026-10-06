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
- `before.png`, `after.png` — screenshots of the first proposal's detail page (see Gate and screenshots).
- `web.log` — output of the site served for the screenshots.

The record is outside the worktree, so removing the worktree keeps it
(`git worktree remove /workspace/runs/<id>/repo`).

Whatever the agent changed is committed to the branch, after the script runs the worktree's own
Prettier (`npx prettier --write --ignore-unknown`) on the changed files, as a pre-commit hook
would: the agent may check formatting but not rewrite it, and a style nit should not fail the
gate. Deleted files and files Prettier does not handle are skipped; its output is in `run.log`. The script prints the run id,
branch, model that ran, turns and cost, then the agent's final message, then the gate
(below). The branch is kept whatever the outcome, so it can be inspected.

## Gate and screenshots

After the work is committed, the script runs `./scripts/ci-check.sh` inside the run's worktree
(with `npm_config_ignore_scripts=true`, since the install's `prepare` step cannot write git hooks
from a worktree) and appends its output to `run.log`. It then prints `--- gate` and exactly
`GATE PASSED` or `GATE FAILED`. If the run committed nothing, that is `GATE FAILED` too: an
empty run has not done the task, and untouched code would pass the checks.

For the human reviewer, before the agent starts the script serves the worktree's client on
`HARNESS_WEB_PORT` (default `5373`, `--strictPort`), sending `/v1` to the running API on
3001, and uses the worktree's Playwright to screenshot the detail page of the first proposal
(from `GET /v1/proposals`) as `before.png`. After the commit it screenshots the same page as
`after.png`, and copies both to `/screenshots/<run id>-before.png` and
`/screenshots/<run id>-after.png`, so they open on the host and runs never overwrite each
other. The paths are printed after the gate line. The site is stopped when the run ends,
whatever happens. A screenshot that fails is reported but never fails the run.

Exit status: the agent's status if that is non-zero (124 on timeout), otherwise `0` if the gate
passed and `1` if it failed.

## Settings (environment variables)

| Variable | Default | Meaning |
|---|---|---|
| `HARNESS_MODEL` | `sonnet` | `--model` alias or full name |
| `MAX_TURNS` | `25` | turn cap |
| `TIMEOUT_SECONDS` | `900` | wall-clock limit |
| `HARNESS_WEB_PORT` | `5373` | port for the site served for the screenshots |
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
- Starting Claude Code (`claude`, `npx claude`, `npx @anthropic-ai/*`) and subagents (the Agent
  tool), which would run with their own permissions.
- Inline interpreters: `node -e`/`--eval`/`-p`/`--print`, `python -c`, `python3 -c`.
- The browser: every Playwright MCP tool.
- `/proc`, through Read, Edit and Write and as a path in any Bash command.
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

## What this does not stop

`settings.json` is a deny list matched against the text of each tool call. It refuses the
calls it recognises; it does not limit what a process can do once it runs. These routes stay
open, and each is closed by a control on the container, not by another rule here.

| Route | Why a deny list cannot close it | Container control that does |
|---|---|---|
| **Allowed commands that run code the agent can edit**: `npm test`, `npm run build`/`lint`, `npx vitest`, `npx tsc`, `npx eslint`. The agent writes a test, a config file or an npm script (all inside `./**`, so Edit and Write allow it), then runs the allowed command. That code is not a tool call, so no rule sees it: it can fetch a URL, read the environment, write `/tmp` or start `claude`. | The permission is on the command, not on what the command does. Blocking it would mean blocking the tests the agent exists to run. Any pattern allowing `npm test` allows this. | All four, since the code runs as the container user with its network and environment: a non-root user, the credential kept out of the environment, an egress allow-list, and a read-only filesystem outside the worktree. |
| **The credential in the environment** (`CLAUDE_CODE_OAUTH_TOKEN`, `ANTHROPIC_API_KEY`). `env` and `printenv` are denied, but `process.env` in a test, `/proc/self/environ` or a child process reads it just as well. | Every route to a process's environment cannot be listed. `Bash(* /proc*)` and `Read(//proc/**)` block only the obvious spellings. | Keep the credential out of the agent's environment: pass it to the Claude Code process only, not to the shell and test processes it starts (or use a short-lived or proxied token). |
| **Network**. `curl`, `wget`, WebFetch and WebSearch are denied, but a test can call `fetch`, a package's postinstall can phone home, and `git` can reach remotes other than through `push`. | Rules match command names and cannot see sockets. | An egress allow-list, so only the model API is reachable; everything else fails at the network, whoever makes the call. |
| **Writing outside the worktree** (`/tmp`, the original checkout `/workspace/repo`, the home directory, `/etc`). Edit and Write are restricted, and Bash paths are pattern-matched, but a test using `fs.writeFileSync` is not. The `Bash(* /*)` rule is bypassed by anything built at run time, such as `path.join('/', 'tmp')`. | Path rules are string matches on the call, not file-system permissions. | A read-only filesystem outside the worktree (read-only root, with only `/workspace/runs/<id>/` writable), and a non-root user with no write access to the original checkout. |
| **Running as the same user as the human**, with `sudo` denied only by name. Anything the user can do, the agent's code can do: edit `~/.claude`, `.git/hooks`, shell profiles, or the harness itself. | The allow and deny lists are the agent's own configuration, in a file it can reach by another route. | Run as a non-root user dedicated to the harness, with a home directory that holds nothing, and no write access to `harness/` or `.git` of the original checkout. |
| **Starting another Claude Code** with different settings: `claude` is denied, but a test or script can spawn it with `child_process`, with `--dangerously-skip-permissions`. Subagents likewise start with a root of the agent's choosing. | The child is a new process; the parent's rules do not apply to it. | Keep the credential out of the environment (no credential, no model call), and the egress allow-list (the child can reach the model API, so it needs the first control too). |
| **Bash patterns themselves**: `* /*` and `* ..` are matched on text, so quoting, variables (`cd "$HOME"`) and chaining tricks can get past them. Interpreters beyond the denied ones (`perl`, `ruby`, `awk`, `npx` packages, `git` aliases) are not listed either. | A deny list names what it knows about; the set of ways to run code is open-ended. | The same four controls: they hold whichever way the code was started. |

### Why the container is the boundary

A deny list stops a well-meaning agent from making an obvious mistake; it is a guard rail, not
a wall. Anything the agent can get running (and an allowed `npm test` always lets it) runs
with the container's user, environment, network and filesystem, and those are the only things
that decide what it can reach. So treat the rules in `settings.json` as a second layer, and
make these four the first:

1. Run as a non-root user that owns only the worktree.
1. Keep the credential out of the agent's environment.
1. Allow egress to the model API only.
1. Mount everything outside the worktree read-only.

The permissions probe (`harness/tasks/probe-permissions.md`, probe 5) tests exactly this: if
the throwaway test can still fetch a page, see a credential, write `/tmp` or start `claude`,
the container is the gap, not the rules.
