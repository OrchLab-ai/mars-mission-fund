#!/usr/bin/env bash
# Run one task headlessly with Claude Code in a throwaway git worktree.
# Usage: harness/run-task.sh <task-file>
set -uo pipefail # no -e: we must commit and report even when the agent fails

task_file=$(realpath "${1:?usage: run-task.sh <task-file>}")
repo=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
id=$(date +%Y%m%d-%H%M%S)
run=/workspace/runs/$id # the record: the agent never works here
work=$run/repo          # the agent's checkout
branch=harness/$id

# Scripts in a worktree's npm install would write a git hook, and .git is a file there.
export npm_config_ignore_scripts=true

mkdir -p "$run"
# A worktree leaves the checkout we were started from untouched.
git -C "$repo" worktree add -q -b "$branch" "$work" HEAD || exit 1
log=$run/run.log
: >"$log"

if ! (cd "$work" && npm ci) >>"$log" 2>&1; then
  echo "npm ci failed in $work; see $log" >&2
  exit 1
fi

# stderr goes to the terminal and run.log so claude's own errors are not lost.
# stdout (the event stream) is kept whole in events.jsonl, outside the worktree.
cd "$work"

# The permissions in force. HARNESS_YOLO=1 restores the old, unrestricted behaviour.
# --setting-sources local keeps the project's .claude/settings.json (curl, git push) out.
# A refused call only says "denied", so the agent is told the rules up front.
if [ "${HARNESS_YOLO:-}" = 1 ]; then
  echo "permissions: OFF (HARNESS_YOLO=1)"
  perm_args=(--dangerously-skip-permissions)
else
  echo "permissions: harness/settings.json"
  perm_args=(
    --settings "$repo/harness/settings.json"
    --setting-sources local
    --permission-mode dontAsk
    --append-system-prompt "You run under a permissions allowlist. Bash is on, but only for allowed commands: look-around tools (cd, pwd, ls, cat, head, tail, wc, grep, find, sort, uniq, sed, cut, tr, comm, diff) and the test, lint, type-check and build commands (npm test, npm run test/lint/build, npx vitest/tsc/eslint, npx prettier --check). Make each Bash call one simple command, run from the worktree root; do not chain commands or use absolute or .. paths. If a command is refused, that command is not allowed; Bash itself is not off, so try another way (the Read, Grep, Glob and Edit tools also work). There is no network, git push, sudo or environment printing, and nothing outside the worktree. find -exec/-delete and sed -i are refused; use the Edit tool to change files."
  )
fi

timeout "${TIMEOUT_SECONDS:-900}" claude -p "$(cat "$task_file")" \
  --output-format stream-json --verbose \
  --max-turns "${MAX_TURNS:-25}" \
  --model "${HARNESS_MODEL:-sonnet}" \
  "${perm_args[@]}" \
  </dev/null 2> >(tee -a "$log" >&2) |
  tee "$run/events.jsonl" |
  # One line per tool call: its name and the command or path it works on.
  jq -R --unbuffered -r 'fromjson? | select(.type == "assistant") | .message.content[]?
    | select(.type == "tool_use")
    | "-> \(.name) \(.input.command // .input.file_path // .input.pattern // .input.path // "")"' |
  tee -a "$log"
status=${PIPESTATUS[0]} # claude's (timeout's) status, not tee's or jq's

# Explicit identity: the container may have none configured.
git add -A
git -c user.name="Harness" -c user.email="harness@localhost" \
  commit -q -m "Harness run $id: $(head -n 1 "$task_file" | cut -c1-60)" || echo "Nothing to commit"

echo "run:    $id"
echo "branch: $branch"
# The final result event is the source of truth for model, turns and cost.
jq -r 'select(.type == "result")
  | "model:  \(.modelUsage // {} | keys | join(", "))\nturns:  \(.num_turns)"
    + (if .total_cost_usd then "\ncost:   $\(.total_cost_usd)" else "" end)' "$run/events.jsonl"

# The agent's own closing message - its answer to the task - kept with the record.
# -R/fromjson? so a half-written last line after a timeout cannot stop it.
echo "--- result (also in $run/result.md)"
jq -R -r 'fromjson? | select(.type == "result") | .result // empty' "$run/events.jsonl" |
  tee "$run/result.md"
exit "$status"
