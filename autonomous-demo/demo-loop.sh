#!/usr/bin/env bash
set -euo pipefail

# ════════════════════════════════════════════════════════════════════════════
#  Pillar 02 — the AGENT LOOP, plus Pillars 03/04 (Guardrails / Observe).
#
#  One state transition per invocation. The outer loop in entrypoint.sh calls
#  this repeatedly. State is inferred from files on disk so the loop is
#  restart-safe.
#
#  State graph (each state -> next on success):
#    create-brief -> create-tasks -> execute-tasks -> verify -> done
#
#  Exit codes:  0 = done   1 = iterate again   2 = stuck (guardrail tripped)
# ════════════════════════════════════════════════════════════════════════════

REPO_DIR="/workspace/repo"
PROMPTS_DIR="/usr/local/share/prompts"
LOG_DIR="/workspace/logs"
SCREENSHOT_DIR="/screenshots"
PROMPT_FILE="/workspace/PROMPT.md"

BASE_BRANCH="${BASE_BRANCH:-origin/main}"
TIMEOUT="${TIMEOUT_SECONDS:-1800}"
MAX_TURNS="${MAX_TURNS:-40}"
MAX_REMEDIATION_ATTEMPTS="${MAX_REMEDIATION_ATTEMPTS:-3}"
MAX_ROLLBACKS="${MAX_ROLLBACKS:-3}"
ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-true}"

# Verify gate run after each task (Pillar 03). Kept lighter than the full
# ci-check so per-task iteration stays fast; the final verify state runs the
# complete ci-check.sh.
GATE_CMD="${GATE_CMD:-npm run build -w @mmf/shared && npx tsc -b --noEmit && npx tsc --noEmit -p packages/server/tsconfig.json}"

mkdir -p "$LOG_DIR" "$SCREENSHOT_DIR"
cd "$REPO_DIR"
mkdir -p plan/ready plan/planning

# Clear any stale .state lock from a crashed invocation (filesystem is authoritative).
rm -f plan/.state

# ── Helper: run Claude with standard flags + guardrails + retries ────────────
run_claude() {
  local turn_flag=()
  [ -n "$MAX_TURNS" ] && turn_flag=(--max-turns "$MAX_TURNS")  # Pillar 03: cost cap

  # Use the demo MCP config (Playwright with --output-dir /screenshots) so
  # screenshots land in the mounted /screenshots dir, not the repo working tree.
  # --strict-mcp-config ignores the repo's shared .mcp.json (no git pollution).
  local mcp_flag=()
  [ -f /workspace/mcp.json ] && mcp_flag=(--mcp-config /workspace/mcp.json --strict-mcp-config)

  local max_api_retries=3 attempt=0 backoff=60
  while [ "$attempt" -lt "$max_api_retries" ]; do
    timeout "$TIMEOUT" claude \
      --dangerously-skip-permissions \
      --print \
      --verbose \
      "${turn_flag[@]}" \
      "${mcp_flag[@]}" \
      "$@" \
      2>&1 | tee "$LOG_FILE" || true

    if grep -qiE 'API Error|ECONNREFUSED|ECONNRESET|ETIMEDOUT|503 Service|502 Bad Gateway|rate limit' "$LOG_FILE" 2>/dev/null; then
      attempt=$((attempt + 1))
      [ "$attempt" -ge "$max_api_retries" ] && { echo "!!! API error persists after ${max_api_retries} retries"; return 0; }
      echo ">>> Transient API error — retry ${attempt}/${max_api_retries} after ${backoff}s..."
      sleep "$backoff"; backoff=$((backoff * 2))
    else
      return 0
    fi
  done
}

safety_commit() {
  local msg="${1:-chore: save demo progress}"
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    git add -A
    git commit -m "$msg" || true
  fi
}

check_remediation_attempts() {
  local description="$1" attempts_file="plan/.fix-attempts" attempts
  attempts=$(cat "$attempts_file" 2>/dev/null || echo 0)
  if [ "$attempts" -ge "$MAX_REMEDIATION_ATTEMPTS" ]; then
    echo "!!! ${description} after ${MAX_REMEDIATION_ATTEMPTS} attempts — stuck"
    exit 2
  fi
  echo $((attempts + 1)) > "$attempts_file"
  echo ">>> ${description} — attempt $((attempts + 1))/${MAX_REMEDIATION_ATTEMPTS}"
}

