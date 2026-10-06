#!/bin/bash
set -euo pipefail

# --- CI checks (no DB required) ---

echo "=== Type-check ==="
npx tsc -b --noEmit
npx tsc --noEmit -p packages/server/tsconfig.json

echo "=== Lint ==="
npm run lint

echo "=== Format check ==="
npm run format:check

echo "=== Markdown lint ==="
npm run lint:md

echo "=== Build ==="
npm run build

echo "=== Unit tests ==="
npm run test:coverage

echo "=== All CI checks passed ==="

# --- E2E tests (DB required) ---

echo "=== E2E tests ==="
./scripts/run-e2e.sh

echo "=== All checks passed ==="
