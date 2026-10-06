# Brand Application Standard

> **Spec ID**: L2-001
> **Version**: 2.0 (rebrand)
> **Status**: Draft — awaiting approval
> **Rate of Change**: Monthly / standard reviews
> **Depends On**: L1-001 (Product Vision & Mission)
> **Depended On By**: L3-005 (tech/frontend.md), L4-001 (domain/account.md), L4-002 (domain/proposal.md), L4-003 (domain/donor.md)

---

## Purpose

This document is the brand source of truth for Mars Mission Fund and defines how it becomes design tokens. Version 2.0 is a rebrand from a blank page, produced by interview. It **replaces** the Launchfire / Bebas Neue / DM Sans identity of v1.3 and the `mars-mission-fund-brand.html` specimen, which is now out of date.

The token architecture is unchanged: **Tier 1 identity tokens** hold raw values and are never used in component code. **Tier 2 semantic tokens** map to them and are the only layer components may reference.

```text
Component code → Semantic token → Identity token → Raw value

Pledge button background → --color-action-primary → --amber → #F5A524
```

---

## 1. Audience and Feeling

**Audience.** Priya, 34, a software engineer who follows every Starship test and arrives from a post about a team that needs funding. She is technical and skeptical, has about $50 and two minutes, and is deciding whether the project is real, whether it is progressing, and whether her money moves it forward. If the site looks like hype or a generic crowdfunding page, she closes the tab.

### Feelings, in priority order

| Feeling    | Reference                                                     | Expressed through                                  |
| ---------- | ------------------------------------------------------------- | -------------------------------------------------- |
| Awe        | Standing under the Saturn V at Kennedy Space Center           | Scale: large headlines, real photography           |
| Competence | A mission-control livestream: telemetry, calm, precise        | Mono data, instrument-like cards, restrained motion |
| Belonging  | A name on the list sent to Mars aboard Perseverance           | Backer counts and names, the pledge moment         |

**Test for every decision:** it should feel like joining a mission, not buying a product. What this site has that generic crowdfunding does not is engineering progress you can watch, so milestones, test results and team updates are the hero content.

---

## 2. Tier 1 — Identity Tokens

Do not reference these in component code.

### 2.1 Colour

The base is a deep blue-black, like the sky in the hour after sunset, never pure black. Neutrals lean cool blue so the page reads as one night sky with the amber glowing out of it.

| Identity Token   | Value     | Role                                                              |
| ---------------- | --------- | ----------------------------------------------------------------- |
| `--night`        | `#0B1220` | Page base                                                         |
| `--console`      | `#121B2D` | Card surface, one step lighter                                    |
| `--console-high` | `#1A2540` | Raised surface (hover, dropdowns)                                 |
| `--hairline`     | `#2A3750` | Faint 1px edge, only where two surfaces need a clear edge         |
| `--slate-edge`   | `#5A6B88` | Interactive control borders (meets 3:1 non-text contrast)         |
| `--starlight`    | `#E8EDF5` | Primary text                                                      |
| `--blue-grey`    | `#9AA8BF` | Secondary text, labels                                            |
| `--amber`        | `#F5A524` | Hue ~38. Things in motion and the main action                     |
| `--amber-bright` | `#FFB84D` | Amber hover state                                                 |
| `--amber-deep`   | `#D98A0F` | Amber pressed state                                               |
| `--teal`         | `#2BBFA4` | Done and verified, a calm "go" light                              |
| `--brick`        | `#E0735A` | Muted rust red. Stop: errors and destructive actions only         |

No decorative gradients and no glow effects are defined. Surfaces and fills are flat colour.

### 2.2 Typography

| Identity Token   | Value                                                                | Role                          |
| ---------------- | -------------------------------------------------------------------- | ----------------------------- |
| `--font-display` | `'Archivo', sans-serif` at `font-stretch: 125%` (expanded), wght 700 | Monumental but engineered     |
| `--font-body`    | `'IBM Plex Sans', sans-serif`                                        | Calm, readable at length      |
| `--font-data`    | `'IBM Plex Mono', monospace`                                         | Telemetry-style numbers only  |

All three are free on Google Fonts. Load Archivo as the variable font with the width axis (`wdth` 62–125) so the expanded width is available; fall back to Archivo Expanded static cuts if the axis is unavailable.

### 2.3 Shape, Motion

| Identity Token      | Value                     |
| ------------------- | ------------------------- |
| `--radius-panel`    | 4px                       |
| `--hairline-width`  | 1px                       |
| `--duration-fast`   | 150ms                     |
| `--duration-base`   | 300ms                     |
| `--duration-fill`   | 500ms                     |
| `--easing-out`      | `cubic-bezier(0.25, 1, 0.5, 1)` |

