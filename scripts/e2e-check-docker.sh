#!/usr/bin/env bash
set -euo pipefail

# Run all CI checks + E2E tests entirely inside Docker.
# Only requirement: Docker (with Compose v2).

COMPOSE_FILE="docker-compose.e2e.yml"
cd "$(dirname "$0")/.."

cleanup() {
  echo ""
  echo "Tearing down…"
  docker compose -f "$COMPOSE_FILE" down -v
  echo "Done."
}
trap cleanup EXIT

docker compose -f "$COMPOSE_FILE" up --build --abort-on-container-exit --exit-code-from e2e
