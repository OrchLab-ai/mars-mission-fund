---
name: ol-spec-writer
description: >
  Turn a feature idea, or an existing spec with gaps, into a written specification file
  (specs/<feature>.spec.md) through a short interview. Use when the user wants to plan a
  feature properly, says "write a spec" or "spec this out", or before building anything
  non-trivial.
argument-hint: "[min-questions] [feature or existing spec]"
---

# Spec-Writer

Better specs give better results: code generation is a search, and a precise spec is the query.
This skill produces a spec file you can commit, review, and hand to an agent to build from.

## Arguments

`/ol-spec-writer 6 Mission Updates — start from specs/mission-updates.spec.md`

- A leading number is the **minimum number of questions** in the interview.
  Follow-ups on an answer already given do not count. No number: use your judgement.
- Everything after it is the feature, and any spec or standard to start from.

## How to run it

1. **Read first.** Read any spec the user named, `CLAUDE.md`, and the standards in `specs/`.
   Look at the code the feature will touch, so your questions are about this codebase, not generic ones.
2. **Interview**, in the style of `/ol-socratic`: one question at a time, push back on vague answers.
   Cover what the spec leaves open — scope in and out, the existing code and schema it must fit,
   API conventions, edge cases and failure, security, and how we will know it works.
3. **Draft the spec** in the structure this repo uses:

   ```markdown
   # <Feature> — Specification
   ## Role                 — who the agent building it is acting as
   ## Context              — files and folders involved, the closest existing template, patterns to follow
   ## Standards            — which specs/standards apply, tests required, error handling
   ## Acceptance criteria  — numbered, testable checkboxes
   ## Out of scope         — what this deliberately does not do
   ## Assumptions          — anything you assumed instead of asking, so it can be checked
   ```

4. **Confirm.** Show the draft and revise until the user is happy.
5. **Save** to `specs/<feature>.spec.md` — overwrite the starting spec if the user named one — and tell them the path.

## Guardrails

- The spec is the deliverable. Do not start implementing.
- Every acceptance criterion must be testable — if you cannot say how to check it, rewrite it.
- Ground the spec in the real code: name real files, real routes and real tables.
