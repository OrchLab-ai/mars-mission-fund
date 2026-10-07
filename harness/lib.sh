#!/usr/bin/env bash
# Shared parts of run-task.sh and pipeline.sh. Source it; it is not run on its own.
#
#   harness_init <task-file>   one run id, folder and worktree, npm ci, the traps
#   harness_before_shot        the run's own app, before screenshot, servers stopped again
#   harness_agent ...          one claude -p call, logged to run.log and events.jsonl
#   harness_finish <status>    Prettier, commit, summary, after screenshot, gate, exit

# Scripts in a worktree's npm install would write a git hook, and .git is a file there.
export npm_config_ignore_scripts=true

# What the coding agent is told about its permissions (harness/settings.json), up front.
code_system_prompt="You run under a permissions allowlist. Bash is on, but only for allowed commands: look-around tools (cd, pwd, ls, cat, head, tail, wc, grep, find, sort, uniq, sed, cut, tr, comm, diff) and the test, lint, type-check and build commands (npm test, npm run test/lint/build, npx vitest/tsc/eslint, npx prettier --check). Make each Bash call one simple command, run from the worktree root; do not chain commands or use absolute or .. paths. If a command is refused, that command is not allowed; Bash itself is not off, so try another way (the Read, Grep, Glob and Edit tools also work). There is no network, git push, sudo or environment printing, and nothing outside the worktree. find -exec/-delete and sed -i are refused; use the Edit tool to change files."

harness_init() {
  task_file=$(realpath "${1:?usage: $(basename "$0") <task-file>}")
  repo=$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)
  id=$(date +%Y%m%d-%H%M%S)
  run=/workspace/runs/$id # the record: the agent never works here
  work=$run/repo          # the agent's checkout
  branch=harness/$id

  api_port=${HARNESS_API_PORT:-3373}
  web_port=${HARNESS_WEB_PORT:-5373}
  page_path=/proposals/00000000-0001-0000-0000-000000000001 # a seeded proposal

  mkdir -p "$run"
  # A worktree leaves the checkout we were started from untouched.
  git -C "$repo" worktree add -q -b "$branch" "$work" HEAD || exit 1
  base=$(git -C "$work" rev-parse HEAD) # an empty run is one that ends here
  log=$run/run.log
  : >"$log"

  # The run's own copy of the app, for the screenshots. Its database goes only to dbmate and
  # the run's API, as an inline variable on each command: it is never exported, so the agent
  # and the gate never see it.
  run_db_url=""
  run_db_name=""
  db_created=0
  api_pid=""
  web_pid=""
  preview=1
  shots=()
  events_skip=0 # events.jsonl lines before the stage whose final message is result.md

  trap harness_cleanup EXIT
  trap 'exit 130' INT TERM

  # Screenshots never fail the run: any trouble below only turns them off.
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "screenshots skipped: DATABASE_URL is not set" >&2
    preview=0
  elif port_taken "$api_port" || port_taken "$web_port"; then
    echo "screenshots skipped: port $api_port or $web_port already answers (another server, not photographed)" >&2
    preview=0
  fi

  if ! (cd "$work" && npm ci) >>"$log" 2>&1; then
    echo "npm ci failed in $work; see $log" >&2
    exit 1
  fi
}

# Something answering on the port means it is taken. bash's /dev/tcp needs no extra tools.
port_taken() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }

# Kill a whole process group: killing npm alone leaves Vite on the port.
stop_group() {
  [ -n "$1" ] || return 0
  kill -- "-$1" 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    kill -0 -- "-$1" 2>/dev/null || break
    sleep 0.5
  done
  kill -KILL -- "-$1" 2>/dev/null || true
  wait "$1" 2>/dev/null || true
}

stop_servers() {
  stop_group "$web_pid"
  stop_group "$api_pid"
  web_pid=""
  api_pid=""
}

harness_cleanup() {
  trap - INT TERM
  stop_servers
  if [ "$db_created" = 1 ]; then
    (cd "$work" && DATABASE_URL="$run_db_url" dbmate --no-dump-schema drop) >>"$log" 2>&1 ||
      echo "WARNING: could not drop database $run_db_name" >&2
  fi
}

