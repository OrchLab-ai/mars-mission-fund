---
name: ol-multi-approach
description: >
  Give several genuinely different solutions to a problem, with their trade-offs, instead of
  committing to the first idea. Use before a non-trivial design decision, or when the user asks
  for "options", "alternatives", "different ways", or seems anchored on one solution.
argument-hint: "[number-of-approaches] [problem]"
---

# Multi-Approach

> "Give me 3 different solutions to {goal}."

The first idea is rarely the best one, and seeing the spread makes the trade-offs visible.

## Arguments

`/ol-multi-approach 3 how backers get notified of new mission updates`

A leading number is how many approaches to give. No number: three.

## How to run it

1. State the problem and what "good" means here.
2. Give **genuinely different approaches**, not three flavours of one idea. For example:
   - the simplest thing that could work
   - the robust option that scales
   - reuse something that already exists in this codebase, or buy instead of build
3. For each: how it works in two to four lines, pros, cons, effort and risk, and when it is the right call.
4. End with a **recommendation** for this codebase and these constraints — not "it depends".

## Guardrails

- Ground at least one option in code that already exists here — look before you suggest building.
- Don't pad: if two approaches really are all there is, say so.
- Make trade-offs concrete — files touched, new dependencies, tables, rough effort.
