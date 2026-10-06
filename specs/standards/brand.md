# Brand Application Standard

> **Spec ID**: L2-001
> **Version**: 2.0
> **Status**: Draft
> **Rate of Change**: Monthly / standard reviews
> **Depends On**: L1-001 (Product Vision & Mission)
> **Depended On By**: L3-005 (tech/frontend.md), L4-001 (domain/account.md), L4-002 (domain/proposal.md), L4-003 (domain/donor.md)

---

## Purpose

> **Local demo scope**: The token architecture, semantic mappings, and component specifications are **real** — they drive the local demo's UI implementation.
> Voice-in-product patterns guide all user-facing copy.
> Accessibility requirements apply fully.
> Logo placement is theatre until a new mark exists (see Open Items).

This document is the source of truth for the Mars Mission Fund brand and defines how it is applied in the product.
Version 2.0 is a rebrand from a blank page.
It replaces the dark, orange, mission-control identity of version 1.x with a light, violet, crew-logbook identity.
The earlier HTML brand guidelines (`mars-mission-fund-brand.html`) describe the retired identity and are no longer a source of truth.

The Tier 2 semantic token names from version 1.x are kept so that component code does not need renaming.
Only the mappings beneath them change.
Where a version 1.x token has no place in the new identity, it is retired (see Section 9).

---

## Brand Foundation

### Audience

The design target is one person.
She is a 24-year-old astrophysics grad student, on her phone, on a late train home, after a friend shared a mission on social media.
Crowdfunding already feels normal to her because she has backed indie games, but she has never given to anything scientific.
She would back a mission at $25 to $50 if it feels real and she can follow its progress like a story.
She has about two minutes of attention, so the page must make her care fast.
She wants to feel like part of the crew, not a donor to an institution.

### What she should feel

Ranked in order.
When two of these conflict, the higher one wins, because if she does not care in the first few seconds she never stays long enough to judge whether the mission is real.

1. **Belonging, but not a fan club.** She is invited onto the team, not sold merchandise.
1. **Momentum, but not hype.** Things are moving right now, with no countdown timers and no exclamation marks.
1. **Credibility, but not a lab report.** Real numbers and real engineers, shown plainly and not buried in jargon.

Strava is the reference.
It turns strangers into teammates through shared progress, with one confident colour and big numbers, and every claim is backed by real data underneath.

### Visual principles

- A warm paper page, like a shared crew logbook rather than a planetarium.
- One saturated accent colour (violet) for everything clickable.
- A separate colour (lime) used only for progress, so progress is never mistaken for an action.
- The raised amount is the largest thing on a mission card.
  Its energy comes from size and weight, not colour.
- Flat fills and ink borders, like stickers on a notebook.

---

## Token Architecture

The product uses a **two-tier token system**.

**Tier 1 — Identity Tokens**: Named for the brand vocabulary.
These are the raw palette, fonts and sizes defined in Section 1.
They are **never referenced directly in component code**.

**Tier 2 — Semantic Tokens**: Named for purpose and intent.
These map to identity tokens and are the **only layer components are allowed to consume**.

```text
Component code → Semantic token → Identity token → Raw value

Button background → --color-action-primary → --violet → #5B3DF5
```

**Rule**: Component code, stylesheets, and UI implementations must **only** reference Tier 2 semantic tokens.
Direct references to Tier 1 identity tokens in component code are a spec violation.

---

## 1. Tier 1 — Identity Tokens

### 1.1 Colour Identity Tokens

#### Paper and Ink — Foundation

| Identity Token | Value     | Brand Role                                      |
| -------------- | --------- | ----------------------------------------------- |
| `--paper`      | `#FAF7F2` | Warm off-white page, like a paper notebook      |
| `--white`      | `#FFFFFF` | Card and input surface                          |
| `--ink`        | `#1C1B22` | Near-black text, borders, and the progress track |
| `--graphite`   | `#6B6875` | Muted text and labels                           |
| `--hairline`   | `#E4DFD6` | Quiet dividers between rows and sections        |

#### Violet — Action