There is no spring easing. Nothing bounces.

---

## 3. Tier 2 — Semantic Tokens

### 3.1 Colour — Actions

| Semantic Token                  | Maps To           | Usage                                              |
| ------------------------------- | ----------------- | -------------------------------------------------- |
| `--color-action-primary`        | `--amber`         | Pledge and primary CTA backgrounds, links          |
| `--color-action-primary-hover`  | `--amber-bright`  | Hover on primary actions                           |
| `--color-action-primary-active` | `--amber-deep`    | Pressed                                            |
| `--color-action-primary-text`   | `--night`         | Text on amber (9.2:1)                              |
| `--color-action-secondary-text` | `--starlight`     | Secondary button text                              |
| `--color-action-secondary-border` | `--slate-edge`  | Secondary button border                            |
| `--color-action-disabled`       | `--blue-grey / 40%` | Inactive controls                                |
| `--color-focus-ring`            | `--amber`         | 2px outline, 2px offset, on every focusable element |

### 3.2 Colour — Status

| Semantic Token            | Maps To        | Usage                                                              |
| ------------------------- | -------------- | ------------------------------------------------------------------ |
| `--color-status-active`   | `--amber`      | In motion: live proposal, funding in progress                      |
| `--color-status-verified` | `--teal`       | Done: milestone verified, test passed, proposal funded             |
| `--color-status-error`    | `--brick`      | Errors and destructive actions. Always with an icon and a label    |
| `--color-status-warning`  | `--blue-grey`  | Warnings are outlined with an icon and a label. Never amber-filled |

### 3.3 Colour — Surfaces, Text, Borders

| Semantic Token           | Maps To          | Usage                                         |
| ------------------------ | ---------------- | --------------------------------------------- |
| `--color-bg-page`        | `--night`        | Page background                               |
| `--color-bg-surface`     | `--console`      | Cards, panels, modals                         |
| `--color-bg-elevated`    | `--console-high` | Hover on cards, dropdowns                     |
| `--color-text-primary`   | `--starlight`    | Headlines and primary content                 |
| `--color-text-secondary` | `--blue-grey`    | Secondary text, small quiet labels            |
| `--color-text-data`      | `--starlight`    | Mono figures                                  |
| `--color-border-subtle`  | `--hairline`     | Card edges, dividers                          |
| `--color-border-input`   | `--slate-edge`   | Form input borders                            |

### 3.4 Colour — Progress

| Semantic Token              | Maps To      | Usage                                           |
| --------------------------- | ------------ | ----------------------------------------------- |
| `--color-progress-fill`     | `--amber`    | In-progress bar. Same colour as the pledge button, because the button is how you move the bar |
| `--color-progress-complete` | `--teal`     | Verified or complete                            |
| `--color-progress-track`    | `--hairline` | Bar track                                       |

### 3.5 Typography

Each entry expands into `-size`, `-weight`, `-leading`, `-spacing` and `-family` CSS variables.

| Semantic Token           | Family           | Size            | Weight | Notes                                                        |
| ------------------------ | ---------------- | --------------- | ------ | ------------------------------------------------------------ |
| `--type-hero`            | `--font-display` | 72px (32px mobile) | 700 | Uppercase or tight title case. Landing hero only. Use sparingly |
| `--type-page-title`      | `--font-display` | 48px            | 700    | Uppercase or tight title case                                |
| `--type-section-heading` | `--font-display` | 32px            | 700    | Uppercase or tight title case                                |
| `--type-card-title`      | `--font-body`    | 20px            | 600    |                                                              |
| `--type-body`            | `--font-body`    | 16px            | 400    | line-height 1.7, sentence case                               |
| `--type-body-small`      | `--font-body`    | 14px            | 400    | line-height 1.6                                              |
| `--type-button`          | `--font-body`    | 14px            | 600    | Sentence case                                                |
| `--type-label`           | `--font-body`    | 12px            | 500    | Small and quiet, sentence case                               |
| `--type-data`            | `--font-data`    | 14px            | 400    | Funding totals, backer counts, timestamps, countdowns, percentages |
| `--type-data-large`      | `--font-data`    | 32px            | 500    | The headline figure in a card                                |

#### Typography rules

- The type scale is a closed set. Add a size here before using it.
- Mono is for data only. Body copy uses proportional figures.
- Banned: all-caps body text, letter-spaced "futuristic" headings, gradient text, and any sci-fi display face (Orbitron, Eurostile imitations, cut corners, glowing outlines).

### 3.6 Motion

