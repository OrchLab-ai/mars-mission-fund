#!/bin/bash
set -euo pipefail

# Run database migrations
echo "Running database migrations…"
dbmate -d ./packages/server/db/migrations -s ./packages/server/db/schema.sql up
echo "Migrations complete."

# Start the backend dev server in the background
npm run dev:server &

# Wait for backend to accept connections
echo "Waiting for backend…"
until curl -sf http://localhost:3001/v1/proposals > /dev/null 2>&1; do
  sleep 1
done
echo "Backend is ready."

# Start the frontend dev server (foreground, keeps container alive)
# --host exposes Vite outside the container
cd packages/client
npx vite --host 0.0.0.0
