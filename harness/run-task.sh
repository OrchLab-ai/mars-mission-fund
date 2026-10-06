#!/usr/bin/env bash
# Run one task headlessly with Claude Code in a throwaway git worktree.
# Usage: harness/run-task.sh <task-file>
set -uo pipefail # no -e: we must commit and report even when the agent fails

# shellcheck source=harness/lib.sh
source "$(dirname "$0")/lib.sh"

harness_setup "$1" || exit 1
code_perm_args
harness_agent "$(cat "$task_file")" "$run/events.jsonl" "${perm_args[@]}"
harness_finish
exit $?