| Identity Token  | Value     | Brand Role                                                              |
| --------------- | --------- | ----------------------------------------------------------------------- |
| `--violet`      | `#5B3DF5` | The brand accent: buttons, links, focus, the colour of the sky after sunset |
| `--violet-deep` | `#4A2BE0` | Pressed and hover state of violet                                       |

#### Lime — Progress

| Identity Token | Value     | Brand Role                                                       |
| -------------- | --------- | ---------------------------------------------------------------- |
| `--lime`       | `#B6F23A` | Progress fill only. Never text, never a control, never a border. |

#### Signal — Status

| Identity Token | Value     | Brand Role                         |
| -------------- | --------- | ---------------------------------- |
| `--signal-red` | `#C62828` | Errors and failed transactions     |
| `--amber`      | `#9A5B00` | Warnings, deadline approaching     |
| `--green`      | `#1F7A3A` | Funded and confirmed (dark green so lime stays reserved for progress) |

### 1.2 Gradient Identity Tokens

None.
Every fill in the product is one flat colour from the palette.
Gradients are banned on surfaces, buttons, text, and progress bars.

### 1.3 Typography Identity Tokens

| Identity Token   | Value                              | Brand Role                                             |
| ---------------- | ---------------------------------- | ------------------------------------------------------ |
| `--font-display` | Bricolage Grotesque, sans-serif    | Headlines. A chunky grotesque with human quirk, like a hand-painted crew patch. Weight 800. |
| `--font-body`    | Inter, sans-serif                  | Body text, labels, buttons. Neutral and legible on a phone in poor light. |
| `--font-data`    | Inter, sans-serif                  | Numbers. Bold or ExtraBold with tabular figures (`font-variant-numeric: tabular-nums`). |

Both families are open-licensed and load from Google Fonts.
There is no monospace face and no third font.
The tokens `--font-body` and `--font-data` share a family on purpose.
They are separate tokens so that a future change to numerals does not touch body text.

### 1.4 Motion Identity Tokens

| Identity Token      | Value                           |
| ------------------- | ------------------------------- |
| `--duration-fast`   | 150ms                           |
| `--duration-slow`   | 800ms                           |
| `--easing-out`      | `cubic-bezier(0.25, 1, 0.5, 1)` |

### 1.5 Radius Identity Tokens

| Identity Token  | Value |
| --------------- | ----- |
| `--radius-md`   | 12px  |
| `--radius-full` | 100px |

No other radii exist.

### 1.6 Border and Spacing Identity Tokens

| Identity Token   | Value |
| ---------------- | ----- |
| `--border-ink`   | 1.5px |
| `--space-unit`   | 4px   |

All spacing is a multiple of `--space-unit`.

---

## 2. Tier 2 — Semantic Tokens

These are the only tokens components may reference.
Each maps to a Tier 1 identity token.

**Opacity convention**: Where a semantic token derives from an identity token at reduced opacity, it is written as `{identity-token} / {opacity%}`.
At build time this resolves to the corresponding `rgba()` value.

### 2.1 Colour — Actions

| Semantic Token                    | Maps To         | Usage                                             |
| --------------------------------- | --------------- | ------------------------------------------------- |
| `--color-action-primary`          | `--violet`      | Primary button background, links                  |
| `--color-action-primary-hover`    | `--violet-deep` | Hover and pressed state on primary actions        |
| `--color-action-primary-text`     | `--white`       | Text on primary action backgrounds                |
| `--color-action-primary-shadow`   | `--ink`         | Hard 2px offset shadow, shown only while pressed  |
| `--color-action-secondary-bg`     | `--white`       | Secondary button background                       |
| `--color-action-secondary-text`   | `--ink`         | Secondary button text                             |
| `--color-action-secondary-border` | `--ink`         | Secondary button border                           |
| `--color-action-ghost-text`       | `--violet`      | Ghost button text                                 |
| `--color-action-ghost-border`     | `--violet`      | Ghost button border                               |
| `--color-action-disabled`         | `--graphite` at 50% opacity | Inactive buttons and disabled inputs  |

### 2.2 Colour — Status

