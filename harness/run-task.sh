#!/usr/bin/env bash
# Run one task headlessly with Claude Code in a throwaway git worktree.
# Usage: harness/run-task.sh <task-file>
set -uo pipefail # no -e: we must commit and report even when the agent fails

# shellcheck source=harness/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

harness_init "${1:-}"
harness_before_shot

harness_agent "$(cat "$task_file")" "$repo/harness/settings.json" "$code_system_prompt" 1

harness_finish "$agent_status"