set_state()   { mkdir -p plan; echo "$1" > plan/.state; }
clear_state() { rm -f plan/.state; }

# Guard against any state spinning without progress (Pillar 04: detect Loop of Death).
check_state_repeat() {
  local state="$1" count_file="plan/.state-repeat" last_file="plan/.last-state"
  local max_repeats last_state count
  case "$state" in
    execute-tasks) return ;;       # has its own stuck + rollback detection
    verify)        max_repeats=8 ;;
    *)             max_repeats=3 ;;
  esac
  last_state=$(cat "$last_file" 2>/dev/null || echo "")
  if [ "$state" = "$last_state" ]; then
    count=$(cat "$count_file" 2>/dev/null || echo 0); count=$((count + 1))
    echo "$count" > "$count_file"
    if [ "$count" -ge "$max_repeats" ]; then
      echo "!!! State '${state}' repeated ${count}x without progress — stuck"
      exit 2
    fi
  else
    echo "$state" > "$last_file"; echo 1 > "$count_file"
  fi
}

determine_state() {
  if [ -f "plan/.state" ];    then cat "plan/.state"; return; fi
  if [ -f "plan/.verified" ]; then echo "done";       return; fi
  if [ -f "plan/ready/tasks.md" ]; then
    if grep -q '^\- \[ \]' "plan/ready/tasks.md"; then echo "execute-tasks"; else echo "verify"; fi
    return
  fi
  if [ -f "plan/ready/brief.md" ]; then echo "create-tasks"; return; fi
  echo "create-brief"
}

write_summary() {
  {
    echo "# Demo Run Summary"
    echo
    echo "- Branch: \`$(git rev-parse --abbrev-ref HEAD)\`"
    echo "- Base:   \`${BASE_BRANCH}\`"
    echo "- Rollbacks: $(cat plan/.rollback-total 2>/dev/null || echo 0)"
    echo
    echo "## Commits"
    echo '```'
    git log --oneline "${BASE_BRANCH}..HEAD" 2>/dev/null || true
    echo '```'
    echo
    echo "## Files changed"
    echo '```'
    git diff --stat "${BASE_BRANCH}...HEAD" 2>/dev/null || true
    echo '```'
    echo
    echo "## Screenshots captured"
    echo '```'
    ls -1 "$SCREENSHOT_DIR" 2>/dev/null || echo "(none)"
    echo '```'
  } > "$LOG_DIR/SUMMARY.md"
  git diff "${BASE_BRANCH}...HEAD" > "$LOG_DIR/changes.diff" 2>/dev/null || true
  cp -f plan/ready/tasks.md "$LOG_DIR/tasks.md" 2>/dev/null || true
}

# ── Main ─────────────────────────────────────────────────────────────────────
STATE=$(determine_state)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="${LOG_DIR}/demo-${STATE}-${TIMESTAMP}.log"
echo ">>> State: ${STATE}"
echo ">>> Log:   ${LOG_FILE}"

check_state_repeat "$STATE"

FEATURE_REQUEST=$(cat "$PROMPT_FILE")

case "$STATE" in

  # ── analyse: turn the feature request into a brief ─────────────────────────
  create-brief)
    set_state create-brief
    run_claude -p "$(cat "${PROMPTS_DIR}/create-brief.md")

## Feature Request (from PROMPT.md)

