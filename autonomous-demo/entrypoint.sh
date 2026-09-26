#!/usr/bin/env bash
set -euo pipefail

# ════════════════════════════════════════════════════════════════════════════
#  Autonomous Agent in Docker — DEMO entrypoint
#
#  Pillar 01 (Containerise): this container holds the codebase, test suite and
#  Playwright. Pillars 02/03/04 (Agent Loop / Guardrails / Observe) live in
#  demo-loop.sh, which this script calls in a capped loop.
# ════════════════════════════════════════════════════════════════════════════

echo ">>> Autonomous demo starting"

# ── Pillar 03: Guardrails (read from env, with safe defaults) ────────────────
MAX_ITERATIONS="${MAX_ITERATIONS:-30}"   # hard cap on outer loop iterations
COOLDOWN_SECONDS="${COOLDOWN_SECONDS:-3}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-1800}" # per Claude invocation (wall-clock)
MAX_TURNS="${MAX_TURNS:-40}"             # cost guardrail: turns per invocation
export MAX_ITERATIONS COOLDOWN_SECONDS TIMEOUT_SECONDS MAX_TURNS

# ── Validate Claude auth ─────────────────────────────────────────────────────
if [ -z "${CLAUDE_CODE_OAUTH_TOKEN:-}" ] && [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "!!! No Claude credentials. Set CLAUDE_CODE_OAUTH_TOKEN (or ANTHROPIC_API_KEY)"
  echo "!!! in autonomous-demo/.env (copy from .env.example)."
  exit 1
fi

# ── Validate the feature request ─────────────────────────────────────────────
PROMPT_FILE="/workspace/PROMPT.md"
if [ ! -s "$PROMPT_FILE" ]; then
  echo "!!! PROMPT.md is missing or empty."
  echo "!!! Edit autonomous-demo/PROMPT.md with the feature you want built."
  exit 1
fi

# ── Git identity + trust mounted/cloned dirs ─────────────────────────────────
git config --global user.name  "${GIT_USER_NAME:-MMF Demo Agent}"
git config --global user.email "${GIT_USER_EMAIL:-demo-agent@marsmissionfund.local}"
git config --global --add safe.directory '*'

# ── Smoke-test the Playwright MCP server ─────────────────────────────────────
echo ">>> Smoke-testing Playwright MCP server..."
node -e "require('/usr/lib/node_modules/@playwright/mcp/cli.js')" 2>/dev/null \
  && echo ">>> MCP server module loads OK" \
  || { echo "!!! Playwright MCP cli.js failed to load"; exit 1; }

# ── Use the bind-mounted repo directly ───────────────────────────────────────
# The repo is mounted read-write at /workspace/repo, so the agent edits the REAL
# files on your host — you can watch every change in VS Code. node_modules are
# shadowed by container-only volumes (see docker-compose.yml), so npm ci here
# never touches your host's node_modules.
REPO_DIR="/workspace/repo"
if [ ! -d "$REPO_DIR/.git" ]; then
  echo "!!! ${REPO_DIR} is not a git repo. Is the bind mount configured?"
  exit 1
fi
cd "$REPO_DIR"

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "!!! Note: the repo has uncommitted changes. The agent will branch off the"
  echo "!!! current HEAD and may sweep them into commits. For a clean demo, run"
  echo "!!! from a clean checkout of main."
fi

# ── Pick a base ref for diffs, then branch off the current HEAD ───────────────
if git show-ref --verify --quiet "refs/heads/main"; then
  BASE_BRANCH="main"
elif git show-ref --verify --quiet "refs/remotes/origin/main"; then
  BASE_BRANCH="origin/main"
else
  BASE_BRANCH="$(git rev-parse HEAD)"
fi
export BASE_BRANCH

BRANCH="${DEMO_BRANCH:-demo/$(date +%Y%m%d-%H%M%S)}"
if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  git checkout "$BRANCH"
else
  git checkout -b "$BRANCH"
fi
echo ">>> Working on branch: ${BRANCH} (diffing against: ${BASE_BRANCH})"

# ── Fix ownership of the container-only node_modules volumes ──────────────────
# Docker creates named-volume mount points owned by root; the non-root `agent`
# user can't write into them, so `npm ci` fails with EACCES. chown them first
# (the agent has passwordless sudo). These are container-only volumes, so this
# never affects your host's node_modules.
for nm in node_modules packages/client/node_modules packages/server/node_modules packages/shared/node_modules; do
  if [ -d "$nm" ]; then
    sudo chown agent:agent "$nm" 2>/dev/null || true
  fi
done

# ── Warm dependencies (codebase + test suite + Playwright) ───────────────────
if [ -f package.json ]; then
  echo ">>> Installing dependencies (npm ci)"
  npm ci
  echo ">>> Installing Chromium for the project's Playwright"
  npx playwright install chromium
fi

# ── Database — for unit/E2E tests and visual verification ────────────────────
export DATABASE_URL="${DATABASE_URL:-postgresql://mmf:mmf@db:5432/mmf?sslmode=disable}"
export JWT_SECRET="${JWT_SECRET:-demo-jwt-secret}"
echo ">>> Migrating database"
dbmate -d packages/server/db/migrations -s packages/server/db/schema.sql up \
  || echo "!!! dbmate migration failed (DB-dependent tests may fail)"

# ── Announce guardrails (Pillar 03) ──────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════"
echo "  Autonomous demo — building from PROMPT.md"
echo "  Guardrails:"
echo "    • max iterations : ${MAX_ITERATIONS}"
echo "    • max turns/call : ${MAX_TURNS}    (cost cap)"
echo "    • timeout/call   : ${TIMEOUT_SECONDS}s"
echo "    • rollback on test failure : ${ROLLBACK_ON_FAILURE:-true}"
echo "════════════════════════════════════════════════════"

# ── Pillar 02: the Agent Loop (analyse → change → test → verify → repeat) ─────
iteration=0
while [ "$iteration" -lt "$MAX_ITERATIONS" ]; do
  iteration=$((iteration + 1))
  echo "--- Iteration ${iteration}/${MAX_ITERATIONS} ---"

  exit_code=0
  demo-loop.sh || exit_code=$?

  if [ "$exit_code" -eq 0 ]; then
    echo ">>> Demo complete 🎉"
    break
  elif [ "$exit_code" -eq 2 ]; then
    # Pillar 04: this is the "Loop of Death" backstop — the agent is stuck.
    echo "!!! Agent stuck (guardrail tripped). Stopping. See autonomous-demo/logs/."
    break
  fi

  if [ "$iteration" -lt "$MAX_ITERATIONS" ]; then
    echo ">>> Cooling down ${COOLDOWN_SECONDS}s..."
    sleep "$COOLDOWN_SECONDS"
  fi
done

if [ "$iteration" -ge "$MAX_ITERATIONS" ]; then
  echo "!!! Reached iteration cap (${MAX_ITERATIONS}) — stopping (guardrail)."
fi

echo ""
echo "=== Demo run finished (branch: ${BRANCH}) ==="
echo "=== Diff + summary in autonomous-demo/logs/, screenshots in autonomous-demo/screenshots/ ==="

# ── Serve the built app so you can browse the changes (Pillar 04: Observe) ────
# Build the production client (the `web` nginx service serves packages/client/dist
# and proxies /v1 here), then run the backend in the foreground to stay up.
if [ "${SERVE_AFTER:-true}" = "true" ]; then
  echo ""
  echo ">>> Building the client so you can browse it (npm run build)"
  npm run build || echo "!!! build failed — nginx serves the last successful build, if any"

  echo ""
  echo "════════════════════════════════════════════════════"
  echo "  Browse the app the agent just built:"
  echo "    → http://localhost:${WEB_PORT:-8080}"
  echo "  Changes are on branch ${BRANCH}. Press Ctrl-C to stop."
  echo "════════════════════════════════════════════════════"

  # Foreground backend keeps the container (and the served site) alive.
  exec npx tsx packages/server/src/index.ts
fi

echo "=== Inspect results in autonomous-demo/logs/ and autonomous-demo/screenshots/ ==="
