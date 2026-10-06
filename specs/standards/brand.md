# Brand Application Standard

> **Spec ID**: L2-001
> **Version**: 1.3
> **Status**: Approved
> **Rate of Change**: Monthly / standard reviews
> **Depends On**: L1-001 (Product Vision & Mission), Brand Guidelines (mars-mission-fund-brand.html)
> **Depended On By**: L3-005 (tech/frontend.md), L4-001 (domain/account.md), L4-002 (domain/campaign.md), L4-003 (domain/donor.md)

---

## Purpose

> **Local demo scope**: The token architecture, semantic mappings, and component specifications are **real** — they drive the local demo's UI implementation. Voice-in-product patterns guide all user-facing copy. Accessibility requirements apply fully. Logo placement and dark mode exception contexts (email, PDF) are theatre.

This document defines how the Mars Mission Fund brand system is applied within the product. It translates the brand guidelines (the source of truth for visual identity) into actionable rules for product design and implementation.

**This document does not duplicate the brand guidelines.** It specifies the two-tier token architecture, component-to-token mappings, voice-in-product patterns, and accessibility requirements. For design token values, logo usage rules, and visual specimens, reference the brand guidelines directly.

**Source of truth for brand identity**: `mars-mission-fund-brand.html`

---

## Token Architecture

The product uses a **two-tier token system**. This is the most important architectural decision in this spec.

**Tier 1 — Identity Tokens**: Named for the brand vocabulary. Defined in the brand guidelines. These are the raw palette — colours, fonts, timing curves. They are **never referenced directly in component code**.

**Tier 2 — Semantic Tokens**: Named for purpose and intent. Defined in this spec. These map to identity tokens and are the **only layer components are allowed to consume**.

```text
Component code → Semantic token → Identity token → Raw value

Button background → --color-action-primary → --launchfire → #FF5C1A
```

**Why two tiers?**

- If the brand evolves and "primary action" shifts from Launchfire to a different colour, one mapping changes — not every component.
- Agents building UI reach for the semantic name matching their intent, not the brand vocabulary.
- Misuse becomes structurally impossible: components cannot reference `--launchfire` directly, so a developer cannot accidentally use the primary action colour for an error state.

**Rule**: Component code, stylesheets, and UI implementations must **only** reference Tier 2 semantic tokens. Direct references to Tier 1 identity tokens in component code are a spec violation.

---

## 1. Tier 1 — Identity Tokens (Brand Reference)

These tokens are defined in the brand guidelines and reproduced here as a reference for the semantic mapping in Section 2. They form the brand's visual vocabulary. Do not reference these in component code.

### 1.1 Colour Identity Tokens

#### Deep Space — Foundation

| Identity Token | Value     | Brand Role                          |
| -------------- | --------- | ----------------------------------- |
| `--void`       | `#060A14` | Deepest space, maximum contrast     |
| `--deep-space` | `#0B1628` | Dark foundation, secondary depth    |
| `--nebula`     | `#0E2040` | Elevated dark, atmospheric depth    |
| `--orbit`      | `#1A3A6E` | Mid-depth blue, structural emphasis |

#### Launch Fire — Energy

| Identity Token | Value     | Brand Role                           |
| -------------- | --------- | ------------------------------------ |
| `--launchfire` | `#FF5C1A` | Primary brand energy, ignition point |
| `--ignition`   | `#FF8C42` | Secondary warmth, sustained energy   |
| `--afterburn`  | `#FFB347` | Trailing warmth, gradient endpoint   |
| `--red-planet` | `#C1440E` | Mars surface, deep warmth            |

#### Metallic Silver — Trust & Finish

| Identity Token | Value     | Brand Role                        |
| -------------- | --------- | --------------------------------- |
| `--chrome`     | `#E8EDF5` | Brightest metallic, primary light |
| `--silver`     | `#C8D0DC` | Mid metallic, secondary light     |
| `--stardust`   | `#8A96A8` | Muted metallic, tertiary light    |
| `--white`      | `#F5F8FF` | Near-white, maximum light         |

#### Mission Outcomes

| Identity Token   | Value     | Brand Role                            |
| ---------------- | --------- | ------------------------------------- |
| `--success`      | `#2FE8A2` | Mission complete green                |
| `--success-deep` | `#1AB878` | Deep success green, gradient endpoint |
| `--signal-blue`  | `#5B8FD8` | Communication indicator blue          |