| Semantic Token                  | Maps To      | Usage                                             |
| ------------------------------- | ------------ | ------------------------------------------------- |
| `--color-status-success`        | `--green`    | Funded, milestone complete, transaction confirmed |
| `--color-status-success-bg`     | `--white`    | Success badge background                          |
| `--color-status-success-border` | `--green`    | Success badge border                              |
| `--color-status-error`          | `--signal-red` | Validation errors, failed transactions          |
| `--color-status-warning`        | `--amber`    | Deadline approaching                              |
| `--color-status-info`           | `--graphite` | Neutral informational badges, help text           |
| `--color-status-active`         | `--violet`   | Live proposal indicator                           |
| `--color-status-active-bg`      | `--white`    | Active badge background                           |
| `--color-status-active-border`  | `--violet`   | Active badge border                               |
| `--color-status-new`            | `--ink`      | New mission indicator                             |
| `--color-status-new-bg`         | `--white`    | New mission badge background                      |
| `--color-status-new-border`     | `--ink`      | New mission badge border                          |

### 2.3 Colour — Surfaces

| Semantic Token        | Maps To        | Usage                                    |
| --------------------- | -------------- | ---------------------------------------- |
| `--color-bg-page`     | `--paper`      | Primary page background                  |
| `--color-bg-surface`  | `--white`      | Cards, modals, panels                    |
| `--color-bg-elevated` | `--white`      | Dropdowns and hovered cards (no tint)    |
| `--color-bg-overlay`  | `--ink / 60%`  | Modal overlays (a flat tint, never a blur) |
| `--color-bg-input`    | `--white`      | Form input backgrounds                   |
| `--color-bg-accent`   | `--ink`        | Table headers, emphasis blocks           |

### 2.4 Colour — Text

| Semantic Token           | Maps To        | Usage                                                   |
| ------------------------ | -------------- | ------------------------------------------------------- |
| `--color-text-primary`   | `--ink`        | Headlines, big numbers, primary content                 |
| `--color-text-secondary` | `--ink`        | Body text and descriptions                              |
| `--color-text-tertiary`  | `--graphite`   | Labels such as "raised of $50,000", timestamps, placeholders |
| `--color-text-accent`    | `--violet`     | Links and highlighted text at any size                  |
| `--color-text-on-action` | `--white`      | Text on violet backgrounds                              |
| `--color-text-on-accent-bg` | `--paper`   | Text on `--color-bg-accent` blocks                      |
| `--color-text-success`   | `--green`      | Funded text                                             |
| `--color-text-error`     | `--signal-red` | Error messages                                          |
| `--color-text-warning`   | `--amber`      | Deadline text                                           |

**Rule**: Hierarchy is carried by size and weight.
`--color-text-primary` and `--color-text-secondary` share one colour on purpose.
Never use `--color-text-tertiary` for primary content or primary for metadata.

### 2.5 Colour — Borders and Dividers

| Semantic Token            | Maps To      | Usage                                      |
| ------------------------- | ------------ | ------------------------------------------ |
| `--color-border-card`     | `--ink`      | Card border, 1.5px                         |
| `--color-border-subtle`   | `--hairline` | Dividers inside a card or between sections |
| `--color-border-emphasis` | `--violet`   | Form input border on focus                 |
| `--color-border-input`    | `--ink`      | Default form input border, 1.5px           |
| `--color-border-accent`   | `--violet`   | Active navigation indicator                |

### 2.6 Colour — Progress

| Semantic Token               | Maps To      | Usage                                        |
| ---------------------------- | ------------ | -------------------------------------------- |
| `--color-progress-fill`      | `--lime`     | Progress bar fill, in progress and complete  |
| `--color-progress-complete`  | `--lime`     | Same as fill. A funded mission is marked by the Funded badge, not a different bar colour. |
| `--color-progress-track`     | `--ink`      | Progress bar track                           |
| `--color-data-positive`      | `--green`    | Upward trend, gain indicators                |
| `--color-data-neutral`       | `--graphite` | Stable or neutral data points                |

### 2.7 Gradients

None.
All `--gradient-*` tokens from version 1.x are retired.

