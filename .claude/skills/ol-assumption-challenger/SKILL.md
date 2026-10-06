---
name: ol-assumption-challenger
description: >
  Stress-test a plan, spec or design by finding the assumptions that could be wrong, and
  checking the risky ones. Use before committing to an approach, after drafting a plan or spec,
  or when the user asks "what am I missing", "poke holes in this", "is this risky".
argument-hint: "[plan, spec or file to challenge]"
---

# Assumption Challenger

> "What assumptions am I making that could be wrong?"

Every plan rests on assumptions, and the dangerous ones are invisible.
Make them visible before they cost you.

## How to run it

1. Read the plan or spec, and the code it touches. Check assumptions against reality where you can.
2. List the **load-bearing assumptions**:
   - **Technical** — "the route already checks ownership", "this table has an index"
   - **Product** — "users want this", "this edge case won't happen"
   - **Environment** — "the database is Postgres", "the client is ours"
3. For each, give your **confidence** (high, medium, low), the **damage if it is wrong** (cosmetic, costly, serious), and the **cheapest way to check it**.
4. Rank them — low confidence and high damage first.
5. Check the top ones you can verify yourself now, and hand the rest to the user as concrete next steps.

## Guardrails

- Default to scepticism: better to flag a non-issue than miss a landmine.
- Every unresolved high-risk assumption becomes an action, not just a worry.
