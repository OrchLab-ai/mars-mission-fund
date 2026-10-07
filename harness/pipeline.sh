#!/usr/bin/env bash
# Run one task as a pipeline in one run: a read-only planner, a coder that executes the plan, the
# gate, then a review loop (a reviewer that can say no, a fixer, a limit) and a report.
# Usage: harness/pipeline.sh <task-file>
#   REVIEW_MODEL  the reviewer's model (default opus)
#   MAX_LOOPS     fix rounds before a human must decide (default 2)
set -uo pipefail # no -e: we must commit and report even when the agent fails

# shellcheck source=harness/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

harness_init "${1:-}"
harness_before_shot # before stage 1: the untouched code

review_model=${REVIEW_MODEL:-opus}
max_loops=${MAX_LOOPS:-2}
learnings_file=$repo/harness/LEARNINGS.md # in this checkout: the worktree is cut from HEAD

# --- Stage 1: plan. Read-only; the harness, not the agent, saves what it says. ---------------
# The lessons of earlier runs are put in the prompt: the worktree is cut from the last commit, so
# the planner could not read lessons that are not committed yet.
learnings=""
[ -s "$learnings_file" ] && learnings="

Lessons from the reviews of earlier runs. Take them into account in the plan:

$(cat "$learnings_file")"

echo "=== stage 1: plan (harness/settings.plan.json)"
harness_agent "You are the planning stage. Do not change anything. Read the task and every spec it names. Output a plan as markdown: a short brief, then numbered tasks, each with the files it touches and the tests that must pass.

$(cat "$task_file")$learnings" "$repo/harness/settings.plan.json" \
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
harness_agent "Execute this plan exactly. If a step of the plan is wrong, do not improvise and do not carry on: stop, and make your final message a line that starts with BLOCKED: followed by why the step is wrong. The line must start with those characters (no bullet, no bold, no quote), or the pipeline cannot tell that you stopped and will check half-finished work.

$plan" "$repo/harness/settings.json" "$code_system_prompt" 1
code_status=$agent_status

stage2_result=$(tail -n +"$((events_skip + 1))" "$run/events.jsonl" |
  jq -R -r 'fromjson? | select(.type == "result") | .result // empty')
blocked "stage 2 (code)" "$stage2_result"

printf '%s\n' "$stage2_result" >"$run/result.md"
echo "output: stage 1 plan   $run/plan.md"
echo "        stage 2 result $run/result.md"
echo "        both stages    $run/events.jsonl, $run/run.log"

harness_commit "Harness run $id: $(head -n 1 "$task_file" | cut -c1-60)"
harness_gate