### 2.8 Typography — Semantic

**Split-property token convention**: Each type-scale entry expands into five CSS variables: `--type-*-size`, `--type-*-weight`, `--type-*-leading`, `--type-*-spacing`, and `--type-*-family`.
Components apply each property individually.

| Semantic Token           | Font Family      | Size | Line height | Weight | Additional                                  |
| ------------------------ | ---------------- | ---- | ----------- | ------ | ------------------------------------------- |
| `--type-hero`            | `--font-display` | 40px | 44px        | 800    | letter-spacing: -0.02em. Sentence case.     |
| `--type-page-title`      | `--font-display` | 40px | 44px        | 800    | letter-spacing: -0.02em. Sentence case.     |
| `--type-section-heading` | `--font-display` | 28px | 34px        | 800    | letter-spacing: -0.02em. Sentence case.     |
| `--type-stat-value`      | `--font-data`    | 48px | 52px        | 800    | tabular figures. The largest type on a card. |
| `--type-stat-value-compact` | `--font-data` | 28px | 34px        | 800    | tabular figures                             |
| `--type-body`            | `--font-body`    | 16px | 26px        | 400    |                                             |
| `--type-data`            | `--font-data`    | 16px | 26px        | 700    | tabular figures. Inline amounts and counts. |

The following sizes were **not decided in the interview** and are derived to complete the scale.
They need design review.

| Semantic Token        | Font Family      | Size | Line height | Weight | Additional                         |
| --------------------- | ---------------- | ---- | ----------- | ------ | ---------------------------------- |
| `--type-card-title`   | `--font-display` | 22px | 28px        | 800    | letter-spacing: -0.01em            |
| `--type-body-small`   | `--font-body`    | 14px | 22px        | 400    |                                    |
| `--type-button`       | `--font-body`    | 16px | 20px        | 700    |                                    |
| `--type-label`        | `--font-body`    | 14px | 20px        | 500    | Sentence case. Never uppercase.    |
| `--type-input-label`  | `--font-body`    | 14px | 20px        | 600    | Sentence case.                     |

**Rule**: The type scale is a closed set.
No intermediate sizes or custom font assignments.

**Rule**: `--font-display` is always sentence case.
Never set it in all caps, and never use it for body text or form labels.

**Rule**: The raised amount on a mission card uses `--type-stat-value` and is the largest type on that card.
It is larger than the display headline.

**Rule**: Section labels set in uppercase with wide tracking (version 1.x `--type-section-label`) are retired.

### 2.9 Motion — Semantic

| Semantic Token           | Duration          | Easing         | Usage                                                   |
| ------------------------ | ----------------- | -------------- | ------------------------------------------------------- |
| `--motion-press`         | `--duration-fast` | `--easing-out` | Button response while pressed                           |
| `--motion-progress-fill` | `--duration-slow` | `--easing-out` | Progress bar filling from zero to its value, once, when it scrolls into view |

**Rule**: These are the only two animations in the product.
Nothing loops, pulses, counts down, parallaxes, or animates on its own.
Modals, menus and toasts appear instantly.

### 2.10 Layout — Semantic

| Semantic Token        | Maps To         | Usage                                    |
| --------------------- | --------------- | ---------------------------------------- |
| `--radius-button`     | `--radius-full` | All button variants                      |
| `--radius-badge`      | `--radius-full` | Status badges and tags                   |
| `--radius-input`      | `--radius-md`   | Form inputs                              |
| `--radius-card`       | `--radius-md`   | All cards                                |
| `--radius-progress`   | `--radius-full` | Progress bar track and fill              |
| `--border-width`      | `--border-ink`  | Card, input and secondary button borders |
| `--space-card`        | 6 × `--space-unit` | Card padding (24px, derived)          |

**Rule**: No other radii.
No screen mixes radii outside this set, and no card has sharp square corners.

---

## 3. Component Specifications

These mappings are mandatory.

### 3.1 Buttons