| Semantic Token    | Duration           | Easing         | Usage                                               |
| ----------------- | ------------------ | -------------- | --------------------------------------------------- |
| `--motion-hover`  | `--duration-fast`  | `--easing-out` | Hover brightening, amber focus outline              |
| `--motion-status` | `--duration-base`  | `--easing-out` | Verified milestone fades to teal                    |
| `--motion-fill`   | `--duration-fill`  | `--easing-out` | Progress bar fills once on first view or when the total changes |
| `--motion-count`  | `--duration-fill`  | `--easing-out` | Totals and backer counts tick up once when they change |

#### Motion rules

- Motion is functional only. Nothing bounces, pulses, glows or loops.
- No parallax, no animated hero video, no confetti, no ambient or urgency animation.
- Under `prefers-reduced-motion: reduce`, bars and counters show their final values immediately, and the verified state changes without a fade.

### 3.7 Layout

| Semantic Token     | Maps To           | Usage                          |
| ------------------ | ----------------- | ------------------------------ |
| `--radius-card`    | `--radius-panel`  | Cards, panels, inputs, buttons, badges, progress bars |
| `--border-card`    | `--hairline-width` solid `--color-border-subtle` | Used only where two surfaces need a clear edge |

---

## 4. Components

| Component    | Specification                                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Cards        | `--color-bg-surface`, `--radius-card`, separated from the page by tone rather than heavy borders. Generous outer spacing and reading areas      |
| Card data    | Packed tightly and aligned like a console readout. Small quiet label (`--type-label`, secondary text) above a prominent figure (`--type-data-large`) |
| Primary CTA  | `--color-action-primary` fill, `--color-action-primary-text`. One per viewport. Copy follows §6                                                |
| Progress bar | 8px track, `--radius-card`, amber fill that turns teal when complete. `aria-valuenow`, `-min`, `-max` and a label naming the proposal            |
| Milestone    | Amber while in progress, teal when verified, with a text status as well as colour                                                              |
| Error        | `--color-status-error` text with an icon and a label. Colour is never the only signal                                                          |
| Warning      | Outline, icon and label. No amber fill                                                                                                         |
| Inputs       | `--color-bg-surface` fill, `--color-border-input`, amber focus ring                                                                            |

**The pledge moment** is like being given a mission patch, not winning a game. On a successful pledge, show a calm confirmation that names the backer and the mission. No confetti, fireworks or "you're awesome" pop-ups.

---

## 5. Imagery

- **Real photography only**: test stands, hardware, teams, and NASA and ESA images of Mars.
- **Diagrams and technical drawings** are allowed when they explain something (a mission timeline, an engine schematic, a trajectory). Draw them in the site's own line style, in amber and teal on the dark base.
- **Not allowed**: decorative illustration, AI-generated space art, stock 3D renders of rockets or astronauts, stock-photo heroes of smiling people looking at the sky.
- If something cannot be shown for real, show the data instead.

---

## 6. Voice-in-Product

Unchanged from v1.3 apart from the personality calibration below, which is updated to match the rebrand.

### 6.1 Personality Axes

| Axis                   | Position                | Product Implication                                                                  |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Playful / Serious      | 85% toward serious      | Calm, precise language like a mission log. No jokes about money or risk              |
| Technical / Accessible | 50% / 50%               | Priya is an engineer: use precise terms and explain them only where needed          |
| Cautious / Bold        | Confident, not urgent   | No fake scarcity and no countdown pressure. Every financial claim must be accurate  |
| Formal / Human         | 70% toward human        | Direct, first-person plural. Never corporate or legalistic                          |

### 6.2 Copy Patterns

| Surface                | Pattern                                | Example                                                       |
| ---------------------- | -------------------------------------- | ------------------------------------------------------------- |
| Proposal title         | Active verb + specific objective       | "Building Pressurised Habitats for the First Mars Crews"      |
| Funding status         | Percentage + fact                      | "73% funded. Next milestone: engine static fire"              |
| CTA button             | Direct action, no "click here"         | "Back this mission"                                           |
| Contribution confirmed | Precise amount + mission reference     | "Your $250 is locked in. You're backing Mission MMF-2026-0147." |
| Payment failure        | Helpful, not alarming                  | "We couldn't process this right now. Your data is safe. Try again." |
| Empty milestones       | Progress framing                       | "Milestones will appear here as the team hits targets."       |

### 6.3 Forbidden Language

