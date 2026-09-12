#!/bin/sh
#
# Entrypoint for Dockerfile.dev — the lightweight development container.
#
# The contract this exists to keep: a contributor needs Docker and nothing else.
# No Node on the host, no dbmate on the host, and since ADR-0004 no database
# service either. Everything below runs inside the one container.
#
# POSIX sh, not bash: the Alpine base ships busybox ash, and pulling in bash for
# one script would work against the point of a small image.
set -eu

echo "Running database migrations…"
dbmate -d ./packages/server/db/migrations -s ./packages/server/db/schema.sql up
echo "Migrations complete."

# Backend first: Vite proxies to it, and a frontend that loads before the API is
# answering shows errors that look like application bugs.
npm run dev:server &
SERVER_PID=$!

# Readiness is polled with Node rather than curl. The base image ships no curl, and
# adding it for one health check means an apt/apk layer in an image whose whole
# purpose is to stay small.
echo "Waiting for the backend…"
for _ in $(seq 1 60); do
  if node -e "fetch('http://localhost:${PORT:-3001}/v1/campaigns').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))" 2>/dev/null; then
    echo "Backend is ready."
    break
  fi
  # If the server died, say so here rather than timing out silently sixty seconds
  # later with no mention of the process that actually failed.
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "The backend exited before it became ready. Its output is above." >&2
    exit 1
  fi
  sleep 1
done

# Vite in the foreground keeps the container alive; --host publishes it beyond the
# container's loopback interface so the port mapping is reachable from Windows.
cd packages/client
exec npx vite --host 0.0.0.0
