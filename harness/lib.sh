# Shared by run-task.sh and pipeline.sh; source it, do not run it.
# harness_setup, then one or more harness_agent calls, then harness_finish.

harness_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# Create the run folder and worktree, install, and take the "before" screenshot.
harness_setup() { # harness_setup <task-file>
  task_file=$(realpath "${1:?usage: <script> <task-file>}")
  repo=$(git -C "$harness_dir" rev-parse --show-toplevel)
  id=$(date +%Y%m%d-%H%M%S)
  run=/workspace/runs/$id # the record: the agent never works here
  work=$run/repo          # the agent's checkout
  branch=harness/$id

  # Scripts in a worktree's npm install would write a git hook, and .git is a file there.
  export npm_config_ignore_scripts=true

  mkdir -p "$run"
  # A worktree leaves the checkout we were started from untouched.
  git -C "$repo" worktree add -q -b "$branch" "$work" HEAD || return 1
  log=$run/run.log
  : >"$log"

  if ! (cd "$work" && npm ci) >>"$log" 2>&1; then
    echo "npm ci failed in $work; see $log" >&2
    return 1
  fi

  # Screenshots for the human reviewer. Any failure here is reported and never fails the run.
  web_port=${HARNESS_WEB_PORT:-5373}
  web_pid=
  shots_ok=
  before_ok=
  proposal_url=
  trap stop_web EXIT # whatever happens, the site does not outlive the run

  local proposal_id
  proposal_id=$(curl -sf http://localhost:3001/v1/proposals | jq -r '.data[0].id // empty')
  if [ -z "$proposal_id" ]; then
    echo "screenshots skipped: no proposal from GET /v1/proposals"
  else
    proposal_url=http://localhost:$web_port/proposals/$proposal_id
    (cd "$work" && API_PROXY_TARGET=http://localhost:3001 \
      exec npm run dev -w @mmf/client -- --port "$web_port" --strictPort) >"$run/web.log" 2>&1 &
    web_pid=$!
    for _ in $(seq 60); do
      curl -sf -o /dev/null "http://localhost:$web_port/" && { shots_ok=1; break; }
      kill -0 "$web_pid" 2>/dev/null || break
      sleep 1
    done
    if [ -z "$shots_ok" ]; then
      echo "screenshots skipped: site did not start on port $web_port; see $run/web.log"
      stop_web
    else
      shoot before && before_ok=1
    fi
  fi

  cd "$work" || return 1
}

shoot() { # shoot <name>: screenshot the proposal page into the run folder
  (cd "$work" && node "$repo/harness/screenshot.mjs" "$proposal_url" "$run/$1.png") >>"$log" 2>&1 ||
    { echo "screenshot $1.png failed; see $log"; return 1; }
}

stop_web() {
  [ -n "$web_pid" ] && kill "$web_pid" 2>/dev/null
  web_pid=
}

# Run claude headlessly in the worktree. Sets agent_status to claude's (timeout's) status.
# stderr goes to the terminal and run.log so claude's own errors are not lost.
# stdout (the event stream) is kept whole in <events-file>, outside the worktree.
harness_agent() { # harness_agent <prompt> <events-file> <permissions-args...>
  local prompt=$1 events=$2
  shift 2
  timeout "${TIMEOUT_SECONDS:-900}" claude -p "$prompt" \
    --output-format stream-json --verbose \
    --max-turns "${MAX_TURNS:-25}" \
    --model "${HARNESS_MODEL:-sonnet}" \
    "$@" \
    </dev/null 2> >(tee -a "$log" >&2) |
    tee "$events" |
    # One line per tool call: its name and the command or path it works on.
    jq -R --unbuffered -r 'fromjson? | select(.type == "assistant") | .message.content[]?
      | select(.type == "tool_use")
      | "-> \(.name) \(.input.command // .input.file_path // .input.pattern // .input.path // "")"' |
    tee -a "$log"
  agent_status=${PIPESTATUS[0]}
}

# The agent's closing message, from the final result event of an events file.
# -R/fromjson? so a half-written last line after a timeout cannot stop it.
harness_result() { # harness_result <events-file>
  jq -R -r 'fromjson? | select(.type == "result") | .result // empty' "$1"
}

# Format, commit, "after" screenshot, report and gate. Returns the run's exit status.
harness_finish() {
  local base committed= after_ok= n gate
  base=$(git rev-parse HEAD)

  # Format what the agent changed, as a pre-commit hook would: the agent may check formatting
  # but is not allowed to rewrite it, and a style nit should not fail the gate.
  # Deleted files are left out, --ignore-unknown skips files Prettier does not handle, and a
  # file it cannot parse is only logged.
  git add -A
  echo "=== prettier --write on changed files ===" >>"$log"
  git diff --cached --name-only --diff-filter=d -z |
    xargs -0 -r npx prettier --write --ignore-unknown >>"$log" 2>&1 ||
    echo "prettier could not format every changed file; see $log"
  git add -A

  # Explicit identity: the container may have none configured.
  git -c user.name="Harness" -c user.email="harness@localhost" \
    commit -q -m "Harness run $id: $(head -n 1 "$task_file" | cut -c1-60)" || echo "Nothing to commit"

  [ "$(git rev-parse HEAD)" != "$base" ] && committed=1

  # The same page again, with the agent's work in place.
  if [ -n "$shots_ok" ]; then
    shoot after && after_ok=1
  fi
  stop_web

  echo "run:    $id"
  echo "branch: $branch"
  # The final result event is the source of truth for model, turns and cost.
  jq -r 'select(.type == "result")
    | "model:  \(.modelUsage // {} | keys | join(", "))\nturns:  \(.num_turns)"
      + (if .total_cost_usd then "\ncost:   $\(.total_cost_usd)" else "" end)' "$run/events.jsonl"

  # The agent's own closing message - its answer to the task - kept with the record.
  echo "--- result (also in $run/result.md)"
  harness_result "$run/events.jsonl" | tee "$run/result.md"

  # The gate: the project's own CI checks, run on the committed work in the worktree.
  # An empty run has not done the task, and untouched code would pass, so it fails.
  echo "--- gate"
  if [ -z "$committed" ]; then
    echo "nothing was committed" >>"$log"
    gate=1
  else
    echo "=== gate: scripts/ci-check.sh ===" >>"$log"
    (cd "$work" && ./scripts/ci-check.sh) >>"$log" 2>&1
    gate=$?
  fi
  if [ "$gate" -eq 0 ]; then echo "GATE PASSED"; else echo "GATE FAILED"; fi

  # Copy under the run id so runs never overwrite each other; /screenshots opens on the host.
  if [ -n "$before_ok" ] || [ -n "$after_ok" ]; then
    mkdir -p /screenshots
    for n in before after; do
      declare -n ok=${n}_ok
      [ -z "$ok" ] && continue
      cp "$run/$n.png" "/screenshots/$id-$n.png" && echo "/screenshots/$id-$n.png" ||
        echo "copy of $n.png to /screenshots failed"
    done
  fi

  # The agent's own failure comes first; otherwise the gate decides.
  if [ "$agent_status" -ne 0 ]; then return "$agent_status"; fi
  return "$gate"
}

# Permission args for the coding stage. HARNESS_YOLO=1 restores the old, unrestricted behaviour.
# --setting-sources local keeps the project's .claude/settings.json (curl, git push) out.
# A refused call only says "denied", so the agent is told the rules up front.
code_perm_args() {
  if [ "${HARNESS_YOLO:-}" = 1 ]; then
    echo "permissions: OFF (HARNESS_YOLO=1)" >&2
    perm_args=(--dangerously-skip-permissions)
  else
    echo "permissions: harness/settings.json" >&2
    perm_args=(
      --settings "$repo/harness/settings.json"
      --setting-sources local
      --permission-mode dontAsk
      --append-system-prompt "You run under a permissions allowlist. Bash is on, but only for allowed commands: look-around tools (cd, pwd, ls, cat, head, tail, wc, grep, find, sort, uniq, sed, cut, tr, comm, diff) and the test, lint, type-check and build commands (npm test, npm run test/lint/build, npx vitest/tsc/eslint, npx prettier --check). Make each Bash call one simple command, run from the worktree root; do not chain commands or use absolute or .. paths. If a command is refused, that command is not allowed; Bash itself is not off, so try another way (the Read, Grep, Glob and Edit tools also work). There is no network, git push, sudo or environment printing, and nothing outside the worktree. find -exec/-delete and sed -i are refused; use the Edit tool to change files."
    )
  fi
}
