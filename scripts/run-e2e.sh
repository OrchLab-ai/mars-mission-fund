#!/usr/bin/env bash
set -euo pipefail

# Run E2E tests against their OWN database, created for the run and dropped after it.
# Requires: DATABASE_URL, JWT_SECRET in environment; dbmate installed.
# Usage: ./scripts/run-e2e.sh [playwright-args...]
#
# A separate database because DATABASE_URL is usually shared: in the workshop the
# autonomous agent and the attendee's running app point at the same Postgres, and the
# old teardown ("dbmate down" until nothing was left) dropped every table under the
# live app. The E2E database is DATABASE_URL with "_e2e" appended to its name, unless
# E2E_DATABASE_URL says otherwise, so the app's own data is never touched.

base="${DATABASE_URL%%\?*}"
query=""
[ "$base" != "$DATABASE_URL" ] && query="?${DATABASE_URL#*\?}"
export DATABASE_URL="${E2E_DATABASE_URL:-${base}_e2e${query}}"
# The name only - the URL carries the password.
e2e_name="${DATABASE_URL##*/}"
echo ">>> E2E database: ${e2e_name%%\?*}"

API_PORT="${PORT:-3001}"
SERVER_PID=""

cleanup() {
  echo ">>> Stopping backend..."
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
  echo ">>> Dropping the E2E database..."
  dbmate drop >/dev/null 2>&1 || echo ">>> WARNING: could not drop the E2E database."
  echo ">>> E2E teardown complete."
}
trap cleanup EXIT

echo ">>> Creating and migrating the E2E database..."
# A leftover from an interrupted run is dropped first, so every run starts clean.
dbmate drop >/dev/null 2>&1 || true
dbmate create
dbmate --no-dump-schema -d packages/server/db/migrations up

# Start server directly (not via npm) so kill sends SIGTERM to the node
# process, triggering graceful shutdown and DB pool cleanup.
npx tsx packages/server/src/index.ts &
SERVER_PID=$!

# "Is anything answering", not "does this route work": a route name here would break
# the day a route is renamed. curl writes 000 when the connection is refused.
echo ">>> Waiting for backend..."
for _ in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${API_PORT}/" 2>/dev/null || true)
  [ "$code" != "000" ] && break
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo ">>> Backend exited before it answered." >&2
    exit 1
  fi
  sleep 1
done
[ "$code" = "000" ] && { echo ">>> Backend did not answer on :${API_PORT} within 60s." >&2; exit 1; }
echo ">>> Backend is ready."

npx playwright test "$@"
