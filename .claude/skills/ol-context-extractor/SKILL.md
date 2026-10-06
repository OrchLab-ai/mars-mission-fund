---
name: ol-context-extractor
description: >
  Work out what information and context a task needs BEFORE doing it, find what you can,
  and ask only for the rest. Use when the user is about to start a task and the inputs are
  unclear, or asks "what do you need from me", "what's missing", "what should I gather first".
argument-hint: "[goal]"
---

# Context Extractor

> "What information do I need to prompt for {goal}?"

Before doing the work, list what the work depends on.
An agent that charges ahead on missing or wrong context produces confident, wrong results.

## How to run it

1. State the goal in one sentence.
2. List the context needed to do it well, in three groups:
   - **Must-have** — without it the result will be wrong: the target files, the API contract, the data shape, the acceptance criteria
   - **Should-have** — makes it noticeably better: conventions, a similar feature to copy, constraints
   - **Nice-to-have** — sharpens the edges: performance budgets, plans for later
3. Look for each item yourself first — the code, `CLAUDE.md`, `specs/`, the tests, the schema.
   Mark each one found, missing, or assumed.
4. Ask the user only about what you could not find, as a short list, most important first.

## Guardrails

- Search the codebase before asking the human. Cheap context first.
- Say the difference between "I couldn't find it" and "it doesn't exist".
- If the gaps are about what the user wants rather than how the code works, hand over to `/ol-socratic`.
