---
name: resolve-pr-conflicts
description: Resolve merge conflicts on a GitHub PR by checking out the branch, rebasing onto the base branch, and resolving conflicts with nuance. Use when the user wants to fix merge conflicts on a PR (e.g. "resolve conflicts on PR 42", "fix merge conflicts").
---

# Resolve PR Conflicts

Checkout a PR branch, resolve conflicts, and push. Defaults to **rebase** for a clean linear history; pass `merge` to use a merge commit instead.

## Inputs

- **PR number** (required): e.g. `/resolve-pr-conflicts 100`
- **Strategy** (optional): `merge` to use a merge commit. e.g. `/resolve-pr-conflicts 100 merge`

Parse `$ARGUMENTS` to extract the PR number (first numeric argument) and strategy (if `merge` appears anywhere in the arguments). Default strategy is `rebase`.

## Process

### 1. Gather Context

```bash
gh pr view <pr-number> --json title,body,headRefName,baseRefName,mergeable
```

- Note the PR's purpose from the title and body — this is essential context for conflict resolution.
- Confirm the PR is in a `CONFLICTING` state. If it is already mergeable, tell the user and stop.
- Note the base branch (usually `main`).
- Also review the PR diff (`gh pr diff <pr-number>`) to understand the full scope of changes.

### 2. Checkout and Begin Resolution

```bash
git fetch origin
gh pr checkout <pr-number>
```

**If strategy is `rebase`:**

```bash
git rebase origin/<baseRefName>
```

**If strategy is `merge`:**

```bash
git merge origin/<baseRefName>
```

If either completes with no conflicts, skip to step 5 (rebase) or step 6 (merge).

### 3. Resolve Conflicts

For every conflicting file, read the full file to see the conflict markers in context.

#### a. Understand each conflict

Before editing, analyse:

- **What did the PR branch change, and why?** (refer to the PR description)
- **What did the base branch change, and why?** (check `git log` on the base branch for relevant commits)
- **Are they changing the same thing for the same reason?** (pick the better version)
- **Are they changing the same thing for different reasons?** (combine both intents)
- **Are they changing different things that happen to touch the same lines?** (keep both changes)

#### b. Apply resolution principles

1. **Functional changes from the base branch take priority** — the base branch represents merged, reviewed work. If it added a feature (e.g. new role support, new API field), preserve it.
2. **Keep the PR's intent** — if the PR's purpose is to add comments, documentation, or labels, preserve those additions alongside the base branch's functional changes.
3. **When both sides rewrote the same text**, combine: use the better structure/formatting from either side, and include substantive content from both.
4. **Type-level changes** — prefer the version with broader/correct types (e.g. if the base branch widened a union type, keep the wider type).
5. **Test files** — align with whichever version matches the current production code (usually the base branch for functional changes, but keep PR-added test cases).
6. **Never leave conflict markers** (`<<<<<<<`, `=======`, `>>>>>>>`) in the resolved files.

#### c. After resolving all conflicts in the current batch

```bash
git add <resolved files>
# Verify no conflict markers remain
rg "^<<<<<<<|^=======|^>>>>>>>" .
```

**If rebasing:** run `git rebase --continue` and repeat for each conflicting commit.

**If merging:** all conflicts are resolved in one pass — proceed to step 6.

### 4. Rebase Fallback (rebase strategy only)

If the same conflict recurs across 3+ commits during rebase, abort and suggest the merge alternative:

```bash
git rebase --abort
```

Tell the user:

> Rebase encountered repeated conflicts across multiple commits. You can re-run with merge strategy: `/resolve-pr-conflicts <pr-number> merge`

Then stop. Do not automatically fall back — let the user decide.

### 5. Post-Rebase Cleanup (rebase strategy only)

After the rebase completes, verify the commit log looks sensible (no empty commits, no unexpected changes):

```bash
git log --oneline origin/<baseRefName>..HEAD
```

### 6. Verify

Run the project's CI checks. Use the project's CI script if one exists (e.g. `./scripts/ci-check.sh`), otherwise fall back to the standard build and test commands from CLAUDE.md or `package.json`:

```bash
./scripts/ci-check.sh
```

If checks fail, investigate and fix before proceeding.

- **Rebase**: amend the relevant commit or add a fixup commit.
- **Merge**: fix and amend the merge commit.

### 7. Commit (merge strategy only)

Commit the merge with a message that summarises the resolution decisions:

```
Merge branch '<baseRefName>' into <headRefName>

Resolve conflicts by combining both sides' intent:
- <bullet for each resolution decision>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### 8. Push

Determine the correct remote for the PR branch (check `git remote -v` and the branch's tracking remote — PRs from forks use the fork remote, not `origin`).

**If rebased** (history was rewritten):

```bash
git push --force-with-lease <remote> <headRefName>
```

**If merged** (history preserved):

```bash
git push <remote> <headRefName>
```

Wait for the pre-push hook (CI checks) to pass.

### 9. Report

Summarise to the user:
- Strategy used (rebase or merge)
- How many files had conflicts (and across how many commits, if rebasing)
- What resolution approach was used for each conflict (1-2 sentences per file)
- Confirm CI passed and the PR should now be mergeable

## Important Notes

- Always read conflicting files before editing — never guess at content.
- If a conflict is ambiguous and you cannot determine the correct resolution, ask the user rather than guessing.
- If the base branch has advanced again after resolution (PR still shows as conflicting), fetch and resolve again.
- Check `git remote -v` to determine the correct push target — fork PRs need to be pushed to the fork remote, not `origin`.
- Rebase rewrites commit history — safe for PR branches but requires `--force-with-lease` to push.
- Merge preserves history — no force-push needed, but adds a merge commit to the PR.