# Migrate the run's database from the worktree's migrations (the agent may add some).
migrate_run_db() {
  (cd "$work" && DATABASE_URL="$run_db_url" dbmate --no-dump-schema \
    -d packages/server/db/migrations up) >>"$log" 2>&1
}

# Start the worktree's API and client, each in its own session (setsid), and wait for both.
start_servers() {
  (
    cd "$work" || exit 1
    DATABASE_URL="$run_db_url" PORT="$api_port" \
      setsid npx tsx packages/server/src/index.ts >>"$run/api.log" 2>&1 </dev/null &
    echo $! >"$run/.api.pid"
  )
  api_pid=$(<"$run/.api.pid")
  (
    cd "$work/packages/client" || exit 1
    API_PROXY_TARGET="http://127.0.0.1:$api_port" \
      setsid npx vite --host 127.0.0.1 --port "$web_port" --strictPort \
      >>"$run/web.log" 2>&1 </dev/null &
    echo $! >"$run/.web.pid"
  )
  web_pid=$(<"$run/.web.pid")
  for port in "$api_port" "$web_port"; do
    for _ in $(seq 1 60); do
      # curl writes 000 when the connection is refused: anything else is an answer.
      [ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/" 2>/dev/null)" != 000 ] && continue 2
      sleep 1
    done
    echo "nothing answered on :$port within 60s (see $run/api.log, $run/web.log)" >&2
    return 1
  done
}

# shoot before|after: screenshot the seeded proposal, copy it where the host can open it.
shoot() {
  local png=$run/$1.png
  if node "$repo/harness/screenshot.cjs" "$work" "http://127.0.0.1:$web_port$page_path" "$png" \
    >>"$run/screenshots.log" 2>&1; then
    mkdir -p /screenshots && cp "$png" "/screenshots/$id-$1.png" && shots+=("/screenshots/$id-$1.png")
  else
    echo "screenshot $1 failed (see $run/screenshots.log)" >&2
  fi
}

# "Before": the untouched code, before the agent starts. The servers are stopped again straight
# away, so nothing of the run's is listening while the agent works.
harness_before_shot() {
  [ "$preview" = 1 ] || return 0
  local base_db=${DATABASE_URL%%\?*} query=""
  [ "$base_db" != "$DATABASE_URL" ] && query="?${DATABASE_URL#*\?}"
  # Beside the database in DATABASE_URL, named after the run.
  run_db_name="${base_db##*/}_harness_${id//-/_}"
  run_db_url="${base_db%/*}/$run_db_name$query"
  if (cd "$work" && DATABASE_URL="$run_db_url" dbmate --no-dump-schema create) >>"$log" 2>&1; then
    db_created=1
    if migrate_run_db && start_servers; then
      shoot before
    else
      echo "screenshot before failed: could not start the run's app (see $log)" >&2
    fi
    stop_servers
  else
    echo "screenshots skipped: could not create database $run_db_name (see $log)" >&2
    preview=0
  fi
}

# harness_agent <prompt> <settings-file> <system-prompt> [yolo-allowed: 1]
# One claude -p call in the worktree. Its status is left in $agent_status (124 on timeout).
# stderr goes to the terminal and run.log so claude's own errors are not lost.
# stdout (the event stream) is appended whole to events.jsonl, outside the worktree.
# --setting-sources local keeps the project's .claude/settings.json (curl, git push) out.
# A refused call only says "denied", so the agent is told the rules up front.
# HARNESS_YOLO=1 restores the old, unrestricted behaviour, for callers that pass yolo-allowed.
harness_agent() {
  local prompt=$1 settings=$2 system=$3 yolo=${4:-0} perm_args
  if [ "${HARNESS_YOLO:-}" = 1 ] && [ "$yolo" = 1 ]; then
    echo "permissions: OFF (HARNESS_YOLO=1)"
    perm_args=(--dangerously-skip-permissions)
  else
    echo "permissions: ${settings#"$repo"/}"
    perm_args=(
      --settings "$settings"
      --setting-sources local
      --permission-mode dontAsk
      --append-system-prompt "$system"
    )
  fi

  (
    cd "$work" || exit 1
    timeout "${TIMEOUT_SECONDS:-900}" claude -p "$prompt" \
      --output-format stream-json --verbose \
      --max-turns "${MAX_TURNS:-25}" \
      --model "${HARNESS_MODEL:-sonnet}" \
      "${perm_args[@]}" \
      </dev/null 2> >(tee -a "$log" >&2) |
      tee -a "$run/events.jsonl" |
      # One line per tool call: its name and the command or path it works on.
      jq -R --unbuffered -r 'fromjson? | select(.type == "assistant") | .message.content[]?
        | select(.type == "tool_use")
        | "-> \(.name) \(.input.command // .input.file_path // .input.pattern // .input.path // "")"' |
      tee -a "$log"
    exit "${PIPESTATUS[0]}" # claude's (timeout's) status, not tee's or jq's
  )
  agent_status=$?
}