| Pattern                                                  | Reason                                          | Use Instead                                         |
| -------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| "Click here", "Click to learn more"                      | Non-descriptive, inaccessible                   | "View mission details", "Read the mission plan"     |
| "Exciting opportunity"                                   | Sounds like financial spam                      | A specific claim                                    |
| "Only N days left, don't miss out", any fake scarcity    | Rebrand rule: no urgency pressure               | State the closing date plainly                      |
| "Synergistic", "disruptive", "revolutionary"             | Corporate buzzwords                             | Plain, concrete language                            |
| "invest", "investing", "investor", "investment"          | Regulatory risk: contributions are not equity   | "donate", "back", "pledge", "backer", "supporter"   |
| "Guaranteed returns"                                     | Illegal in most jurisdictions                   | Never imply financial returns                       |
| Emoji-heavy copy, mascots                                | Kickstarter look                                | Plain text                                          |
| Passive voice in CTAs                                    | Weakens the action                              | "Back this mission"                                 |

---

## 7. Accessibility

Measured contrast for the values above (WCAG relative luminance):

| Pairing                                       | Ratio  | Requirement          |
| --------------------------------------------- | ------ | -------------------- |
| `--starlight` on `--night` / `--console`      | 15.9 / 14.6 | AAA body text   |
| `--blue-grey` on `--night` / `--console`      | 7.8 / 7.2   | AAA body text   |
| `--amber` on `--night` / `--console`          | 9.2 / 8.4   | AAA, also for text |
| `--night` on `--amber` (button text)          | 9.2    | AAA                  |
| `--teal` on `--night` / `--console`           | 8.1 / 7.5   | AAA             |
| `--brick` on `--night` / `--console` / `--console-high` | 6.0 / 5.5 / 4.9 | AA text on every surface |
| `--slate-edge` on `--night` / `--console`     | 3.5 / 3.2   | 3:1 non-text controls |

- **Colour is never the only signal.** Errors, warnings and verified states each carry an icon and a text label.
- **Focus** is a 2px amber outline with 2px offset on every focusable element. Never suppress it with `outline: none` without an equivalent.
- **Reduced motion**: see §3.6.
- **Screen readers**: progress bars carry `aria-valuenow/min/max` and a label with the proposal name and percentage. Financial amounts include the currency ("$3,108 US dollars raised"). Icon-only buttons need `aria-label`.
- `--hairline` is decorative (1.6:1) and must not be the only boundary of an interactive control. Use `--slate-edge`.

---

## 8. Dark Mode

Mars Mission Fund is dark only. There is no light mode in the core application. Email, PDF and legal contexts that need a light background must define a theme-specific semantic token map rather than hardcoding values.

---

## 9. Misuse

Flag these in code review.

| Violation                                                          | Why It Matters                                     |
| ------------------------------------------------------------------ | -------------------------------------------------- |
| Referencing Tier 1 identity tokens in component code               | Breaks the semantic abstraction                    |
| Amber for errors or warnings                                       | Amber means in motion or the main action           |
| Teal for anything that is not done or verified                     | Dilutes "verified"                                 |
| Brick red outside errors and destructive actions                   | Red means stop                                     |
| Mono font for body copy, or display font for body or labels        | Mono is data only, display is headlines only       |
| Starfields, nebula wallpapers, neon glow, glassmorphism, purple-blue gradients | The rejected NFT and crypto look  |
| Confetti, countdown banners, pop-up celebrations                   | The rejected game and hype look                    |
| Pastel rounded cards, mascots, reward-tier tables                  | The rejected Kickstarter look                      |
| Parallax or animated hero video                                    | Makes Priya wait for the facts                     |
| Decorative or AI-generated imagery                                 | Real photography, or the data                      |
| Custom colours, fonts, sizes or timings outside the token system   | Unmaintainable                                     |
| Animations ignoring `prefers-reduced-motion`                       | WCAG 2.3.3                                         |
| Multiple primary CTAs per viewport                                 | Dilutes the action hierarchy                       |

---

## Open Items

- **Logo**: the v1.3 coin mark was not part of this rebrand interview. Logo, favicon and clear-space rules are undefined and need their own pass.
- **Specimen**: `specs/standards/mars-mission-fund-brand.html` still shows the v1.3 identity and is superseded by this document.
- **Existing UI**: the client still uses the v1.3 tokens. Moving it to these tokens is implementation work, not done by this spec.
- **Hex values** were proposed from the interview descriptions and contrast-checked, but have not been seen on screen yet. Review them in the running app.

---

## Change Log

| Date       | Version | Summary                                                                                                                                                                       |
| ---------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| March 2026 | 1.0–1.3 | Original Launchfire identity (Bebas Neue, DM Sans, Space Mono, 8–24px radii, spring and ambient motion). See git history.                                                      |
| 2026-10-06 | 2.0     | Full rebrand from a blank page: night-sky base, amber accent, teal verified state, brick error red; Archivo / IBM Plex Sans / IBM Plex Mono; 4px radius; functional-only motion; imagery and misuse rules. |