### 1.2 Gradient Identity Tokens

| Identity Token           | Value                                                                         |
| ------------------------ | ----------------------------------------------------------------------------- |
| `--grad-launch-sequence` | `linear-gradient(135deg, #FF5C1A, #FF8C42, #FFB347)`                          |
| `--grad-deep-field`      | `linear-gradient(135deg, #060A14, #0E2040, #1A3A6E)`                          |
| `--grad-metallic-sheen`  | `linear-gradient(135deg, #E8EDF5, #C8D0DC, #8A96A8)`                          |
| `--grad-mars-atmosphere` | `linear-gradient(135deg, #C1440E, #FF5C1A, #FF8C42)`                          |
| `--grad-night-launch`    | `linear-gradient(135deg, #060A14 0%, #0B1628 50%, rgba(255,92,26,0.15) 100%)` |
| `--grad-mission-success` | `linear-gradient(135deg, #0B1628, rgba(47,232,162,0.2), #0B1628)`             |

### 1.3 Typography Identity Tokens

| Identity Token   | Value                  | Brand Role                  |
| ---------------- | ---------------------- | --------------------------- |
| `--font-display` | Bebas Neue, sans-serif | Commanding display presence |
| `--font-body`    | DM Sans, sans-serif    | Intelligent readability     |
| `--font-data`    | Space Mono, monospace  | Technical precision         |

### 1.4 Motion Identity Tokens

| Identity Token      | Value                               |
| ------------------- | ----------------------------------- |
| `--duration-fast`   | 150ms                               |
| `--duration-base`   | 300ms                               |
| `--duration-medium` | 500ms                               |
| `--duration-slow`   | 800ms                               |
| `--easing-out`      | `cubic-bezier(0.25, 1, 0.5, 1)`     |
| `--easing-spring`   | `cubic-bezier(0.34, 1.56, 0.64, 1)` |

### 1.5 Radius Identity Tokens

| Identity Token  | Value |
| --------------- | ----- |
| `--radius-sm`   | 8px   |
| `--radius-md`   | 12px  |
| `--radius-lg`   | 16px  |
| `--radius-xl`   | 20px  |
| `--radius-2xl`  | 24px  |
| `--radius-full` | 100px |

---

## 2. Tier 2 — Semantic Tokens (Component Consumption Layer)

These are the only tokens components may reference. Each maps to a Tier 1 identity token. When the brand evolves, these mappings change — component code does not.

**Opacity convention**: Where a semantic token derives from an identity token at reduced opacity, it is written as `{identity-token} / {opacity%}` (e.g., `--launchfire / 35%`). At build time this resolves to the corresponding `rgba()` value.

### 2.1 Colour — Actions

| Semantic Token                    | Maps To                     | Usage                                      |
| --------------------------------- | --------------------------- | ------------------------------------------ |
| `--color-action-primary`          | `--launchfire`              | Primary CTA backgrounds, interactive links |
| `--color-action-primary-hover`    | `--ignition`                | Hover/focus state on primary actions       |
| `--color-action-primary-text`     | `--white`                   | Text on primary action backgrounds         |
| `--color-action-primary-shadow`   | `--launchfire / 35%`        | Drop shadow on primary CTAs                |
| `--color-action-secondary-bg`     | `--white / 6%`              | Secondary button background                |
| `--color-action-secondary-text`   | `--silver`                  | Secondary button text                      |
| `--color-action-secondary-border` | `--white / 12%`             | Secondary button border                    |
| `--color-action-ghost-text`       | `--ignition`                | Ghost button text                          |
| `--color-action-ghost-border`     | `--launchfire / 30%`        | Ghost button border                        |
| `--color-action-disabled`         | `--stardust` at 50% opacity | Inactive buttons, disabled inputs          |

### 2.2 Colour — Status