# --- Review loop: review, fix, commit, gate, review again. ------------------------------------
# review_verdict <reply>: "pass", "fail" or "invalid". The reply must be exactly the JSON object
# asked for. A fail is any finding of medium severity or above, or a verdict that is not "pass":
# the findings and the verdict must agree, or the review is not trusted to pass the work.
review_verdict() {
  local v
  v=$(printf '%s' "$1" | jq -s -r '
    def sev: {"low": 0, "medium": 1, "high": 2, "critical": 3};
    if length == 1 and (.[0] | type == "object")
      and (.[0].verdict | IN("pass", "fail"))
      and (.[0].findings | type == "array")
      and all(.[0].findings[]; type == "object"
        and (.severity | IN("low", "medium", "high", "critical"))
        and (.confidence | IN("low", "medium", "high"))
        and (.file | type == "string") and (.issue | type == "string"))
    then (if .[0].verdict == "pass" and all(.[0].findings[]; sev[.severity] < 1)
      then "pass" else "fail" end)
    else "invalid" end' 2>/dev/null)
  echo "${v:-invalid}"
}

# review_findings <reply>: one line per finding.
review_findings() {
  printf '%s' "$1" | jq -r '.findings[] | "  [\(.severity), confidence \(.confidence)] \(.file): \(.issue)"'
}

review_system_prompt="You are read-only, under a permissions allowlist. You may use Read, Glob and Grep, and Bash only for look-around commands (cd, pwd, ls, cat, head, tail, wc, grep, find, sort, uniq, sed, cut, tr, comm, diff) and git diff, git log and git show. Make each Bash call one simple command, run from the worktree root; do not chain commands or use absolute or .. paths. You cannot edit or write any file, run tests, or use the network; do not try. Your final message must be the JSON object and nothing else: no prose before or after it and no code fence."

outcome=open
reason=""
gate_after_code=$gate
open_review="" # the last review that was a valid JSON, for what is still open
rounds=0
fixes=0
disputes=""

if [ "$code_status" -ne 0 ]; then
  reason="the coding stage failed (status $code_status)"
elif [ "$gate" != PASSED ]; then
  reason="the gate failed on the coding stage's work"
else
  while :; do
    rounds=$((rounds + 1))
    echo "=== review $rounds ($review_model, harness/settings.review.json)"
    dispute_text=""
    [ -n "$disputes" ] && dispute_text="

The fixing agent disputes some findings of the previous review, and left the code as it was for them:

$disputes

For each one: if its reasoning holds, accept it and leave that finding out of your review; if it does not, report the finding again."
    harness_agent "You are the review stage, and you can say no. Review the work done for the task below. The work is the diff from the commit the run started from to the run branch: run git diff $base $branch (git log and git show also work). Read the specs the task names and the code around the change, not only the diff. Judge it against the task and those specs: wrong or missing behavior, unmet acceptance criteria, security, data loss, missing or weak tests, and anything the task said not to touch.

Report every finding, including ones you are unsure of (give those low confidence): do not filter. Severity is low (style, naming, small clarity), medium (a real defect or gap that should be fixed), high (a bug, an unmet requirement or a security problem) or critical (data loss, a vulnerability or a broken build). Fail the work only for a finding of medium severity or above.

Reply with JSON only, in this shape:
{\"verdict\": \"pass\" or \"fail\", \"findings\": [{\"severity\": \"low\"|\"medium\"|\"high\"|\"critical\", \"confidence\": \"low\"|\"medium\"|\"high\", \"file\": \"path, or empty\", \"issue\": \"what is wrong and why\"}]}
The verdict is \"fail\" if and only if there is a finding of medium severity or above. With no findings, findings is [].

Task:

$(cat "$task_file")$dispute_text" "$repo/harness/settings.review.json" "$review_system_prompt" 0 "$review_model"
    review=$agent_result
    printf '%s\n' "$review" >"$run/review-$rounds.json"
    verdict=$(review_verdict "$review")
    echo "review $rounds: $verdict ($run/review-$rounds.json)"

    if [ "$verdict" = pass ]; then
      outcome=passed
      open_review=$review
      break
    elif [ "$verdict" = invalid ]; then
      # Not JSON counts as a fail, and there is nothing to hand a fixer.
      reason="review $rounds was not the JSON asked for (see $run/review-$rounds.json)"
      break
    fi
    open_review=$review

    if [ "$fixes" -ge "$max_loops" ]; then
      reason="review $rounds still fails after $fixes fix rounds (MAX_LOOPS=$max_loops)"
      break
    fi

    fixes=$((fixes + 1))
    echo "=== fix $fixes (harness/settings.json)"
    findings=$(printf '%s' "$review" | jq '.findings')
    harness_agent "You are the fixing stage. A reviewer found problems in the work done for the task below, in this worktree.

Fix every finding of medium severity or above. Fix a lower one only where it is small and safe. Change nothing else. If a finding is wrong, do not change the code for it: say why on a line starting DISPUTED:. The line must start with those characters (no bullet, no bold, no quote), one line per disputed finding.

Task:

$(cat "$task_file")

Findings:

$findings" "$repo/harness/settings.json" "$code_system_prompt" 1
    fix_status=$agent_status
    disputes=$(printf '%s\n' "$agent_result" | grep '^DISPUTED:' || true)

    before_fix=$(git -C "$work" rev-parse HEAD)
    harness_commit "Harness run $id: review fixes, round $fixes"
    if [ "$(git -C "$work" rev-parse HEAD)" = "$before_fix" ]; then
      echo "gate: the fixer changed nothing; the code is as the last gate saw it" | tee -a "$log"
    else
      harness_gate
      if [ "$gate" != PASSED ]; then
        reason="the gate failed after fix round $fixes"
        break
      fi
    fi
    if [ "$fix_status" -ne 0 ]; then
      reason="the fixing agent failed in round $fixes (status $fix_status)"
      break
    fi
  done
fi

# The loop is over: the screenshot shows the final code.
harness_after_shot

# --- Report: summary.md for a stakeholder, and the lessons kept in this checkout. -------------
all_findings=""
for f in "$run"/review-*.json; do
  [ -e "$f" ] || continue
  if [ "$(review_verdict "$(cat "$f")")" != invalid ]; then
    n=${f##*/review-}
    all_findings+="Review ${n%.json}:
$(review_findings "$(cat "$f")")
"
  fi
done
diffstat=$(git -C "$work" diff --stat "$base" "$branch")
echo "=== report (harness/settings.plan.json)"
harness_agent "You are the report stage. Do not change anything. Write for a non-technical stakeholder who will never read code.

Output exactly this, and nothing else:
1. A summary of exactly three sentences, as one paragraph: what changed, what the risk is, and what happens next. Plain words: no file names, no code, no jargon. The third sentence must match the outcome below.
2. A blank line, then a line that says only LESSONS:
3. Then one line per lesson, each starting with \"- \". A lesson is a general rule that would have prevented a finding (for example: \"Check ownership against creator_id, not created_by\"), not a description of this task's code. One sentence, 200 characters at most. Write none if there were no findings.

Task:

$(cat "$task_file")

Outcome: $outcome${reason:+ ($reason)}
Gate after the coding stage: $gate_after_code
Review rounds: $rounds. Fix rounds: $fixes.
Changed files:
$diffstat

Findings from every review round:
${all_findings:-none}" "$repo/harness/settings.plan.json" \
  "You are read-only and have no tools you need: answer from what is in the prompt. Your final message is the report." 0

if [ "$agent_status" -eq 0 ] && [ -n "$agent_result" ]; then
  printf '%s\n' "$agent_result" | sed '/^LESSONS:/,$d' >"$run/summary.md"
  # These lines reach the next run's planning prompt: only plain "- " lines, one line each, no
  # control characters, capped in length.
  lessons=$(printf '%s\n' "$agent_result" | sed -n '/^LESSONS:/,$p' | grep '^- ' |
    tr -d '\000-\010\013-\037' | cut -c1-300 || true)
  if [ -n "$lessons" ]; then
    [ -e "$learnings_file" ] ||
      printf '# Lessons from review findings\n\nOne line per lesson, appended by harness/pipeline.sh and read by its planning stage.\n\n' >"$learnings_file"
    printf '%s\n' "$lessons" | sed "s/\$/ (run $id)/" >>"$learnings_file"
    echo "lessons: $(printf '%s\n' "$lessons" | wc -l) appended to $learnings_file"
  fi
  echo "summary: $run/summary.md"
else
  echo "report stage failed (status $agent_status): no summary.md. See $log" >&2
fi

# --- The verdict. -----------------------------------------------------------------------------
harness_print_run
for shot in "${shots[@]}"; do echo "screenshot: $shot"; done
echo "--- review loop: $outcome after $rounds review round(s) and $fixes fix round(s)"
if [ "$outcome" = passed ]; then
  echo "Remaining findings (none of medium severity or above):"
  if [ "$(printf '%s' "$open_review" | jq '.findings | length')" -gt 0 ]; then
    review_findings "$open_review"
  else
    echo "  none"
  fi
  echo "To approve this work, run from your checkout (on a branch that is not main):"
  echo "  git merge --squash $branch"
  exit 0
fi

echo "Not approved: $reason."
if [ -n "$open_review" ]; then
  echo "Open findings (from the last valid review):"
  review_findings "$open_review"
fi
echo "A human must decide: inspect the branch $branch, the reviews in $run, then merge or discard it."
# The agent's own failure (124 on timeout) comes first, else 1.
[ "$code_status" -ne 0 ] && exit "$code_status"
exit 1
