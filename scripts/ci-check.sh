#!/usr/bin/env bash
set -euo pipefail

# Runs the same checks as .github/workflows/ci.yml (minus npm audit).
# Exit 0 = all pass, non-zero = failure.
# Usage: ./scripts/ci-check.sh

echo "=== Install (lockfile check) ==="
npm ci

echo "=== Type-check ==="
npm run build -w @mmf/shared && npx tsc -b --noEmit && npx tsc --noEmit -p packages/server/tsconfig.json

echo "=== Lint ==="
npm run lint

echo "=== Format check ==="
npm run format:check

echo "=== Markdown lint ==="
npm run lint:md

echo "=== Build ==="
npm run build

echo "=== Test coverage ==="
npm run test:coverage

echo "=== All CI checks passed ==="
