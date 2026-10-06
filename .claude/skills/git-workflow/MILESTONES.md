# Milestones

The `gh` CLI has **no `gh milestone` subcommand**. Use `gh api` against the REST API instead.

**Critical:** The REST API identifies milestones by **number** (integer), but `gh issue` and
`gh pr` commands identify milestones by **name** (string). Do not confuse them.

## Create

```bash
gh api repos/{owner}/{repo}/milestones -X POST -f title="Milestone Name" -f state="open"
```
Optional: add `-f description="..."` and `-f due_on="YYYY-MM-DDT00:00:00Z"`.
Returns JSON with the `number` field needed for subsequent API operations.

## List

```bash
gh api repos/{owner}/{repo}/milestones
```
Add `--jq '.[] | {number, title, state}'` for filtered output.

## Update (use milestone **number**)

```bash
gh api repos/{owner}/{repo}/milestones/{number} -X PATCH -f state="closed"
```

## Delete (use milestone **number**)

```bash
gh api repos/{owner}/{repo}/milestones/{number} -X DELETE
```

## Assign to issue/PR (use milestone **name**, not number)

```bash
gh issue create --title "..." --body-file issue-body.log --milestone "Milestone Name"
```
```bash
gh issue edit 42 --milestone "Milestone Name"
```
```bash
gh pr edit 7 --milestone "Milestone Name"
```