# harness_finish <agent-status>: everything after the agent. Does not return.
harness_finish() {
  local status=$1
  cd "$work" || exit 1

  # Format what the agent changed, as a pre-commit hook would: it may check formatting but not
  # rewrite it, and a style nit should not fail the gate. The worktree's own Prettier;
  # --ignore-unknown skips files it does not handle.
  local changed=() f
  while IFS= read -r -d '' f; do
    [ -f "$f" ] && changed+=("$f")
  done < <(git ls-files -z --modified --others --exclude-standard)
  if [ "${#changed[@]}" -gt 0 ]; then
    npx prettier --write --ignore-unknown "${changed[@]}" >>"$log" 2>&1 ||
      echo "prettier could not format every changed file (see $log)" >&2
  fi

  # Explicit identity: the container may have none configured.
  git add -A
  git -c user.name="Harness" -c user.email="harness@localhost" \
    commit -q -m "Harness run $id: $(head -n 1 "$task_file" | cut -c1-60)" || echo "Nothing to commit"

  echo "run:    $id"
  echo "branch: $branch"
  # The result events are the source of truth for model, turns and cost (summed over stages).
  # -R/-s/fromjson? so a half-written last line after a timeout cannot stop it.
  jq -R -s -r '[split("\n")[] | fromjson? | select(.type == "result")] as $r
    | if ($r | length) == 0 then empty else
      "model:  \($r | map(.modelUsage // {} | keys) | add | unique | join(", "))\nturns:  \($r | map(.num_turns // 0) | add)"
      + (if ($r | map(.total_cost_usd) | any(. != null)) then "\ncost:   $\($r | map(.total_cost_usd // 0) | add)" else "" end)
      end' "$run/events.jsonl"

  # The last stage's own closing message - its answer to the task - kept with the record.
  echo "--- result (also in $run/result.md)"
  tail -n +"$((events_skip + 1))" "$run/events.jsonl" |
    jq -R -r 'fromjson? | select(.type == "result") | .result // empty' |
    tee "$run/result.md"

  # "After": the committed code, on a freshly migrated database (the agent may have added
  # migrations). Taken before the gate, whose npm ci replaces node_modules.
  if [ "$preview" = 1 ]; then
    if port_taken "$api_port" || port_taken "$web_port"; then
      echo "after screenshot skipped: port $api_port or $web_port answers now" >&2
    elif migrate_run_db && start_servers; then
      shoot after
    else
      echo "screenshot after failed: could not start the run's app (see $log)" >&2
    fi
    stop_servers
  fi

  # The gate: the CI checks, run on the committed code. An empty run has not done the task, and
  # checking untouched code would pass. The branch is kept either way.
  echo "--- gate (output in $run/run.log)"
  local gate=FAILED
  if [ "$(git -C "$work" rev-parse HEAD)" = "$base" ]; then
    echo "gate: the run committed nothing" | tee -a "$log"
  elif (cd "$work" && npm_config_ignore_scripts=true ./scripts/ci-check.sh) >>"$log" 2>&1; then
    gate=PASSED
  fi
  echo "GATE $gate"
  local shot
  for shot in "${shots[@]}"; do echo "screenshot: $shot"; done

  # The agent's own failure (124 on timeout) comes first; else a failed gate is 1.
  [ "$status" -ne 0 ] && exit "$status"
  [ "$gate" = PASSED ] || exit 1
  exit 0
}
