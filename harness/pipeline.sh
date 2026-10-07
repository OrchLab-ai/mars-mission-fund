#!/usr/bin/env bash
# Run one task as two stages in one run: a read-only planner, then a coder that executes the plan.
# Usage: harness/pipeline.sh <task-file>
set -uo pipefail # no -e: we must commit and report even when the agent fails

# shellcheck source=harness/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

harness_init "${1:-}"
harness_before_shot # before stage 1: the untouched code

# --- Stage 1: plan. Read-only; the harness, not the agent, saves what it says. ---------------
echo "=== stage 1: plan (harness/settings.plan.json)"
harness_agent "You are the planning stage. Do not change anything. Read the task and every spec it names. Output a plan as markdown: a short brief, then numbered tasks, each with the files it touches and the tests that must pass.

$(cat "$task_file")" "$repo/harness/settings.plan.json" \
  "You are read-only. You may use Read, Glob and Grep, and Bash only for look-around commands (cd, pwd, ls, cat, head, tail, wc, grep, find, sort, uniq, sed, cut, tr, comm, diff). Make each Bash call one simple command, run from the worktree root; do not chain commands or use absolute or .. paths. You cannot edit or write any file, run tests, or use the network; do not try. Your final message is the plan." \
  0
plan_status=$agent_status

# blocked <stage> <text>: if a line of the text starts with BLOCKED:, say which stage stopped and
# why, and end the run: nothing is committed or gated. A line that only mentions it does not count.
blocked() {
  local line
  line=$(printf '%s\n' "$2" | grep -m1 '^BLOCKED:') || return 0
  echo "BLOCKED in $1: ${line#BLOCKED:}" >&2
  echo "nothing committed, no gate. Output: $run/events.jsonl, $run/run.log" >&2
  exit 3
}

# The final message of stage 1 is the plan; a failed or empty stage 1 stops the run.
plan=$(jq -R -r 'fromjson? | select(.type == "result" and (.is_error | not)) | .result // empty' \
  "$run/events.jsonl")
if [ "$plan_status" -ne 0 ] || [ -z "$plan" ]; then
  echo "stage 1 produced no plan (status $plan_status); stage 2 not run. See $log and $run/events.jsonl" >&2
  exit "$(( plan_status != 0 ? plan_status : 1 ))"
fi
printf '%s\n' "$plan" >"$run/plan.md"
blocked "stage 1 (plan)" "$plan"
echo "plan:   $run/plan.md"
events_skip=$(wc -l <"$run/events.jsonl") # result.md is stage 2's message, not the plan

# --- Stage 2: code. The plan is the whole prompt. --------------------------------------------
echo "=== stage 2: code (harness/settings.json)"
harness_agent "Execute this plan exactly. If a step is wrong, stop and say so rather than improvising.

$plan" "$repo/harness/settings.json" "$code_system_prompt" 1

stage2_result=$(tail -n +"$((events_skip + 1))" "$run/events.jsonl" |
  jq -R -r 'fromjson? | select(.type == "result") | .result // empty')
blocked "stage 2 (code)" "$stage2_result"

echo "output: stage 1 plan   $run/plan.md"
echo "        stage 2 result $run/result.md"
echo "        both stages    $run/events.jsonl, $run/run.log"

harness_finish "$agent_status"
