---
name: ol-prompt-improver
description: >
  Take a draft prompt and make it sharper: find the vague words, missing context, missing
  constraints and missing success criteria, then rewrite it. Use when the user shares a prompt
  and asks to improve it, or says "is this a good prompt", "help me word this", "my prompt is X".
argument-hint: "[the prompt to improve]"
---

# Prompt Improver

> "My prompt is {X}. Help me improve it."

Most weak results come from weak prompts, not weak models.
Treat the prompt as a spec to be tightened.

## How to run it

1. Echo the prompt back, so the user sees exactly what you are working from.
2. Check it against each of these, naming concrete problems:
   - **Goal** — is the outcome unambiguous?
   - **Context** — does it point at the files, data and constraints the task needs?
   - **Constraints** — scope, security, style, performance
   - **Format** — is the shape of the output stated?
   - **Done** — how will we know it worked?
   - **Ambiguity** — words that could be read two ways
3. Write the **improved prompt**, then a short list of what changed and why, so the user learns the pattern.
4. Where only the user can fill a gap, leave a `<FILL: ...>` placeholder instead of inventing details.

## Guardrails

- Improve the prompt — do not answer it. The deliverable is a better prompt.
- Keep the user's intent and voice. Sharpen, don't replace.