| Variant   | Background                    | Text                            | Border                            | Usage                             |
| --------- | ----------------------------- | ------------------------------- | --------------------------------- | --------------------------------- |
| Primary   | `--color-action-primary`      | `--color-action-primary-text`   | none                              | Single primary action per viewport |
| Secondary | `--color-action-secondary-bg` | `--color-action-secondary-text` | `--color-action-secondary-border` | Alternative actions, and the already-backed state |
| Ghost     | transparent                   | `--color-action-ghost-text`     | none                              | Tertiary actions                  |

All buttons: `--radius-button`, `--type-button`, padding 12px 24px, minimum 44px tall.
Hover darkens the primary background to `--color-action-primary-hover`.
While pressed, a button shows a 2px hard offset shadow in `--color-action-primary-shadow` with no blur.
That pressed shadow is the only shadow permitted anywhere in the product.

**Rule**: Only one primary action per viewport.

### 3.2 Cards

| Element       | Semantic Token                                         |
| ------------- | ------------------------------------------------------ |
| Background    | `--color-bg-surface`                                   |
| Border        | `--border-width` solid `--color-border-card`           |
| Border radius | `--radius-card`                                        |
| Shadow        | none                                                   |
| Padding       | `--space-card`                                         |

Cards have no accent bar, no gradient, no glow, and no shadow.
They sit on the paper page like stickers on a notebook.

### 3.3 Progress Bars

| Element        | Semantic Token                                      |
| -------------- | --------------------------------------------------- |
| Track          | `--color-progress-track`, 8px high                  |
| Fill           | `--color-progress-fill`                             |
| Radius         | `--radius-progress` on track and fill               |
| Animation      | `--motion-progress-fill`, once, on scroll into view |
| Endpoint dot   | none                                                |

The lime fill is only legible because it sits on the dark ink track.
Lime on the paper page measures 1.2:1, so a progress bar must never be drawn without its track.

### 3.4 Mission Card Funding Block

| Element        | Semantic Token                                                          |
| -------------- | ----------------------------------------------------------------------- |
| Raised amount  | `--type-stat-value`, `--color-text-primary`                             |
| "raised of $X" | `--type-body`, `--color-text-tertiary`, set on the same line as the amount |
| Progress bar   | Section 3.3, directly beneath the amount                                |

### 3.5 Badges

| Variant       | Background                  | Text                     | Border                          |
| ------------- | --------------------------- | ------------------------ | ------------------------------- |
| Funded        | `--color-status-success-bg` | `--color-status-success` | `--color-status-success-border` |
| Live          | `--color-status-active-bg`  | `--color-status-active`  | `--color-status-active-border`  |
| New mission   | `--color-status-new-bg`     | `--color-text-primary`   | `--color-status-new-border`     |

All badges: `--radius-badge`, `--type-label`, padding 4px 12px, 1.5px border.
Badges carry no dot indicator.
Status is given by the text.

### 3.6 Form Inputs

| Element          | Semantic Token                                       |
| ---------------- | ---------------------------------------------------- |
| Background       | `--color-bg-input`                                   |
| Border (default) | `--border-width` solid `--color-border-input`        |
| Border (focus)   | `--color-border-emphasis`, plus the focus ring       |
| Border radius    | `--radius-input`                                     |
| Text             | `--color-text-primary`                               |
| Placeholder      | `--color-text-tertiary`                              |
| Label            | `--type-input-label`, `--color-text-primary`         |

### 3.7 Mission Images

- Mission images are real photographs of the team, their hardware, or their workshop.
- Stock astronaut photos, rendered planets, starfields and nebulae are never used.
- When a mission has no photo, the slot shows a flat `--color-action-primary` tile with the mission's initials in `--font-display` and `--color-action-primary-text`.

### 3.8 Icons

Icons are simple line icons used for actions only.
Rocket, orbit-line, planet and star icons and decorative graphics are never used.
Decorative icons are `aria-hidden="true"`.
Icon-only controls require an `aria-label`.

---

## 4. Voice-in-Product

The voice is a teammate talking to a teammate.
It is plain, specific, and warm.
It shows progress instead of announcing it.

### 4.1 Voice Principles

