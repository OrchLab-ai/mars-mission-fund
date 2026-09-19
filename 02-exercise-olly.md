# Exercise 02 — Cross-Cutting Concern (Observability)

## The challenge

Every HTTP request that hits the Mars Mission Fund server should produce a structured JSON log line.
The log line must include: HTTP method, path, response status code, response time in milliseconds, and the correlation ID.

The codebase already has a pino logger and a correlation ID middleware.
Your task: wire them together into a request logging middleware and add it to the server.

## What already exists

The following pieces are already in place — your solution must build on them, not duplicate them:

- **Pino logger** — already configured somewhere in `packages/server/src/`
- **Correlation ID middleware** — at `packages/server/src/middleware/correlationId.ts`; it stores the ID in `res.locals['correlationId']`
- **`app.ts`** — the Express application; middleware is registered here in order

## Why this is hard without AI

Adding middleware sounds simple, but doing it correctly requires:

- Understanding the existing pino logger setup (how it is configured, what transport it uses)
- Knowing where in the middleware chain to place request logging (it must come *after* `correlationId` so the ID is available)
- Knowing how to measure response time (attach a timestamp on the request, log it in the response `finish` event)
- Writing tests that assert the logger is called with the correct fields

Estimated time without AI assistance: **2–3 hours**.

## Suggested prompt

```text
Add structured HTTP request logging to the server.
Every request should log method, path, status code, response time in ms,
and correlation ID — in JSON format using the existing pino logger.
The middleware must be placed after the correlationId middleware in app.ts.
Add tests that verify the log fields are correct.
```

## Success criteria

- `npm run test` passes
- Start the server (`npm run dev:server`) and make any request (e.g., `curl http://localhost:3001/v1/proposals`)
- A JSON log line appears containing `method`, `path`, `status`, `duration`, and `correlationId` fields
- The log line does not appear for unmatched routes that 404 before hitting your middleware (optional stretch goal)