| Semantic Token                  | Maps To              | Usage                                                    |
| ------------------------------- | -------------------- | -------------------------------------------------------- |
| `--color-status-success`        | `--success`          | Funded, milestone complete, transaction confirmed        |
| `--color-status-success-bg`     | `--success / 12%`    | Success badge/card background                            |
| `--color-status-success-border` | `--success / 20%`    | Success badge/card border                                |
| `--color-status-error`          | `--red-planet`       | Validation errors, failed transactions, campaign failure |
| `--color-status-warning`        | `--afterburn`        | Deadline approaching, campaign ending soon               |
| `--color-status-info`           | `--orbit`            | Neutral informational badges, help text                  |
| `--color-status-active`         | `--launchfire`       | Live campaign indicator dot                              |
| `--color-status-active-bg`      | `--launchfire / 12%` | Active badge background                                  |
| `--color-status-active-border`  | `--launchfire / 20%` | Active badge border                                      |
| `--color-status-new`            | `--signal-blue`      | New mission indicator dot                                |
| `--color-status-new-bg`         | `--orbit / 40%`      | New mission badge background                             |
| `--color-status-new-border`     | `--orbit / 60%`      | New mission badge border                                 |

### 2.3 Colour — Surfaces

| Semantic Token        | Maps To        | Usage                                               |
| --------------------- | -------------- | --------------------------------------------------- |
| `--color-bg-page`     | `--void`       | Primary page background                             |
| `--color-bg-surface`  | `--deep-space` | Cards, modals, secondary panels                     |
| `--color-bg-elevated` | `--nebula`     | Hover states on cards, dropdowns, elevated surfaces |
| `--color-bg-overlay`  | `--void / 90%` | Modal overlays, navigation backdrop                 |
| `--color-bg-input`    | `--white / 4%` | Form input backgrounds                              |
| `--color-bg-accent`   | `--orbit`      | Table headers, emphasis blocks                      |

### 2.4 Colour — Text

| Semantic Token           | Maps To        | Usage                                                                   |
| ------------------------ | -------------- | ----------------------------------------------------------------------- |
| `--color-text-primary`   | `--chrome`     | Headlines, primary content on dark backgrounds                          |
| `--color-text-secondary` | `--silver`     | Body text, descriptions, secondary content                              |
| `--color-text-tertiary`  | `--stardust`   | Metadata, timestamps, placeholders, labels                              |
| `--color-text-accent`    | `--launchfire` | Section labels, highlighted links (large text only — see Accessibility) |
| `--color-text-on-action` | `--white`      | Text on primary action backgrounds                                      |
| `--color-text-success`   | `--success`    | Positive financial indicators, funded text                              |
| `--color-text-error`     | `--red-planet` | Error messages, failed transaction text                                 |
| `--color-text-warning`   | `--afterburn`  | Urgency indicators, deadline text                                       |

**Rule**: Text hierarchy must follow `--color-text-primary` then `--color-text-secondary` then `--color-text-tertiary`. Never use tertiary for primary content or primary for metadata.

### 2.5 Colour — Borders & Dividers

| Semantic Token            | Maps To         | Usage                                       |
| ------------------------- | --------------- | ------------------------------------------- |
| `--color-border-subtle`   | `--white / 6%`  | Card borders, section dividers              |
| `--color-border-emphasis` | `--orbit`       | Table borders, form input borders on focus  |
| `--color-border-input`    | `--white / 10%` | Default form input borders                  |
| `--color-border-accent`   | `--launchfire`  | Top accent bars on cards, active navigation |

### 2.6 Colour — Progress & Data Visualisation

| Semantic Token               | Maps To                                             | Usage                         |
| ---------------------------- | --------------------------------------------------- | ----------------------------- |
| `--color-progress-fill`      | `linear-gradient(90deg, --launchfire, --afterburn)` | In-progress campaign bar fill |
| `--color-progress-complete`  | `linear-gradient(90deg, --success, --success-deep)` | Completed campaign bar fill   |
| `--color-progress-track`     | `--white / 6%`                                      | Progress bar background track |
| `--color-progress-indicator` | `--afterburn`                                       | Endpoint dot on progress bars |
| `--color-data-positive`      | `--success`                                         | Upward trend, gain indicators |
| `--color-data-neutral`       | `--stardust`                                        | Stable/neutral data points    |

### 2.7 Gradients — Semantic

