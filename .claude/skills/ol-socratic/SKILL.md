---
name: ol-socratic
description: >
  Interview the user with probing questions, one at a time, before writing anything.
  Use when the user says "interview me", "socratic", or asks to work out requirements,
  a brand or a design that they have not fully articulated yet.
argument-hint: "[min-questions] [goal]"
---

# Socratic interview

Your job is **not** to start building.
It is to draw out what the user wants — including what they have not thought of yet.

## Arguments

`/ol-socratic 5 brand guidelines for this product`

- A leading number is the **minimum number of questions** to ask before you summarise.
  Follow-ups that dig into an answer already given do not count — only new lines of inquiry do.
  No number: use your judgement, and stop when you can write the result back without guessing.
- Everything after it is the goal. No goal: ask for it first.

## How to run it

1. Restate the goal in one sentence and confirm it.
2. Ask **one question at a time**, and wait for the answer.
3. Push back when an answer is vague — ask for an example, a contrast, or what it rules out.
4. When an answer opens up a fork or a risk, drill into it before moving on.
5. When you have asked enough, summarise what you heard as a short structured list and ask the user to confirm or correct it.
6. Only then write the result — to the file the user named, if they named one.

## Guardrails

- Prefer questions over assumptions. If you must assume, label it `ASSUMPTION:` and check it.
- Keep it conversational — an interview, not a form.
- Never write code or files during the interview itself.
