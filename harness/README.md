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

- `api.log`, `web.log` — output of the run's own API and client (see Screenshots).
- `screenshots.log` — Playwright output, and `before.png` / `after.png` (see Screenshots).

Whatever the agent changed is committed to the branch, after the changed files are formatted
with the worktree's own Prettier (`npx prettier --write --ignore-unknown`), as a pre-commit
hook would: the agent may check formatting but not rewrite it, and a style nit should not
fail the gate. The script prints the run id, branch, model that ran, turns and cost, then
the agent's final message, then the gate.

## Pipeline: plan, then code

```bash
harness/pipeline.sh harness/tasks/mission-updates.md
```

One run id, one run folder and one worktree, shared code with `run-task.sh` (`harness/lib.sh`),
and one `run.log` and `events.jsonl` that both stages write to.

1. The before screenshot is taken.
1. **Stage 1, plan:** `claude -p` with `harness/settings.plan.json`: Read, Glob, Grep and the same
   look-around Bash commands and denies as `settings.json`, but no Edit, no Write and no other
   commands. It is told it is the planning stage and must output a markdown plan. The harness
   saves that output as `plan.md`. `HARNESS_YOLO` does not apply to this stage. If it fails or
   produces no plan, stage 2 does not run.
1. **Stage 2, code:** `claude -p` with `harness/settings.json`; its whole prompt is the plan,
   after "Execute this plan exactly. If a step is wrong, stop and say so rather than
   improvising."
1. Once, after stage 2: Prettier, the commit, the after screenshot and the gate.

The script prints where each stage's output is: `plan.md` (stage 1), `result.md` (stage 2's
final message) and `events.jsonl` and `run.log` (both). Model, turns and cost are totals over
both stages.

## The gate

After the commit, `./scripts/ci-check.sh` runs inside the run's worktree with
`npm_config_ignore_scripts=true` (the install's `prepare` step cannot write git hooks from a
worktree). Its output goes to `run.log`. The script prints a `--- gate` line, then exactly
`GATE PASSED` or `GATE FAILED`. The branch is kept either way, so it can be inspected.

A run that committed nothing is `GATE FAILED`: it has not done the task, and checking
untouched code would pass.

**Exit status:** the agent's own non-zero status if it has one (124 on timeout); otherwise 1
if the gate failed; otherwise 0.

## Screenshots

For the human reviewer, taken from the run's own copy of the app, so they show the worktree's
code and never touch the running one:

- Before the agent starts, a database for this run alone is created beside the one in
  `DATABASE_URL` (named `<db>_harness_<run id>`) and migrated with `dbmate` from the worktree's
  migrations (the seed migrations give it the usual proposals). Only `dbmate` and the run's API
  get it, as an inline variable; the agent and the gate never do.
- The worktree's API starts on `HARNESS_API_PORT` (default 3373) and its client on
  `HARNESS_WEB_PORT` (default 5373, `--strictPort`, proxying to that API). Each runs under
  `setsid` and is stopped by killing its whole process group.
- Playwright from the worktree's `node_modules` (`harness/screenshot.cjs`) photographs
  `/proposals/00000000-0001-0000-0000-000000000001` as `before.png`. Both servers are then
  stopped, so nothing of the run's is listening while the agent works.
- After the commit the database is migrated again (the agent may have added migrations), both
  servers start again from the committed code, and `after.png` is taken. This is done before
  the gate, whose `npm ci` replaces `node_modules`.
- Both are copied to `/screenshots/<run id>-before.png` and `-after.png`, and their paths are
  printed after the gate line.
- If either port already answers beforehand, the screenshots are skipped and the script says
  so, rather than photographing someone else's server.
- When the run ends, however it ends, both servers are stopped and the run's database is
  dropped.

A screenshot that fails is reported, but never fails the run.

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