| Semantic Token              | Maps To                                           | Usage                             |
| --------------------------- | ------------------------------------------------- | --------------------------------- |
| `--gradient-action-primary` | `--grad-launch-sequence`                          | Primary CTA button backgrounds    |
| `--gradient-surface-card`   | `--grad-deep-field`                               | Card gradient backgrounds         |
| `--gradient-surface-stat`   | `linear-gradient(135deg, --nebula, --deep-space)` | Stat card backgrounds             |
| `--gradient-hero`           | `--grad-night-launch`                             | Landing page hero sections        |
| `--gradient-campaign-hero`  | `--grad-mars-atmosphere`                          | Campaign hero backgrounds         |
| `--gradient-celebration`    | `--grad-mission-success`                          | Funded campaign celebration state |
| `--gradient-achievement`    | `--grad-metallic-sheen`                           | Achievement badges, coin renders  |

### 2.8 Typography — Semantic

**Split-property token convention**: Each type-scale entry in this table expands into five property-specific CSS variables: `--type-*-size`, `--type-*-weight`, `--type-*-leading`, `--type-*-spacing`, and `--type-*-family`. Components apply each property individually rather than relying on a CSS shorthand. The `-family` tokens map each type-scale entry to the relevant brand font-family token.

| Semantic Token              | `-family` Token                    | Font Family      | Size | Weight | Additional                                      |
| --------------------------- | ---------------------------------- | ---------------- | ---- | ------ | ----------------------------------------------- |
| `--type-hero`               | `--type-hero-family`               | `--font-display` | 96px | 400    | letter-spacing: 0.03em. Landing page hero only. |
| `--type-page-title`         | `--type-page-title-family`         | `--font-display` | 56px | 400    | letter-spacing: 0.04em                          |
| `--type-section-heading`    | `--type-section-heading-family`    | `--font-display` | 40px | 400    | letter-spacing: 0.04em                          |
| `--type-card-title`         | `--type-card-title-family`         | `--font-body`    | 24px | 700    |                                                 |
| `--type-body`               | `--type-body-family`               | `--font-body`    | 16px | 400    | line-height: 1.7                                |
| `--type-body-small`         | `--type-body-small-family`         | `--font-body`    | 13px | 400    | line-height: 1.7                                |
| `--type-button`             | `--type-button-family`             | `--font-body`    | 14px | 600    | letter-spacing: 0.01em                          |
| `--type-label`              | `--type-label-family`              | `--font-data`    | 11px | 400    | letter-spacing: 0.2em, uppercase                |
| `--type-section-label`      | `--type-section-label-family`      | `--font-data`    | 11px | 400    | letter-spacing: 0.3em, uppercase                |
| `--type-data`               | `--type-data-family`               | `--font-data`    | 14px | 400    | Mission codes, financial figures, timestamps    |
| `--type-stat-value`         | `--type-stat-value-family`         | `--font-display` | 40px | 400    | letter-spacing: 0.03em                          |
| `--type-stat-value-compact` | `--type-stat-value-compact-family` | `--font-display` | 28px | 400    | letter-spacing: 0.05em                          |
| `--type-input-label`        | `--type-input-label-family`        | `--font-data`    | 12px | 600    | letter-spacing: 0.05em, uppercase               |

**Rule**: The type scale is a closed set. No intermediate sizes or custom font assignments. If a design requires a size not in this scale, it must be added to this spec before implementation.

**Rule**: `--font-display` (Bebas Neue) is always uppercase. Never set it in mixed case or lowercase.

> **Named Exception — Hero H1 Responsive Sizing**: The `--type-hero-size` token defines the base desktop size as 96px, but the hero H1 uses an approved responsive sizing ladder that overrides `--type-hero-size` at breakpoints: 32px (mobile baseline) → 48px (sm, 640px+) → 72px (lg, 1024px+) → 96px (xl, 1280px+). This breakpoint ladder is implemented via media query overrides and does not introduce new type-scale entries. It is the only approved responsive override of a fixed type-scale token.

### 2.9 Motion — Semantic

| Semantic Token            | Duration            | Easing                | Usage                                             |
| ------------------------- | ------------------- | --------------------- | ------------------------------------------------- |
| `--motion-enter`          | `--duration-base`   | `--easing-out`        | Default element entry, card reveals               |
| `--motion-enter-emphasis` | `--duration-medium` | `--easing-spring`     | CTA appearing, modal entry, success confirmations |
| `--motion-hover`          | `--duration-fast`   | `--easing-out`        | Hover states, icon transitions, toggle switches   |
| `--motion-panel`          | `--duration-medium` | `--easing-out`        | Modals, drawers, panels opening/closing           |
| `--motion-page`           | `--duration-slow`   | `--easing-out`        | Page transitions, celebration animations          |
| `--motion-ambient`        | 2-4s                | ease-in-out, infinite | Decorative float, hero background elements        |
| `--motion-urgency`        | 1.5s                | ease-in-out, infinite | Live countdowns, deadline pulse glow              |

