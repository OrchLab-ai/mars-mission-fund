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

The deny list also covers the Agent tool (subagents), the Playwright MCP browser tools,
and inline interpreters (`node -e`, `node -p`, `python -c`, `python3 -c`).

## What this does not stop

`harness/settings.json` filters the tool calls Claude Code makes. It does not confine the
processes those calls start. A deny list only names what someone thought of, so each route
below stays open. The container is the real boundary; this file is a seat belt inside it.

| Route a deny list cannot close | Why | Container-level control |
|---|---|---|
| **Any allowed command that runs code the agent can edit**: `npm test`, `npx vitest`, `npm run build`, `npm run lint` | The agent writes a test, a config or an npm script, then runs it. That code runs as the same user with the same network and environment, and can fetch URLs, read variables, write outside the worktree or start `claude`. This is probe 5. | Egress allow-list, a non-root user and a read-only filesystem, below. Nothing in the settings file helps: the command is allowed. |
| Reaching the network by any other program or script (other binaries, `/dev/tcp`, any language runtime, a package install script) | Denying `curl` and `wget` blocks two names, not the capability. | An egress allow-list so only the model API is reachable. |
| Reading the credential from the environment or from a file (`/proc/<pid>/environ`, a child process, a config file under a path that is not denied) | The key must be in the process that runs `claude`, and children inherit it. Denied paths and `env` cover a few reads of it. | Keep the credential out of the agent's environment: the harness holds it, and a proxy or sidecar outside the agent's process tree adds it to model requests. |
| Writing outside the worktree from allowed code (`/tmp`, your original checkout, `$HOME`) | File rules apply to Claude's file tools and to Bash redirects it can parse, not to what a test does at runtime. | A read-only filesystem outside the worktree, with only `runs/<id>/repo` and a scratch dir writable. |
| Privilege: `sudo` is denied, but setuid binaries, a root-owned socket or a root user make it moot | The rule blocks a command name, not a privilege. | Run as a non-root user with no sudo, no extra capabilities and `no-new-privileges`. |
| Running Claude Code again, directly or from inside a test (`claude -p`, `npx` fetching another agent) | `Bash(claude:*)` matches the command name only. | Egress allow-list and a non-root user with no credential in its environment: a second process then has no key and no route out. |
| Names nobody listed: another interpreter, `bash -c`, `sh -c`, `perl -e`, a renamed binary | Deny rules match command patterns. | Same three controls; they limit what any process can do, whatever it is called. |

So: a non-root user, the credential kept out of the agent's environment, an egress
allow-list and a read-only filesystem outside the worktree each close a route the deny list
cannot. Until they are in place, treat a harness run as able to do anything the container
user can do, and keep `HARNESS_YOLO=1` for work you would run by hand anyway.
