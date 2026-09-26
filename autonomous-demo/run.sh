#!/usr/bin/env bash
set -euo pipefail

# Launch the autonomous demo, auto-selecting a free host port for the web UI.
#
# Port binding happens host-side at `docker compose up` time, so if WEB_PORT is
# already taken the run fails. This finds the first free port starting at
# WEB_PORT (default 8080) and passes it through to compose.
#
# Usage:
#   ./run.sh                 # build + run, pick a free web port from 8080 up
#   ./run.sh -d              # ... detached (extra args are forwarded to compose)
#   WEB_PORT=9000 ./run.sh   # start searching from 9000 instead

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

START_PORT="${WEB_PORT:-8080}"
MAX_TRIES=50

# True (exit 0) if something is already listening on the given TCP port.
port_in_use() {
  local p="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1
  elif command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$p" >/dev/null 2>&1
  else
    return 1 # can't check — assume free
  fi
}

PORT="$START_PORT"
tries=0
while port_in_use "$PORT"; do
  echo ">>> Port ${PORT} is in use — trying $((PORT + 1))"
  PORT=$((PORT + 1))
  tries=$((tries + 1))
  if [ "$tries" -ge "$MAX_TRIES" ]; then
    echo "!!! No free port found in ${START_PORT}..$((START_PORT + MAX_TRIES - 1))"
    exit 1
  fi
done

echo ">>> Web UI will be served on http://localhost:${PORT}"
export WEB_PORT="$PORT"

exec docker compose up --build "$@"