**Rule**: All animations must use these semantic tokens. No custom timing or easing values. All animation must be disableable via `prefers-reduced-motion` — see Accessibility section.

### 2.10 Layout — Semantic

| Semantic Token        | Maps To         | Usage                         |
| --------------------- | --------------- | ----------------------------- |
| `--radius-button`     | `--radius-full` | All button variants           |
| `--radius-badge`      | `--radius-sm`   | Status badges, tags           |
| `--radius-input`      | `--radius-md`   | Form inputs                   |
| `--radius-card`       | `--radius-xl`   | Standard UI cards             |
| `--radius-card-large` | `--radius-2xl`  | Feature cards, logo cards     |
| `--radius-stat`       | `--radius-lg`   | Stat blocks, swatches         |
| `--radius-progress`   | `--radius-full` | Progress bar tracks and fills |

---

## 3. Component Specifications

This section defines how semantic tokens apply to specific product components. These mappings are mandatory — agents implementing UI must follow them exactly.

### 3.1 Buttons

| Variant   | Background                    | Text                            | Border                            | Shadow                          | Usage                              |
| --------- | ----------------------------- | ------------------------------- | --------------------------------- | ------------------------------- | ---------------------------------- |
| Primary   | `--gradient-action-primary`   | `--color-action-primary-text`   | none                              | `--color-action-primary-shadow` | Single primary action per viewport |
| Secondary | `--color-action-secondary-bg` | `--color-action-secondary-text` | `--color-action-secondary-border` | none                            | Alternative actions                |
| Ghost     | transparent                   | `--color-action-ghost-text`     | `--color-action-ghost-border`     | none                            | Tertiary actions                   |
| Success   | `--color-status-success-bg`   | `--color-status-success`        | `--color-status-success-border`   | none                            | Post-success state                 |

All buttons: `--radius-button`, `--type-button`, padding 12px 24px.

**Rule**: Only one primary CTA per viewport.

### 3.2 Cards

| Element        | Semantic Token                                                   |
| -------------- | ---------------------------------------------------------------- |
| Background     | `--color-bg-surface`                                             |
| Border         | `--color-border-subtle`                                          |
| Border radius  | `--radius-card`                                                  |
| Top accent bar | `2px --color-border-accent` gradient to `--color-status-warning` |
| Padding        | 32px                                                             |

### 3.3 Progress Bars

| Element            | Semantic Token                                                    |
| ------------------ | ----------------------------------------------------------------- |
| Track background   | `--color-progress-track`                                          |
| Fill (in progress) | `--color-progress-fill`                                           |
| Fill (complete)    | `--color-progress-complete`                                       |
| Track radius       | `--radius-progress`                                               |
| Height             | 8px                                                               |
| Endpoint indicator | 14px circle, `--color-progress-indicator`, `box-shadow: 0 0 12px` |

### 3.4 Stat Cards

| Element             | Semantic Token                                          |
| ------------------- | ------------------------------------------------------- |
| Background          | `--gradient-surface-stat`                               |
| Border              | `--color-border-subtle`                                 |
| Border radius       | `--radius-stat`                                         |
| Label               | `--type-body-small` weight 500, `--color-text-tertiary` |
| Value               | `--type-stat-value`, `--color-text-primary`             |
| Sub text (positive) | `--type-body-small`, `--color-data-positive`            |
| Sub text (neutral)  | `--type-body-small`, `--color-data-neutral`             |

### 3.5 Badges

| Variant       | Background                  | Text                           | Border                          | Dot                      |
| ------------- | --------------------------- | ------------------------------ | ------------------------------- | ------------------------ |
| Funded        | `--color-status-success-bg` | `--color-status-success`       | `--color-status-success-border` | `--color-status-success` |
| Live / Active | `--color-status-active-bg`  | `--color-action-primary-hover` | `--color-status-active-border`  | `--color-status-active`  |
| New Mission   | `--color-status-new-bg`     | `--color-text-secondary`       | `--color-status-new-border`     | `--color-status-new`     |