| Principle                 | In practice                                                                    |
| ------------------------- | ------------------------------------------------------------------------------ |
| She is crew, not a donor  | Invite her onto the team. Never thank her for a "donation".                    |
| Show, don't announce      | Give the number and the date. Leave out the adjective.                         |
| Momentum without hype     | No countdowns, no exclamation marks, no "last chance".                         |
| Real people, plainly      | Name the team and what they are building. Explain jargon in context.           |

### 4.2 Copy Patterns by Surface

#### Mission Pages

| Element        | Pattern                                      | Example                                                                  |
| -------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| Headline       | Who is building what, then what they need    | "Six students are building the thing that tastes Mars dirt. They need a hand." |
| Funding status | Amount, then plain context                   | "$12,400 raised of $50,000 · 18 days left"                               |
| Main button    | "Join the crew"                              | "Join the crew"                                                          |
| Already backed | "You're on the crew", linking to updates     | "You're on the crew"                                                     |

#### Financial Confirmations

| Element           | Pattern                            | Example                                                       |
| ----------------- | ---------------------------------- | ------------------------------------------------------------- |
| Backing confirmed | Precise amount, then the crew line | "Your $25 is in. You're on the crew for the soil analyser."   |
| Escrow            | Status and reassurance             | "Funds are held until the team verifies each milestone."      |
| Disbursement      | Action and transparency            | "Milestone 2 verified. $8,400 released to the team."          |

#### Error and Empty States

| Element          | Pattern                    | Example                                                                       |
| ---------------- | -------------------------- | ----------------------------------------------------------------------------- |
| Payment failure  | Helpful, not alarming      | "That didn't go through. Your card wasn't charged. Try again in a minute."    |
| Validation error | Specific and actionable    | "Enter an amount of $5 or more."                                              |
| System error     | Honest, with a next step   | "Something broke on our end. We're on it. Try again in a few minutes."        |
| Nothing backed   | Invitation, not absence    | "You haven't joined a crew yet. Pick a mission."                              |
| No search match  | Redirect, not dead end     | "No missions match that. Browse live missions instead."                       |

### 4.3 Forbidden Language

Never use the following in any user-facing copy.

| Pattern                                                  | Reason                                                  | Use Instead                                        |
| -------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| "Donate", "donor", "donation"                            | She is crew, not a donor                                | "Back", "join the crew", "backer", "crew"          |
| "Revolutionary", "game-changing"                         | Announces instead of showing                            | A specific number, date or fact                    |
| "Stakeholder", "contribution tier", "pledge level"       | It is a team, not a fund                                | "Crew", "backing amount"                           |
| "Invest", "investing", "investor", "investment"          | Regulatory risk, because backing is not equity          | "Back", "backing", "backer", "support"             |
| "Guaranteed returns"                                     | Illegal in most jurisdictions                           | Never imply financial returns                      |
| "Exciting opportunity", "last chance", "hurry"           | Sounds like spam and manufactures urgency               | A specific claim: "18 days left"                   |
| "Click here", "Click to learn more"                      | Non-descriptive and inaccessible                        | "Read the mission plan"                            |
| Exclamation marks                                        | Hype                                                    | A full stop                                        |
| Passive voice in buttons                                 | Weakens the action                                      | "Join the crew"                                    |

---

## 5. Accessibility Requirements

### 5.1 Colour Contrast

Ratios below were calculated against the WCAG 2.1 relative-luminance formula.

