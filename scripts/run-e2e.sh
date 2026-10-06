#!/usr/bin/env bash
set -euo pipefail

# Run E2E tests against their OWN database and their OWN ports, all torn down after.
# Requires: DATABASE_URL, JWT_SECRET in environment; dbmate installed.
# Usage: ./scripts/run-e2e.sh [playwright-args...]
#
# A separate database because DATABASE_URL is usually shared: in the workshop the
# autonomous agent and the attendee's running app point at the same Postgres, and the
# old teardown ("dbmate down" until nothing was left) dropped every table under the
# live app. The E2E database is DATABASE_URL with "_e2e" appended to its name, unless
# E2E_DATABASE_URL says otherwise, so the app's own data is never touched.
#
# Separate ports for the same reason. In the workshop the attendee's app already holds
# 3001 (API) and 5173 (site). An E2E API on 3001 either failed to bind while the dev
# API answered in its place - tests on the shared database - or, once an agent stopped
# the dev API to free the port, left the attendee's site returning 500s. So the E2E API
# and its Vite run on spare ports (E2E_API_PORT, E2E_WEB_PORT), the run refuses to start
# if either is taken, and everything it started is killed on the way out.
# 5273, not 5174: 5174 is where the workshop moves the attendee's site when 5173 is busy.

API_PORT="${E2E_API_PORT:-3101}"
WEB_PORT="${E2E_WEB_PORT:-5273}"

# Something answering on the port means it is taken. bash's /dev/tcp needs no extra tools.
port_taken() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }
for port in "$API_PORT" "$WEB_PORT"; do
  if port_taken "$port"; then
    echo ">>> Port ${port} is already in use - refusing to start." >&2
    echo ">>> Likely a leftover E2E run. Do not stop the dev servers on 3001/5173 to make room." >&2
    exit 1
  fi
done

base="${DATABASE_URL%%\?*}"
query=""
[ "$base" != "$DATABASE_URL" ] && query="?${DATABASE_URL#*\?}"
export DATABASE_URL="${E2E_DATABASE_URL:-${base}_e2e${query}}"
# The name only - the URL carries the password.
e2e_name="${DATABASE_URL##*/}"
echo ">>> E2E database: ${e2e_name%%\?*}"
echo ">>> E2E ports: API ${API_PORT}, site ${WEB_PORT}"

# Job control puts each background job in its own process group, so cleanup can kill a
# job together with everything it spawned (tsx's node, Playwright's Vite).
set -m
SERVER_PID=""
TESTS_PID=""

kill_group() {
  [ -n "$1" ] || return 0
  kill -- "-$1" 2>/dev/null || true
  wait "$1" 2>/dev/null || true
}

cleanup() {
  trap - INT TERM
  echo ">>> Stopping the E2E servers..."
  kill_group "$TESTS_PID"
  kill_group "$SERVER_PID"
  echo ">>> Dropping the E2E database..."
  dbmate drop >/dev/null 2>&1 || echo ">>> WARNING: could not drop the E2E database."
  echo ">>> E2E teardown complete."
}
trap cleanup EXIT
trap 'exit 130' INT TERM

echo ">>> Creating and migrating the E2E database..."
# A leftover from an interrupted run is dropped first, so every run starts clean.
dbmate drop >/dev/null 2>&1 || true
dbmate create
dbmate --no-dump-schema -d packages/server/db/migrations up

# Start server directly (not via npm) so kill sends SIGTERM to the node
# process, triggering graceful shutdown and DB pool cleanup.
PORT="$API_PORT" npx tsx packages/server/src/index.ts &
SERVER_PID=$!

# "Is anything answering", not "does this route work": a route name here would break
# the day a route is renamed. The port was free above, so whatever answers is ours.
# curl writes 000 when the connection is refused.
echo ">>> Waiting for backend..."
for _ in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${API_PORT}/" 2>/dev/null || true)
  [ "$code" != "000" ] && break
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo ">>> Backend exited before it answered." >&2
    exit 1
  fi
  sleep 1
done
[ "$code" = "000" ] && { echo ">>> Backend did not answer on :${API_PORT} within 60s." >&2; exit 1; }
echo ">>> Backend is ready."

# Playwright starts its own Vite on WEB_PORT (see playwright.config.ts), proxying /v1 to
# the E2E API. Run as a job so its group - Vite included - is killed even if it is cut off.
export E2E_WEB_PORT="$WEB_PORT"
export API_PROXY_TARGET="http://127.0.0.1:${API_PORT}"
npx playwright test "$@" &
TESTS_PID=$!
status=0
wait "$TESTS_PID" || status=$?
exit "$status"
