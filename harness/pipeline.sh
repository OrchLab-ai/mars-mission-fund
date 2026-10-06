#!/usr/bin/env bash
# Two stages in one run folder and one worktree: a read-only planner, then the coder.
# Usage: harness/pipeline.sh <task-file>
set -uo pipefail # no -e: we must commit and report even when the agent fails

# shellcheck source=harness/lib.sh
source "$(dirname "$0")/lib.sh"

harness_setup "$1" || exit 1 # worktree, install, "before" screenshot

# Stage 1: plan. Read, search and look-around Bash only; it cannot edit, so nothing is
# committed or gated for it. The harness, not the agent, saves its output as plan.md.
echo "=== stage 1: plan (harness/settings.plan.json)"
harness_agent "You are the planning stage. Do not change anything. Read the task and every spec it names. Output a plan as markdown: a short brief, then numbered tasks, each with the files it touches and the tests that must pass.

$(cat "$task_file")" "$run/plan-events.jsonl" \
  --settings "$repo/harness/settings.plan.json" \
  --setting-sources local \
  --permission-mode dontAsk \
  --append-system-prompt "You are the read-only planning stage. You cannot edit or write files, and Bash is limited to look-around commands (cd, pwd, ls, cat, head, tail, wc, grep, find, sort, uniq, sed, cut, tr, comm, diff); there is no network, no test or build commands, and nothing outside the worktree. Make each Bash call one simple command run from the worktree root. If a command is refused, it is not allowed; use the Read, Grep and Glob tools instead. Your final message is the plan."
plan_status=$agent_status
harness_result "$run/plan-events.jsonl" >"$run/plan.md"
if [ "$plan_status" -ne 0 ] || [ ! -s "$run/plan.md" ]; then
  echo "plan stage failed (status $plan_status); see $run/plan-events.jsonl" >&2
  exit "$([ "$plan_status" -ne 0 ] && echo "$plan_status" || echo 1)"
fi
echo "plan:   $run/plan.md"

# An agent that cannot go on says so on a line starting BLOCKED:. Print why and stop.
blocked() { # blocked <stage> <file>: if the file has a BLOCKED: line, report it and return 0
  local reason
  reason=$(grep -h '^BLOCKED:' "$2") || return 1
  echo "$1 stage BLOCKED, stopping; nothing committed or gated" >&2
  echo "$reason" >&2
  return 0
}
if blocked plan "$run/plan.md"; then exit 2; fi

# Stage 2: code, in the same worktree, with the plan as its whole prompt.
echo "=== stage 2: code"
code_perm_args
harness_agent "Execute this plan exactly. If a step is wrong, stop and say so rather than improvising.

$(cat "$run/plan.md")" "$run/events.jsonl" "${perm_args[@]}"
harness_result "$run/events.jsonl" >"$run/result.md"
if blocked code "$run/result.md"; then
  echo "code:   $run/result.md (events: $run/events.jsonl), worktree: $work" >&2
  exit 2
fi

harness_finish # prettier, commit, "after" screenshot, gate
status=$?
echo "--- outputs"
echo "plan:   $run/plan.md (events: $run/plan-events.jsonl)"
echo "code:   $run/result.md (events: $run/events.jsonl)"
echo "log:    $log"
exit "$status"