| Pairing                                                | Ratio  | Requirement                  |
| ------------------------------------------------------ | ------ | ---------------------------- |
| `--color-text-primary` on `--color-bg-page`            | 16.0:1 | 7:1 (AAA) — passes           |
| `--color-text-primary` on `--color-bg-surface`         | 17.1:1 | 7:1 (AAA) — passes           |
| `--color-text-tertiary` on `--color-bg-page`           | 5.1:1  | 4.5:1 (AA) — passes          |
| `--color-text-tertiary` on `--color-bg-surface`        | 5.4:1  | 4.5:1 (AA) — passes          |
| `--color-text-accent` on `--color-bg-page`             | 5.7:1  | 4.5:1 (AA) — passes          |
| `--color-action-primary-text` on `--color-action-primary` | 6.1:1 | 4.5:1 (AA) — passes       |
| `--color-action-primary-text` on `--color-action-primary-hover` | 7.7:1 | 4.5:1 (AA) — passes  |
| `--color-text-success` on `--color-bg-page`            | 5.0:1  | 4.5:1 (AA) — passes          |
| `--color-text-error` on `--color-bg-page`              | 5.3:1  | 4.5:1 (AA) — passes          |
| `--color-text-warning` on `--color-bg-page`            | 5.1:1  | 4.5:1 (AA) — passes          |
| `--color-progress-fill` on `--color-progress-track`    | 12.8:1 | 3:1 (non-text UI) — passes   |
| `--color-progress-fill` on `--color-bg-page`           | 1.2:1  | 3:1 (non-text UI) — **fails** |

**Rule**: `--lime` is never used for text, for a control, or directly on the paper or white surfaces.
It appears only on the ink progress track.

**Rule**: `--color-border-subtle` (`--hairline`) is decorative.
It must never be the only thing that separates two interactive elements or conveys state.

### 5.2 Motion Accessibility

**Rule**: All animation respects `prefers-reduced-motion: reduce`.

| Semantic Token           | Normal Behaviour                          | Reduced Motion       |
| ------------------------ | ----------------------------------------- | -------------------- |
| `--motion-press`         | Button responds on press                  | Instant              |
| `--motion-progress-fill` | Fills from zero once on scroll into view  | Instant fill         |

### 5.3 Focus States

All interactive elements show a visible focus indicator.

| Element             | Focus Style                                                                   |
| ------------------- | ----------------------------------------------------------------------------- |
| Buttons and links   | `outline: 2px solid --color-action-primary; outline-offset: 2px`              |
| Form inputs         | `border-color: --color-border-emphasis` plus the same 2px outline with 2px offset |
| Cards (interactive) | `outline: 2px solid --color-action-primary; outline-offset: 2px`              |

**Rule**: Focus styles are never suppressed with `outline: none` without an equivalent visible alternative.
Focus indicators use an outline, never a glow.

### 5.4 Screen Reader Requirements

| Context           | Requirement                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| Progress bars     | `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label` with mission name and percentage |
| Mission images    | Meaningful alt text describing the team, hardware or workshop. The initials tile is decorative.   |
| Financial amounts | Screen reader includes currency: "$12,400 US dollars raised"                                      |
| Button icons      | Decorative: `aria-hidden="true"`. Icon-only: `aria-label` required                               |

### 5.5 Touch Targets

The primary audience is on a phone.
Every interactive element is at least 44px by 44px.

---

## 6. Logo Usage in Product

The rebrand does not yet include a new logo.
The existing coin mark uses the retired orange and dark-space palette and will clash with the new identity.
Until a new mark exists, follow the placement rules below and treat the logo as an open item.

| Context              | Size                       |
| -------------------- | -------------------------- |
| Navigation bar       | 32px height                |
| Login and registration | 120px                    |
| Footer               | 72px                       |
| Favicon              | 16px                       |

Minimum clear space around the logo equals the height of the "M" in the wordmark, and at least 8px in navigation.

---

## 7. Light Mode Only

Mars Mission Fund is a light product.
The paper palette is the only theme, and there is no dark mode.
Email, PDF and embedded contexts use the same palette.
A dark mode may be added only by amending this spec.

---

## 8. Brand Misuse in Product

The following are violations of this standard and must be flagged in code review.

