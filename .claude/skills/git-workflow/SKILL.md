---
name: git-workflow
description: >
  Provides safe patterns for git and GitHub operations that avoid manual permission prompts.
  Covers creating commits, pushing branches, creating or updating GitHub PRs, adding PR comments,
  creating or updating GitHub issues or milestones, rebasing, resolving merge conflicts,
  monitoring CI/build status, creating feature branches, and syncing after a PR merge.
  Also applies when the task will clearly end with a commit or PR
  (e.g. "stage and commit", "push and open a PR", "the fix looks good, commit it"),
  or involves any `gh` CLI command that takes a body/description argument.
  Does not apply to: reading git logs, reviewing diffs, explaining git concepts,
  editing CI/workflow YAML, running local CI checks, or code-only tasks like fixing bugs
  or adding endpoints (unless also committing/pushing the result).
  When relevance is ambiguous, this skill should be triggered — it is lightweight and prevents permission prompt friction.
---

# Git Workflow Skill

## Sections

- [Core pattern](#core-pattern-for-multi-line-content) — Write tool → `.log` file → command → cleanup
- [Commit](#commit) · [Create a PR](#create-a-pr) · [Update a PR / Add a comment](#update-a-pr--add-a-comment)
- [Issues](#create-or-update-github-issues) · [Milestones](#milestones)
- [Rebase](#rebase) · [Resolving conflicts](#resolving-conflicts)
- [Monitor CI](#monitor-ci) · [Feature branch](#feature-branch) · [Sync after PR merge](#sync-after-pr-merge)

---

Auto-approved commands (`git *`, `gh *`, `./scripts/*`) only match **simple, single commands** —
one per Bash tool call. Chaining (`&&`), heredocs, subshells (`$()`), and `/tmp` writes all
break the match and force a manual approval prompt.

## Core pattern for multi-line content

Commit messages, PR bodies, issue bodies, and comments all follow the same pattern:

1. **Write tool** → create `<name>.log` in repo root (not `/tmp`, not Bash `echo`/`cat`)
2. **Bash** → run the command with a file flag (`-F`, `--body-file`)
3. **Bash** → `rm <name>.log`

Every Bash call is exactly one command. No exceptions.

---

## Commit

```bash
git add <specific-files>
```
Write tool → `commit-msg.log` in conventional commit format (`.log` files are gitignored):
```
feat(auth): implement JWT refresh token rotation

Adds automatic token rotation on expiry with a 30-second grace window
to prevent race conditions in concurrent requests.
```
```bash
git commit -F commit-msg.log
```
```bash
rm commit-msg.log
```

Stage specific files — never `git add .` or `git add -A`.

If a pre-commit hook fails, the commit did NOT happen. Fix the issue, re-stage, and create a
new commit. Never `--amend` after a hook failure — it would modify the previous commit.

## Create a PR

```bash
git push -u origin HEAD
```
Write tool → `pr-body.log`
```bash
gh pr create --title "<short title>" --body-file pr-body.log
```
```bash
rm pr-body.log
```
Show the PR URL from the output. Add `--base main` if needed. Title under 70 chars.

## Update a PR / Add a comment

Same pattern — Write tool → `.log` file → command → cleanup:

- **Update body:** `gh pr edit <number> --body-file pr-body.log`
- **Add comment:** `gh pr comment <number> --body-file pr-comment.log`

## Create or update GitHub issues

Write tool → `issue-body.log`
```bash
gh issue create --repo <owner/repo> --title "<title>" --body-file issue-body.log
```
```bash
rm issue-body.log
```

Add `--milestone`, `--label`, or `--assignee` flags inline — they are short strings and safe.
When creating multiple issues, reuse the same `.log` filename — write, create, delete, repeat.

Update an existing issue body the same way:
```bash
gh issue edit <number> --body-file issue-body.log
```

## Any `gh` command with a body argument

The `--body "..."` flag on **any** `gh` subcommand (issue, pr, release, discussion) will trigger
a permission prompt if the body contains markdown headers (`#`). Always use `--body-file` instead.
Same Write → command → cleanup pattern.

## Milestones

See [MILESTONES.md](MILESTONES.md) for the full guide on creating, listing, updating, deleting,
and assigning milestones. Key point: the REST API uses milestone **number** (integer) but
`gh issue` / `gh pr` commands use milestone **name** (string).

## Rebase

```bash
git fetch origin main
```
```bash
git rebase origin/main
```

### Resolving conflicts

If the rebase stops with conflicts, follow these steps for each conflicting commit:

1. Check which files have conflicts:
   ```bash
   git status
   ```
2. Read each conflicted file with the Read tool — look for `<<<<<<<` markers
3. Edit the file with the Edit tool to resolve the conflict (remove markers, keep correct code)
4. Stage the resolved file:
   ```bash
   git add <resolved-file>
   ```
5. Continue the rebase:
   ```bash
   git rebase --continue
   ```
6. Repeat from step 1 if more commits have conflicts

Never prefix `git rebase --continue` with `GIT_EDITOR=true`.

## Monitor CI

```bash
gh run list --branch <branch> --limit 3
```
Watch until complete (blocks, auto-approves):
```bash
gh run watch <run-id>
```
If failed:
```bash
gh run view <run-id> --log-failed
```

## Feature branch

```bash
git checkout -b <prefix>/<description> main
```
Prefixes: `feat/`, `fix/`, `chore/`. Never commit directly to main.

To carry uncommitted work to a new branch, use the same command — it moves dirty working tree
state to the new branch without needing `git stash`.

## Sync after PR merge

After a PR is squash-merged (or merged) into main, sync your local main:

```bash
git checkout main
```
```bash
git pull origin main
```

To clean up the merged feature branch:
```bash
git branch -d <branch-name>
```

Use `-d` (not `-D`) — it will refuse to delete if the branch has unmerged work, which is a
safety net. If it fails, the branch may need rebasing onto updated main first.