${FEATURE_REQUEST}"

    if [ ! -f "plan/ready/brief.md" ] && [ -f "plan/planning/brief.md" ]; then
      cp plan/planning/brief.md plan/ready/brief.md
      echo ">>> Promoted planning brief to ready"
    fi
    if [ -f "plan/ready/brief.md" ]; then
      echo ">>> Brief ready"; clear_state; exit 1
    fi
    echo "!!! No brief produced"; clear_state; exit 2
    ;;

  # ── plan: decompose the brief into tasks.md ────────────────────────────────
  create-tasks)
    set_state create-tasks
    run_claude -p "$(cat "${PROMPTS_DIR}/create-tasks.md")"

    if [ -f "plan/ready/tasks.md" ]; then
      echo ">>> tasks.md created"
      safety_commit "chore: add demo plan (brief + tasks)"
      clear_state; exit 1
    fi
    echo "!!! No tasks produced"; clear_state; exit 2
    ;;

  # ── change + test: execute ONE task, then verify-gate with rollback ────────
  execute-tasks)
    set_state execute-tasks
    PRE_SHA=$(git rev-parse HEAD)

    BEFORE=$(grep -c '^\- \[ \]' "plan/ready/tasks.md" || true); BEFORE=${BEFORE:-0}
    run_claude --output-format stream-json -p "$(cat "${PROMPTS_DIR}/execute-tasks.md")"
    AFTER=$(grep -c '^\- \[ \]' "plan/ready/tasks.md" || true); AFTER=${AFTER:-0}
    echo ">>> Tasks remaining: ${BEFORE} -> ${AFTER}"

    safety_commit "chore: progress on demo tasks"

    # ── Pillar 03: rollback on test/build failure ──────────────────────────
    if [ "$ROLLBACK_ON_FAILURE" = "true" ] && [ "$AFTER" -lt "$BEFORE" ]; then
      echo ">>> Verify gate: ${GATE_CMD}"
      set +e
      bash -c "$GATE_CMD" > "${LOG_DIR}/gate-${TIMESTAMP}.log" 2>&1
      GATE_RC=$?
      set -e
      if [ "$GATE_RC" -ne 0 ]; then
        ROLL=$(cat plan/.rollback-count 2>/dev/null || echo 0)
        TOTAL=$(cat plan/.rollback-total 2>/dev/null || echo 0)
        echo $((TOTAL + 1)) > plan/.rollback-total
        if [ "$ROLL" -ge "$MAX_ROLLBACKS" ]; then
          echo "!!! Verify gate failed ${ROLL}x for this task — stuck (Loop of Death averted)"
          rm -f plan/.rollback-count
          clear_state; exit 2
        fi
        echo $((ROLL + 1)) > plan/.rollback-count
        echo "!!! Verify gate FAILED — rolling back to ${PRE_SHA} (attempt $((ROLL + 1))/${MAX_ROLLBACKS})"
        git reset --hard "$PRE_SHA"
        clear_state; exit 1
      fi
      echo ">>> Verify gate passed"
      rm -f plan/.rollback-count
    fi

    if [ "$AFTER" -eq 0 ]; then echo ">>> All tasks complete"; clear_state; exit 1; fi

    # Stuck detection — no checkmark progress at all
    if [ "$BEFORE" -eq "$AFTER" ]; then
      STUCK_FILE="plan/.stuck-count"; STUCK=$(cat "$STUCK_FILE" 2>/dev/null || echo 0)
      if [ "$STUCK" -ge 3 ]; then
        echo "!!! No task progress after 3 retries — stuck"; rm -f "$STUCK_FILE"; clear_state; exit 2
      fi
      echo $((STUCK + 1)) > "$STUCK_FILE"
      echo "!!! No progress — retry $((STUCK + 1))/3"; clear_state; exit 1
    fi

    rm -f plan/.stuck-count
    clear_state; exit 1
    ;;

  # ── verify: full ci-check, screenshots, summary ────────────────────────────
  verify)
    set_state verify
    safety_commit "chore: save progress before verify"

    echo ">>> Running full ci-check.sh"
    set +e
    ./scripts/ci-check.sh 2>&1 | tee "${LOG_DIR}/ci-check-${TIMESTAMP}.log"
    CI_RC=${PIPESTATUS[0]}
    set -e

    if [ "$CI_RC" -ne 0 ]; then
      check_remediation_attempts "CI remediation"
      CI_LOG=$(tail -200 "${LOG_DIR}/ci-check-${TIMESTAMP}.log")
      run_claude -p "$(cat "${PROMPTS_DIR}/remediate.md")

## CI failure output (tail)

\`\`\`
${CI_LOG}
\`\`\`"
      safety_commit "fix: ci remediation"
      clear_state; exit 1
    fi

    echo ">>> CI passing"
    rm -f plan/.fix-attempts

    # Capture screenshots + confirm the feature works (once).
    if [ ! -f "plan/.verified-once" ]; then
      run_claude -p "$(cat "${PROMPTS_DIR}/verify.md")

## Feature Request (from PROMPT.md)

${FEATURE_REQUEST}"
      safety_commit "docs: demo verification"
      touch plan/.verified-once
      clear_state; exit 1   # loop once more to re-confirm CI after any commits
    fi

    write_summary
    touch plan/.verified
    clear_state
    echo ">>> Verified ✔  Branch ready: $(git rev-parse --abbrev-ref HEAD)"
    exit 0
    ;;

  done)
    echo ">>> Already complete"; exit 0 ;;

esac