| Violation                                                                 | Why It Matters                                                         |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Referencing Tier 1 identity tokens in component code                      | Breaks the semantic abstraction                                        |
| Gradients on any surface, button, text or progress bar                    | Every fill is one flat palette colour                                  |
| Glows, neon edges, backdrop blur, or glass effects                        | Rejected outright by the brand                                         |
| Drop shadows on cards, or any shadow other than the pressed-button offset | Cards are separated by a 1.5px ink border                              |
| Lime used for text, a control, or on a non-ink background                 | Fails contrast and confuses progress with action                       |
| Using `--color-action-primary` for error or progress states               | Conflates actions with errors and progress                             |
| Rendered planets, starfields, nebulae or stock astronaut photos           | The brand is a crew, not a planetarium                                 |
| Rocket, orbit-line, planet or star icons or decorative graphics           | Icons are for actions only                                             |
| Monospace type, or all-caps display type                                  | Reads as telemetry or mission control                                  |
| Mixed corner radii on one screen, or sharp square cards                   | Cards are 12px, and buttons and progress bars are pills                |
| Looping, pulsing, counting-down or parallax animation                     | Only the progress fill and button press may animate                    |
| Animations ignoring `prefers-reduced-motion`                              | WCAG 2.1 SC 2.3.3 violation                                            |
| Countdown timers or exclamation marks in copy                             | Hype                                                                   |
| Forbidden words from Section 4.3                                          | Brand voice violation                                                  |
| Multiple primary actions per viewport                                     | Dilutes action hierarchy                                               |
| Suppressed focus indicators                                               | WCAG 2.1 SC 2.4.7 violation                                            |

---

## 9. Migration from Version 1.x

The semantic token names are preserved, so most components change only by remapping.
The following tokens are retired, and any component using them must be updated.

| Retired Token                                                      | Reason                                          |
| ------------------------------------------------------------------ | ----------------------------------------------- |
| All `--gradient-*` tokens                                          | Gradients are banned                            |
| `--color-progress-indicator` and the endpoint dot with glow        | Glows are banned                                |
| `--color-status-new-bg` blue tint and the badge status dots        | Replaced by flat white badges with a border     |
| `--type-section-label`                                             | Uppercase tracked labels are banned             |
| `--motion-enter`, `--motion-enter-emphasis`, `--motion-hover`, `--motion-panel`, `--motion-page`, `--motion-ambient`, `--motion-urgency` | Only `--motion-press` and `--motion-progress-fill` remain |
| `--radius-card-large`, `--radius-stat`, and radii other than 12px and full | One card radius                          |
| Card top accent bar                                                | Gradient and decoration                         |

Typography changes affect every component that uses `--font-data`, which was a monospace face.
Numbers that used it now use tabular Inter.

---

## Open Items

These were not decided in the interview and need an owner.

1. **Logo.** The coin mark is orange and dark-themed and needs a redraw for the new palette.
1. **Derived values.** The sizes marked as derived in Section 2.8, the `--violet-deep` hover colour, the `--hairline` colour, the card padding, and the three status colours were proposed to complete the token set and have not been through design review.
1. **Dependent specs.** L3-005 (tech/frontend.md), L4-001 to L4-003 and L1-001 may still describe the dark, orange identity or use the words "donor" and "donate".
   They have not been updated by this change and should be reviewed.
1. **Existing code.** The client's Tier 1 tokens and fonts now follow this spec, but its Tier 2 semantic tokens and components still follow version 1.x.
   The remaining gaps are listed in the change that regenerated `packages/client/src/tokens.css`.

---

## Change Log

| Date       | Version | Author | Summary                                                                                                                                                                                                                                                     |
| ---------- | ------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| March 2026 | 1.0     | —      | Initial draft. Combined identity and semantic tokens.                                                                                                                                                                                                       |
| March 2026 | 1.1     | —      | Restructured to two-tier token architecture.                                                                                                                                                                                                                |
| March 2026 | 1.2     | —      | Closed token chain gaps and added opacity convention.                                                                                                                                                                                                       |
| 2026-03-10 | 1.3     | —      | Documented split-property token convention, hero responsive ladder, and the "invest" forbidden-word table.                                                                                                                                                  |
| 2026-10-06 | 2.0     | —      | Rebrand from a blank page, from a Socratic interview (see `docs/cp-06/brand-guideline-response.md`). Light paper theme, violet accent, lime progress, Bricolage Grotesque and Inter, flat fills and ink borders, two animations only, crew voice. Status moved to Draft pending review. |

---

*This standard governs brand application in the Mars Mission Fund product.
The record of the interview that produced it is in `docs/cp-06/brand-guideline-response.md`.*
