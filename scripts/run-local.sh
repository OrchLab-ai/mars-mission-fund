#!/usr/bin/env bash
set -euo pipefail

# Start the full local development environment.
# Prerequisites: Node.js 22.x, Docker

# --- Cleanup on exit (Ctrl+C or any termination) ---
cleanup() {
  echo ""
  echo "Shutting down…"
  # Kill background jobs (server, vite) started by this script
  kill $(jobs -p) 2>/dev/null || true
  wait 2>/dev/null || true
  docker compose -f docker-compose.dev.yml down
  echo "Done."
}
trap cleanup EXIT

# Install dependencies
npm ci

# Start local infrastructure (PostgreSQL)
docker compose -f docker-compose.dev.yml up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until docker compose -f docker-compose.dev.yml exec -T db pg_isready -U mmf > /dev/null 2>&1; do
  sleep 1
done
echo "PostgreSQL is ready."

# Database connection used by both dbmate and the server
export DATABASE_URL="postgresql://mmf:mmf@localhost:5432/mmf?sslmode=disable"

# Run database migrations
docker run --rm --network host \
  -e DATABASE_URL="${DATABASE_URL}" \
  -v "$(pwd)/packages/server/db:/db" \
  ghcr.io/amacneil/dbmate up

# JWT secret for local development
export JWT_SECRET="local-dev-jwt-secret"

# Start both dev servers in the background
npm run dev:server &
npm run dev &

# Wait for any background job to exit (Ctrl+C triggers the EXIT trap)
wait