All badges: `--radius-badge`, `--type-button` at 12px, padding 6px 12px, 6px dot indicator.

### 3.6 Form Inputs

| Element          | Semantic Token                                 |
| ---------------- | ---------------------------------------------- |
| Background       | `--color-bg-input`                             |
| Border (default) | `--color-border-input`                         |
| Border (focus)   | `--color-border-emphasis`                      |
| Border radius    | `--radius-input`                               |
| Text             | `--color-text-primary`                         |
| Placeholder      | `--color-text-tertiary`                        |
| Label            | `--type-input-label`, `--color-text-tertiary`  |
| Suffix/unit      | `--type-data` at 12px, `--color-text-tertiary` |
| Padding          | 14px 48px 14px 16px                            |

### 3.7 Section Labels

| Element       | Semantic Token                           |
| ------------- | ---------------------------------------- |
| Font          | `--type-section-label`                   |
| Colour        | `--color-text-accent`                    |
| Format        | "NUMBER — TITLE" (e.g., "01 — Identity") |
| Margin bottom | 16px                                     |

---

## 4. Voice-in-Product

The brand guidelines define the overall voice. This section specifies how that voice is applied to specific product surfaces. Agents generating copy or UI text must follow these patterns.

### 4.1 Brand Personality Axes (Product Calibration)

| Axis                   | Position              | Product Implication                                                                                 |
| ---------------------- | --------------------- | --------------------------------------------------------------------------------------------------- |
| Playful / Serious      | 40% toward playful    | Use mission metaphors and energising language, but never joke about money or risk                   |
| Technical / Accessible | 65% toward accessible | Use precise financial and technical terms where required, but always explain in context             |
| Cautious / Bold        | 80% toward bold       | Lead with confidence and urgency, but every financial claim must be accurate                        |
| Formal / Human         | 70% toward human      | Direct, warm, first-person plural ("we", "your"). Never corporate or legalistic in user-facing copy |

### 4.2 Copy Patterns by Surface

#### Campaign Pages

| Element             | Pattern                          | Example                                                  |
| ------------------- | -------------------------------- | -------------------------------------------------------- |
| Campaign title      | Active verb + specific objective | "Building Pressurised Habitats for the First Mars Crews" |
| Funding status      | Percentage + time urgency        | "73% funded — 18 days left to join the mission"          |
| CTA button          | Direct action, no "click here"   | "Back This Mission"                                      |
| Contribution prompt | Personal impact framing          | "Every $50 moves the launch window closer"               |

#### Financial Confirmations

| Element                | Pattern                            | Example                                                             |
| ---------------------- | ---------------------------------- | ------------------------------------------------------------------- |
| Contribution confirmed | Precise amount + mission reference | "Your $250 is locked in. You're backing Mission MMF-2026-0147."     |
| Escrow notification    | Status + reassurance               | "Funds secured in escrow. Release on milestone verification."       |
| Disbursement notice    | Action + transparency              | "Milestone 2 verified. $840,000 released to Project Habitat Alpha." |

#### Error States

| Element          | Pattern                | Example                                                                               |
| ---------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| Payment failure  | Helpful, not alarming  | "We couldn't process this right now. Your data is safe — let's try again."            |
| Validation error | Specific, actionable   | "Mission code format: MMF-2026-XXXX. Check the last four digits."                     |
| System error     | Honest, with next step | "Something went wrong on our end. We're looking into it. Try again in a few minutes." |

#### Empty States

| Element              | Pattern                 | Example                                                           |
| -------------------- | ----------------------- | ----------------------------------------------------------------- |
| No contributions yet | Invitation, not absence | "Your mission log is empty. Find a mission to back."              |
| No search results    | Redirect, not dead end  | "No missions match that search. Browse active campaigns instead." |
| No milestones        | Progress framing        | "Milestones will appear here as the team hits targets."           |

### 4.3 Forbidden Language Patterns

Never use the following in any user-facing product copy:

