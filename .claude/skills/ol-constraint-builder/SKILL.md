---
name: ol-constraint-builder
description: >
  Turn a vague quality — "secure", "fast", "reliable", "accessible" — into concrete, testable
  constraints before building. Use when the user wants something to be secure, fast or robust
  without saying how, or asks "what constraints", "what guardrails", "what could go wrong".
argument-hint: "[quality attribute] [feature]"
---

# Constraint Builder

> "What constraints ensure {attribute}?"

A quality is vague until it is a constraint.
This turns "make it secure" into a checklist the build can be held to.

## How to run it

1. Name the qualities that matter: security, performance, reliability, accessibility, privacy, cost.
2. For each, write **concrete, testable constraints**, not adjectives. For example:
   - Security: every query parameterised, authorisation checked at the route, no secrets in source
   - Performance: no N+1 queries, lists paginated past 100 items
   - Reliability: writes are idempotent, failures return the standard error shape
3. Ground them in this codebase: check `specs/standards/` and `specs/tech/`, and reuse the rules already written there.
4. Output a **constraints checklist**, and say how each one will be verified — a test, a lint rule, or a review check.

## Guardrails

- Measurable thresholds beat adjectives.
- Use the project's existing standards rather than inventing new ones.
- Flag constraints that pull against each other, so the user can decide the trade-off.
