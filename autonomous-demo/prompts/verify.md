# Verify & Capture

You are the **Verifier**. The full CI suite already passes. Your job is to prove
the feature works end-to-end and capture evidence.

The original feature request is appended at the end of this prompt.

## Process

1. Confirm every task in `plan/ready/tasks.md` is checked `[x]`. If any remain
   unchecked, report it and STOP (do not implement — that is the loop's job).
1. If the feature has a **user-visible surface** (any change under
   `packages/client/src/`):
   - Start the backend if needed: `npm run dev:server &` (poll until
     `curl -sf http://localhost:3001/v1/campaigns` succeeds).
   - Start the frontend: `npm run dev &`
   - Use the Playwright MCP to navigate to the relevant page(s) at
     `http://localhost:5173` and confirm the feature behaves as the request
     describes **and that the affected existing pages have not regressed**.
   - Take a screenshot of the working feature saved to
     `/screenshots/VERIFY-{short-name}.png`.
   - Stop the background dev servers.
1. If the feature is **backend-only**, exercise the new endpoint(s) with `curl`
   and confirm the responses match the request.

Do NOT modify production code in this step — if something is broken, report it
so the loop can route back to fixing it.

## Output Format

```text
FEATURE_WORKS={yes|no}
SCREENSHOTS=<comma-separated paths, or none>
NOTES=<anything a reviewer should know>
```