| Pattern                                      | Reason                                         | Use Instead                                                        |
| -------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| "Click here"                                 | Non-descriptive, inaccessible                  | Descriptive link text: "View mission details"                      |
| "Exciting opportunity"                       | Sounds like financial spam                     | Specific claim: "Funding closes in 18 days"                        |
| "Synergistic", "disruptive", "revolutionary" | Corporate buzzwords violate brand voice        | Plain language: specific, concrete descriptions                    |
| "invest"                                     | Regulatory risk — contributions are not equity | "donate", "contribute", "back", "pledge"                           |
| "investing"                                  | Regulatory risk — contributions are not equity | "donating", "contributing", "backing", "pledging"                  |
| "investor"                                   | Regulatory risk — contributions are not equity | "donor", "contributor", "backer", "supporter"                      |
| "investment"                                 | Regulatory risk — contributions are not equity | "donation", "contribution", "backing", "pledge"                    |
| "Guaranteed returns"                         | Illegal in most jurisdictions                  | Never imply financial returns                                      |
| "Click to learn more"                        | Passive, vague                                 | Action-specific: "Read the mission plan"                           |
| Passive voice in CTAs                        | Weakens urgency                                | Active voice: "Back this mission" not "This mission can be backed" |

---

## 5. Accessibility Requirements

The dark-first UI and high-contrast accent palette create specific accessibility challenges that must be addressed in every component.

### 5.1 Colour Contrast

| Text Context               | Minimum Ratio    | Token Pairing                                           |
| -------------------------- | ---------------- | ------------------------------------------------------- |
| Primary text on page bg    | 7:1 (AAA)        | `--color-text-primary` on `--color-bg-page` = 14.8:1    |
| Primary text on surface bg | 7:1 (AAA)        | `--color-text-primary` on `--color-bg-surface` = 12.6:1 |
| Secondary text on page bg  | 4.5:1 (AA)       | `--color-text-secondary` on `--color-bg-page` = 10.7:1  |
| Tertiary text on page bg   | 4.5:1 (AA)       | `--color-text-tertiary` on `--color-bg-page` = 5.4:1    |
| Accent text on page bg     | 4.5:1 (AA large) | `--color-text-accent` on `--color-bg-page` = 4.8:1      |
| Success text on page bg    | 4.5:1 (AA)       | `--color-text-success` on `--color-bg-page` = 10.1:1    |

**Rule**: `--color-text-accent` must only be used at 18px+ bold or 24px+ regular (WCAG large text). For smaller accent text, use `--color-action-primary-hover` which provides higher contrast.

**Rule**: `--color-text-tertiary` passes AA but fails AAA. Approved for metadata only — never for body text or interactive element labels.

### 5.2 Motion Accessibility

**Rule**: All animations must respect `prefers-reduced-motion: reduce`. When active:

| Semantic Token            | Normal Behaviour | Reduced Motion               |
| ------------------------- | ---------------- | ---------------------------- |
| `--motion-enter`          | Slide-in settle  | Instant appearance           |
| `--motion-enter-emphasis` | Overshoot bounce | Fade-in at `--duration-fast` |
| `--motion-ambient`        | Continuous float | Static position              |
| `--motion-urgency`        | Pulse glow       | Static glow at 50%           |
| Progress bar fill         | Animated fill    | Instant fill                 |

### 5.3 Focus States

All interactive elements must have a visible focus indicator meeting WCAG 2.1 AA:

| Element             | Focus Style                                                                        |
| ------------------- | ---------------------------------------------------------------------------------- |
| Buttons             | `outline: 2px solid --color-action-primary-hover; outline-offset: 2px`             |
| Form inputs         | `border-color: --color-action-primary; box-shadow: 0 0 0 3px rgba(255,92,26,0.25)` |
| Links               | `outline: 2px solid --color-action-primary-hover; outline-offset: 2px`             |
| Cards (interactive) | `border-color: --color-action-primary; box-shadow: 0 0 0 3px rgba(255,92,26,0.15)` |

**Rule**: Focus styles must never be suppressed with `outline: none` without an equivalent visible alternative.

### 5.4 Screen Reader Requirements

| Context           | Requirement                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| Progress bars     | `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` with campaign name and percentage |
| Badge indicators  | Dots are decorative (`aria-hidden="true"`); status via text                                       |
| Stat cards        | Values and labels associated via `aria-labelledby`                                                |
| Button icons      | Decorative: `aria-hidden="true"`. Icon-only: `aria-label` required                                |
| Financial amounts | Screen reader includes currency: "$3,108,400 US dollars raised"                                   |

---

## 6. Logo Usage in Product

The brand guidelines are the source of truth for logo specifications. This section defines product-specific usage rules only.

### 6.1 Logo Placement

| Context              | Variant                                 | Size                       |
| -------------------- | --------------------------------------- | -------------------------- |
| Navigation bar       | Coin icon mark only                     | 32px height                |
| Login / registration | Full vertical lockup (dark)             | 120px coin, full wordmark  |
| Footer               | Horizontal lockup                       | 72px coin, inline wordmark |
| Favicon              | Coin icon, simplified (no orbital ring) | 16px                       |
| App icon             | Coin on gradient background             | Per platform guidelines    |
| Email header         | Horizontal lockup                       | 48px coin height           |

### 6.2 Clear Space in Product

Minimum clear space around the logo equals the height of the "M" in the wordmark. In constrained navigation contexts, the coin icon mark at 32px requires minimum 8px clear space on all sides.

---

## 7. Dark Mode / Light Mode

### 7.1 Position

Mars Mission Fund is a dark-first product. The deep-space palette is the primary UI context. There is no light mode for the core application.

### 7.2 Exceptions

| Context             | Treatment                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| Email templates     | Light background for compatibility. `--color-bg-accent` headings, `--color-bg-page` body text on white.   |
| PDF exports / print | White background. `--color-bg-accent` headings, `--color-bg-page` body, `--color-action-primary` accents. |
| Embedded widgets    | Both dark and light variants. Light uses `--color-text-primary` background, `--color-bg-accent` text.     |
| Legal / compliance  | Light background permitted if required by legal review.                                                   |

**Note**: These exception contexts invert the standard dark-first token mappings. When implemented as components, they should define theme-specific semantic token overrides (e.g., a `light` theme map) rather than hardcoding values.

---

## 8. Brand Misuse in Product

The following are violations of this standard. Agents and developers must flag these in code review.

| Violation                                                  | Why It Matters                                                              |
| ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| Referencing Tier 1 identity tokens in component code       | Breaks the semantic abstraction; brand evolution requires component changes |
| Using `--color-action-primary` for error states            | Conflates actions with errors; confuses clickability                        |
| Using `--color-status-success` for non-financial positives | Dilutes "funded" and "complete" meaning                                     |
| `--font-display` in body text or form labels               | Display-only font; unreadable at small sizes                                |
| Custom colours outside the token system                    | Breaks consistency, unmaintainable                                          |
| Animations ignoring `prefers-reduced-motion`               | WCAG 2.1 SC 2.3.3 violation                                                 |
| Multiple primary CTAs per viewport                         | Dilutes action hierarchy                                                    |
| Corporate buzzwords in copy                                | Brand voice violation; see Forbidden Language Patterns                      |
| Suppressed focus indicators                                | WCAG 2.1 SC 2.4.7 violation                                                 |

---

## Change Log

| Date       | Version | Author | Summary                                                                                                                                                                                                                                                                                                  |
| ---------- | ------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| March 2026 | 1.0     | —      | Initial draft. Combined identity and semantic tokens.                                                                                                                                                                                                                                                    |
| March 2026 | 1.1     | —      | Restructured to two-tier token architecture. Identity tokens (Tier 1) for brand reference only; semantic tokens (Tier 2) as sole component consumption layer. Added semantic mappings for all colour, typography, motion, and layout tokens. Tier 1 direct reference added as misuse violation.          |
| March 2026 | 1.2     | —      | Closed token chain gaps: replaced raw rgba/hex values in Tier 2 with identity token derivations using `{token} / {opacity%}` convention. Added `--success-deep` and `--signal-blue` to Tier 1. Removed unused `--crater`. Section 7.2 now references semantic tokens with note on light-theme overrides. |
| 2026-03-10 | 1.3     | —      | §2.8: documented split-property token convention (five suffixes per scale entry: `-size`, `-weight`, `-leading`, `-spacing`, `-family`); added `-family` column to typography table with all 13 `--type-*-family` tokens; added Named Exception block for hero H1 responsive sizing ladder (32px→48px→72px→96px). §4.3: expanded "invest" forbidden-word table from one row to four, covering "invest", "investing", "investor", "investment" with approved alternatives. |

---

*This standard governs brand application in the Mars Mission Fund product. For the visual identity source of truth (logo specimens, colour swatches, type specimens, motion demos), reference the brand guidelines: `mars-mission-fund-brand.html`.*
