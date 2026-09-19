# Frontend Standards

> **Spec ID**: L3-005
> **Version**: 0.5
> **Status**: Approved
> **Rate of Change**: Sprint-level / tech decisions
> **Depends On**: L2-001 (Brand Application Standard), L2-002 (Engineering Standard), L3-001 (Architecture)
> **Depended On By**: L4-001 (domain/account.md), L4-002 (domain/proposal.md), L4-003 (domain/donor.md)

---

## Purpose

> **Local demo scope**: React component architecture, semantic token consumption, accessibility standards (WCAG 2.1 AA), and the testing strategy are **real** — they drive the local demo's frontend implementation. Lighthouse CI enforcement, bundle size budgets, visual regression testing, and SSR/SSG decisions are theatre until the application is deployed beyond local.

This spec governs the frontend architecture, component library standards, performance requirements, accessibility implementation, responsive design strategy, and browser support for the Mars Mission Fund platform.

It **implements** the brand token system defined in the [Brand Application Standard](L2-001) — specifically the Tier 2 semantic tokens that are the only tokens components may consume.

It **inherits** engineering constraints from the [Engineering Standard](L2-002) — quality gates, testing requirements, security invariants, and observability baseline.

It **does not cover**:

- Brand identity, voice, or token definitions — those live in [Brand Application Standard](L2-001).
- Backend API design, service boundaries, or infrastructure — those live in [Architecture](L3-001).
- Domain-specific UI workflows (account registration, proposal pages, donor dashboards) — those live in the L4 domain specs that depend on this document.

---

## Inherited Constraints

### From L2-002 (Engineering Standard)

| Section                       | Constraint                                                         | Frontend Implication                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.4 — Input Validation        | All external input validated at system boundary                    | All form inputs validated client-side before submission; server-side validation is authoritative                                                                        |
| 1.4 — CSP                     | Content Security Policy headers mandatory                          | No inline scripts, no `eval()`, no `unsafe-inline` in style or script directives                                                                                        |
| 1.6 — Dependency Security     | Dependencies scanned on every build; abandoned packages prohibited | Frontend dependency tree audited in CI; no packages without active maintenance                                                                                          |
| 4.1 — Code Quality            | Automated linting and formatting; strict type safety               | Linter and formatter enforced in CI; strict TypeScript mode (`strict: true`)                                                                                            |
| 4.2 — Test Coverage           | 80% coverage for UI components                                     | Unit + snapshot tests on all shared components; coverage gate in CI                                                                                                     |
| 4.4 — Pre-Merge Checklist     | All gates pass before merge                                        | Frontend-specific CI checks (build, lint, type-check, test, bundle size, accessibility audit)                                                                           |
| 5.3 — Error Response Contract | Consistent error format with human-readable message                | Frontend error handling consumes machine-readable error codes and displays user-facing messages following [Brand Application Standard](L2-001) Section 4 voice patterns |
| 6.2 — Correlation IDs         | Every request carries a correlation ID                             | Frontend HTTP client attaches correlation ID to all API requests; ID surfaced in error reporting                                                                        |

### From L2-001 (Brand Application Standard)

| Section                     | Constraint                                                    | Frontend Implication                                                                                             |
| --------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Token Architecture          | Components consume Tier 2 semantic tokens only                | Direct reference to Tier 1 identity tokens in component code is a build-time lint violation                      |
| Section 3 — Component Specs | Mandatory component-to-token mappings                         | Component library implements exact token mappings from L2-001 Section 3                                          |
| Section 5 — Accessibility   | WCAG 2.1 AA minimum; focus states; screen reader requirements | Accessibility audit enforced in CI; all components meet Section 5 requirements                                   |
| Section 7 — Dark Mode       | Dark-first; no light mode for core application                | Single dark theme; light-theme overrides only for exception contexts (email, PDF, embedded widgets)              |
| Section 8 — Brand Misuse    | Violations flagged in code review                             | Automated lint rules for detectable violations (Tier 1 token usage, custom colours, suppressed focus indicators) |

---

## 1. Frontend Architecture

### 1.1 Framework Selection

The frontend framework is **React 19.x**, selected per [Tech Stack](L3-008).
React 19 meets all selection criteria: first-class TypeScript support, mature component model, SSR/SSG capability, large ecosystem, and strong accessibility tooling.

The build tool is **Vite** (per [Tech Stack](L3-008)), providing fast development server, HMR, and optimised production builds.

### 1.1.1 Rendering Strategy

The application is a **single-page application (SPA)** with **selective static pre-rendering** for SEO-relevant pages.

| Page type                                                    | Rendering                                                                   | Rationale                                                                   |
| ------------------------------------------------------------ | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Marketing / landing pages                                    | Static pre-rendering at build time (via `vite-plugin-ssr` or equivalent)    | SEO-critical; content changes infrequently; can be served directly from CDN |
| Public proposal pages                                        | Static pre-rendering with revalidation (rebuild on proposal publish/update) | SEO-important; content is user-generated but changes on known events        |
| Authenticated pages (dashboard, account, contribution flows) | Client-side SPA rendering                                                   | Not SEO-relevant; require authentication; benefit from SPA interactivity    |

Full server-side rendering (SSR) is not required at this stage. The SPA + selective pre-rendering approach avoids SSR infrastructure complexity while covering SEO needs. If SSR becomes necessary (e.g., for dynamic meta tags on proposal pages at scale), the architecture can adopt a framework like React Router's SSR mode or a lightweight Node SSR layer without restructuring the component library.

The following architectural constraints apply.

### 1.2 Component-Based Architecture

The UI is built from a hierarchy of composable components.

| Component Tier               | Description                                                                                                             | Ownership                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Design system primitives** | Button, Input, Card, Badge, ProgressBar, StatCard — implementing [Brand Application Standard](L2-001) Section 3 exactly | Shared library; changes require design review                  |
| **Composite components**     | Form groups, navigation, proposal cards, stat dashboards — assembled from primitives                                    | Feature teams; must only use primitives from the design system |
| **Page components**          | Full page layouts — assembled from composites; manage data fetching and state                                           | Feature teams; defined by L4 domain specs                      |

**Rule**: No component may define its own colours, font sizes, spacing, or animation timings.
All visual properties are consumed from semantic tokens.
Hardcoded visual values in component code are a spec violation.

### 1.2.1 Trusted HTML Rendering

`dangerouslySetInnerHTML` is permitted **only** for HTML content sourced from the application's own API (e.g. rich-text proposal descriptions stored in the database and returned by the server).

**Security boundary:**

- Raw user-supplied HTML must **never** be rendered via `dangerouslySetInnerHTML` — doing so creates an XSS vulnerability.
- Content rendered this way must originate exclusively from the application's own API responses, which are treated as trusted because they are stored and served by the application itself.
- If the source of HTML content is in any doubt, use a sanitisation library (e.g. DOMPurify) before rendering.

**Current usage:** `proposal.description` in `ProposalDetailPage` — the proposal description is authored by proposal owners, stored in the database, and returned by the API. It is rendered via `dangerouslySetInnerHTML` to preserve formatting.

### 1.3 State Management

State management uses a **layered approach** that avoids heavy frameworks in favour of React's built-in primitives and a dedicated server-state library.

| Layer                   | Tool                            | Scope                                                                                                                                             |
| ----------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Server state**        | TanStack Query (React Query) v5 | All API data: proposals, accounts, contributions, funding progress. Handles caching, revalidation, optimistic updates, and background refetching. |
| **Local UI state**      | React `useState` / `useReducer` | Form state, modal visibility, UI toggles — ephemeral state that does not survive navigation.                                                      |
| **Shared client state** | React Context + `useReducer`    | Authentication state, user preferences, correlation ID — small amount of cross-cutting state shared across the component tree.                    |

**Why TanStack Query**: It is the lightest-touch solution that satisfies the server-state requirements (caching with revalidation, optimistic mutations with rollback, background polling for real-time progress) without introducing a global state framework like Redux or Zustand. All server data flows through TanStack Query; no component fetches or caches API data outside this layer.

**Why not a global store**: The application's complexity is overwhelmingly server-state-driven (proposals, contributions, account data). A global client store adds indirection without benefit when TanStack Query already manages the cache, loading states, and error states for server data.

The following constraints apply regardless of implementation detail:

- Financial data (contribution amounts, funding totals, escrow status) must never be cached in client-side state beyond a single session without revalidation from the server. TanStack Query's `staleTime` for financial data must be zero (always revalidate on mount).
- Authentication state must be managed consistently across all routes and API calls via a dedicated `AuthContext` provider at the application root.
- State mutations that represent financial actions must use TanStack Query's mutation API with `onMutate` / `onError` rollback — the UI may show optimistic state but must revert on server rejection.

### 1.4 Routing

- All routes are defined declaratively.
- Route-level code splitting is mandatory — no single route loads the entire application bundle.
- Protected routes enforce authentication state before rendering; unauthenticated users are redirected to login.
- Route transitions use `--motion-page` semantic token for animation timing.

**Lazy loading pattern**: Non-marketing routes (e.g., proposal detail, contribute) use `React.lazy` + `Suspense` for route-level code splitting. A root `<Suspense>` with a fallback UI wraps the entire `<Routes>` tree so that any lazy-loaded route is covered without individual `<Suspense>` wrappers at each route definition.

```tsx
// Route definitions (src/App.tsx or router config)
const ProposalDetail = React.lazy(() => import('./pages/ProposalDetail'));
const Contribute = React.lazy(() => import('./pages/Contribute'));

// Root layout
<Suspense fallback={<PageSpinner />}>
  <Routes>
    <Route path="/proposals/:id" element={<ProposalDetail />} />
    <Route path="/proposals/:id/contribute" element={<Contribute />} />
  </Routes>
</Suspense>
```

Marketing pages (landing, public proposal list) may be statically pre-rendered and do not require lazy loading.

**Page title management pattern** (introduced in Issue #81):

- A static `routeTitles` map in `Layout.tsx` maps known route paths to their full page title strings. On every location change, a `useEffect` in `Layout` looks up the current path in this map and sets `document.title` accordingly.
- For dynamic routes whose titles depend on fetched data (e.g. a proposal's name on the proposal detail page), the page component sets `document.title` in its own `useEffect` once the data is available.
- Title format: `<Page Name> — Mars Mission Fund` (em dash separator, app name suffix on every page).

```tsx
// Layout.tsx — static route titles
const routeTitles: Record<string, string> = {
  '/': 'Home — Mars Mission Fund',
  '/about': 'About — Mars Mission Fund',
  '/contact': 'Contact — Mars Mission Fund',
}

useEffect(() => {
  document.title = routeTitles[location.pathname] ?? 'Mars Mission Fund'
}, [location.pathname])

// ProposalDetailPage.tsx — dynamic title set once proposal data loads
useEffect(() => {
  if (proposal) {
    document.title = `${proposal.title} — Mars Mission Fund`
  }
}, [proposal])
```

### 1.5 API Communication

- All API communication goes through a centralised HTTP client that enforces:
  - Correlation ID attachment (per [Engineering Standard](L2-002) Section 6.2).
  - Authentication token injection.
  - Consistent error handling and transformation into user-facing messages.
  - Request/response logging (no sensitive data — per [Engineering Standard](L2-002) Section 6.1).
- API response types are generated from or validated against the API's machine-readable documentation (per [Engineering Standard](L2-002) Section 5.5).
- No component may call an API endpoint directly — all calls go through the centralised client.

**API / hooks layering convention** (established during issues #40–#43):

| Layer | Location | Responsibility |
| --- | --- | --- |
| **API functions** | `src/api/<domain>.ts` | Plain `fetch` wrappers; TypeScript types inferred from Zod schemas; no React dependency |
| **Query hooks** | `src/hooks/use<Domain>.ts` | TanStack Query `useQuery` (and `useMutation`) hooks that wrap the API layer; expose loading, error, and data states |
| **Page components** | `src/pages/` | Import hooks only — never import from `src/api/` directly |

Example structure:

```text
src/
  api/
    proposals.ts       # fetchProposal(), fetchProposals(), etc.
  hooks/
    useProposal.ts     # useQuery wrapping fetchProposal()
  pages/
    ProposalDetail.tsx # imports useProposal(), never fetchProposal()
```

**Vite dev-server proxy**: `vite.config.ts` includes a `server.proxy` entry that forwards all `/v1` requests to `http://localhost:3000` during local development. This allows the frontend to call `/v1/proposals` without CORS issues while the Express API server runs on port 3000.

```ts
// vite.config.ts (relevant excerpt)
server: {
  proxy: {
    '/v1': 'http://localhost:3000',
  },
},
```

This proxy is a development-only concern; in production the frontend and API are co-hosted or the API URL is injected via environment variables.

---

## 2. Component Library Standards

### 2.1 Token Consumption

Components consume **only** Tier 2 semantic tokens from the [Brand Application Standard](L2-001).

```text
Allowed:     background: var(--color-action-primary);
Prohibited:  background: var(--launchfire);
Prohibited:  background: #FF5C1A;
```

A build-time lint rule must enforce this constraint.
The rule must flag:

- Direct reference to any Tier 1 identity token name in component stylesheets.
- Hardcoded colour values (hex, rgb, rgba, hsl) in component stylesheets.
- Hardcoded font-family, font-size, or animation-duration values in component stylesheets.

**Implementation pattern — inline `React.CSSProperties`.**
Design system primitives and composite components define a `const xyzStyle: React.CSSProperties` object per visual state and apply it via the `style` prop.
Tailwind is not used for component-level styles; it is imported for CSS reset and global normalisation only.
Rationale: inline style objects are co-located with the component, are type-safe through `React.CSSProperties`, and structurally enforce the semantic token rule — the TypeScript type does not accept arbitrary string values that could be hardcoded colours.

### 2.2 Component Documentation

Every design system primitive must include:

- A TypeScript interface defining all props.
- Usage examples for each variant.
- Accessibility notes (ARIA attributes, keyboard behaviour, screen reader expectations).
- A visual regression snapshot.

### 2.3 Component API Design Principles

- Props use semantic names, not visual ones (`variant="primary"` not `color="orange"`).
- Boolean props default to `false`.
- Components accept a `className` or equivalent escape hatch for layout positioning only — never for overriding visual tokens.
- All interactive components support `disabled`, focus management, and keyboard navigation.

---

## 3. Performance Budgets

### 3.1 Loading Performance

| Metric                         | Budget  | Measurement                            |
| ------------------------------ | ------- | -------------------------------------- |
| First Contentful Paint (FCP)   | < 1.5s  | Lighthouse, on 4G throttled connection |
| Largest Contentful Paint (LCP) | < 2.5s  | Lighthouse, on 4G throttled connection |
| Time to Interactive (TTI)      | < 3.5s  | Lighthouse, on 4G throttled connection |
| Cumulative Layout Shift (CLS)  | < 0.1   | Lighthouse                             |
| First Input Delay (FID)        | < 100ms | Real User Monitoring (RUM)             |

### 3.2 Bundle Size

| Bundle                              | Maximum Size (gzip compressed) |
| ----------------------------------- | ------------------------------ |
| Initial JS bundle (critical path)   | 150 KB                         |
| Per-route chunk (lazy loaded)       | 50 KB                          |
| Total CSS                           | 30 KB                          |
| Design system primitives (JS + CSS) | 40 KB                          |

These budgets assume React 19 + TanStack Query + router as the core dependency set (~90 KB compressed baseline). The remaining budget is for application code and design system.

The principle is: every byte must justify its presence.
Bundle analysis runs in CI via `vite-plugin-bundle-analyzer` and fails the build if budgets are exceeded.

### 3.3 Runtime Performance

| Metric               | Target                                                                |
| -------------------- | --------------------------------------------------------------------- |
| Animation frame rate | 60fps minimum; no dropped frames on mid-range devices                 |
| Interaction response | < 100ms for user-initiated actions (button clicks, form interactions) |
| List rendering       | Virtualised rendering for lists exceeding 50 items                    |
| Image decoding       | Off-main-thread; no layout jank during image load                     |

---

## 4. Accessibility Standards

This section implements the requirements from [Brand Application Standard](L2-001) Section 5 and establishes additional frontend-specific accessibility standards.

### 4.1 Compliance Target

**WCAG 2.1 Level AA** is the minimum compliance target for all user-facing surfaces.

Level AAA conformance is targeted where feasible, particularly for:

- Colour contrast on primary text (the dark-first palette naturally achieves AAA — see [Brand Application Standard](L2-001) Section 5.1).
- Keyboard navigation (all functionality available via keyboard).

### 4.2 Automated Accessibility Testing

- An accessibility audit tool (e.g., axe-core or equivalent) runs as part of CI on every PR.
- Violations at the "critical" or "serious" level fail the build.
- Accessibility tests are included in the component test suite for every design system primitive.

### 4.3 Keyboard Navigation

- All interactive elements are reachable via Tab key in a logical order.
- Focus order matches the visual order of elements.
- Modal dialogs trap focus within the dialog until dismissed.
- Focus is restored to the triggering element when a dialog closes.
- Skip-to-content link is provided on every page.
- Custom interactive components (dropdowns, date pickers, tabs) implement the appropriate WAI-ARIA authoring practice keyboard pattern.

### 4.4 Screen Reader Support

All requirements from [Brand Application Standard](L2-001) Section 5.4 apply.
Additionally:

- Dynamic content updates (e.g., funding progress changes, real-time notifications) are announced via ARIA live regions with appropriate politeness levels.
- Page title updates on route changes.
- Form validation errors are associated with their inputs via `aria-describedby` and announced on submission.
- Loading states are communicated via `aria-busy` and descriptive status text.

### 4.5 Motion Accessibility

All animations implement `prefers-reduced-motion` as defined in [Brand Application Standard](L2-001) Section 5.2.

Implementation:

- A CSS media query at the root level sets all motion semantic tokens to their reduced-motion alternatives.
- JavaScript-driven animations check the media query and adjust accordingly.
- No animation is essential to understanding content — all animated content is accessible without motion.

---

## 5. Responsive Design

### 5.1 Strategy

The responsive strategy is **mobile-first**.

CSS is authored for the smallest viewport first; larger viewports are handled via `min-width` media queries. This ensures mobile is the baseline experience rather than a degraded afterthought, and naturally produces lighter CSS (small-screen styles are unconditional; large-screen enhancements are additive).

Components must be designed and reviewed at the smallest breakpoint first before scaling up.

### 5.2 Breakpoints

The breakpoint system uses four named breakpoints defined as CSS custom properties and as constants in the application's theme module.

| Token             | Value    | Intended context                         |
| ----------------- | -------- | ---------------------------------------- |
| `--breakpoint-sm` | `640px`  | Large phones in landscape; small tablets |
| `--breakpoint-md` | `768px`  | Tablets in portrait                      |
| `--breakpoint-lg` | `1024px` | Tablets in landscape; small desktops     |
| `--breakpoint-xl` | `1280px` | Standard desktops and above              |

Media queries use `min-width` exclusively (mobile-first). Example:

```css
/* Base: single column (mobile) */
.card-grid {
  grid-template-columns: 1fr;
}

/* sm and up: two columns */
@media (min-width: 640px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* lg and up: three columns */
@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

No component may use arbitrary breakpoint values — all responsive behaviour must use one of the four named breakpoints above.

Regardless of specific values, the following constraints apply:

| Context                                        | Requirement                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Proposal browsing                              | Full functionality at all breakpoints; card grid adapts from single-column to multi-column             |
| Financial flows (contribution, KYC)            | Full functionality at all breakpoints; forms must be usable on mobile without horizontal scrolling     |
| Data tables (transaction history, admin views) | Responsive pattern required — horizontal scroll, card conversion, or column prioritisation             |
| Navigation                                     | Collapses to mobile-appropriate pattern (hamburger, bottom nav, or equivalent) below tablet breakpoint |

### 5.3 Touch Targets

All interactive elements meet minimum touch target size of 44x44 CSS pixels on touch devices (WCAG 2.1 SC 2.5.5).

---

## 6. Animation & Motion

### 6.1 Token Usage

All animations use semantic motion tokens from [Brand Application Standard](L2-001) Section 2.9.
No custom timing values, durations, or easing functions in component code.

### 6.2 Performance Constraints

| Constraint          | Requirement                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Frame rate          | 60fps target; animations that cannot maintain 60fps must be simplified or removed                                                                      |
| Animated properties | Prefer `transform` and `opacity` only (compositor-layer animations); avoid animating `width`, `height`, `top`, `left`, or layout-triggering properties |
| Will-change         | Apply `will-change` only when an animation is imminent; remove after completion; never apply to more than a handful of elements simultaneously         |
| Main thread         | No long-running JavaScript animations on the main thread; use CSS animations, Web Animations API, or requestAnimationFrame                             |

### 6.3 Reduced Motion

When `prefers-reduced-motion: reduce` is active:

- All semantic motion tokens resolve to their reduced-motion alternatives as defined in [Brand Application Standard](L2-001) Section 5.2.
- Ambient and decorative animations (`--motion-ambient`) are fully disabled (static position).
- Essential transitions (page navigation, modal open/close) use instant or minimal fade.
- Progress bar fills render instantly.

---

## 7. Browser Support Matrix

The browser support policy is **latest 2 major versions** for all evergreen browsers. Specific version numbers are not pinned — the policy moves forward automatically as browsers release. If post-launch analytics reveal a significant user segment on older versions, the matrix can be tightened.

### 7.1 Minimum Support Expectations

| Browser                                      | Support Level |
| -------------------------------------------- | ------------- |
| Chrome (latest 2 major versions)             | Full support  |
| Firefox (latest 2 major versions)            | Full support  |
| Safari (latest 2 major versions)             | Full support  |
| Edge (latest 2 major versions)               | Full support  |
| Mobile Safari (iOS, latest 2 major versions) | Full support  |
| Chrome for Android (latest 2 major versions) | Full support  |
| Internet Explorer                            | Not supported |

### 7.2 Progressive Enhancement

- The application requires JavaScript. When JavaScript is unavailable or disabled, the application displays a clear, styled `<noscript>` message explaining the requirement and providing guidance (graceful degradation).
- The `<noscript>` fallback must be visually consistent with the brand (using the dark theme background and brand typography via system font fallbacks).
- Visual enhancements (animations, gradient effects, advanced layout) may leverage modern CSS features with appropriate fallbacks.
- Feature detection (not browser detection) is used for all capability checks.

---

## 8. Dark Mode Implementation

### 8.1 Position

Mars Mission Fund is a **dark-first product** as established in [Brand Application Standard](L2-001) Section 7.
The core application has a single dark theme.
There is no user-togglable light mode for the main application.

### 8.2 Technical Implementation

- All colour values are consumed via CSS custom properties (semantic tokens).
- The dark theme is the default — no theme toggle or system preference detection is needed for the core application.
- Exception contexts (email templates, PDF exports, embedded widgets) define theme-specific token override maps as described in [Brand Application Standard](L2-001) Section 7.2.
- Exception theme overrides are scoped via a CSS class (e.g., `.theme-light`) applied to the root element of the exception context — not via media queries or system preferences.

---

## 9. Asset Optimisation

### 9.1 Font Loading

The brand typography defined in [Brand Application Standard](L2-001) Section 1.3 requires loading three web fonts:

| Font       | Identity Token   | Usage                                    |
| ---------- | ---------------- | ---------------------------------------- |
| Bebas Neue | `--font-display` | Display headings, hero text, stat values |
| DM Sans    | `--font-body`    | Body text, buttons, card titles          |
| Space Mono | `--font-data`    | Labels, data values, mission codes       |

Font loading implementation:

Fonts are loaded via the `@fontsource/bebas-neue`, `@fontsource/dm-sans`, and `@fontsource/space-mono` npm packages, imported in `src/index.css`.
The underlying font files are WOFF2 format — the same self-hosted, no-CDN approach described in the spec intent — but the mechanism is npm-managed rather than manually downloaded.
At build time, Vite bundles the WOFF2 files from the `@fontsource` packages into the output; no runtime CDN request occurs.

Rationale: standardised font loading via `@fontsource` npm packages avoids manual file management (no manual WOFF2 downloads or `@font-face` declarations to maintain) and provides controlled subsetting through each package's CSS imports.

`font-display` strategy per font:

- `font-display: swap` for DM Sans (body font) — prevents invisible text while the font loads.
- `font-display: optional` for Bebas Neue (display font) on slow connections — a fallback is acceptable for display headings.
- `font-display: swap` for Space Mono (data font).

Font preload hint (`<link rel="preload">`) is applied to DM Sans as the critical path font for body text rendering.

### 9.2 Image Optimisation

| Requirement       | Implementation                                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Format            | Modern formats (WebP, AVIF) with fallback to JPEG/PNG                                                                              |
| Responsive images | `srcset` and `sizes` attributes for all content images                                                                             |
| Lazy loading      | Images below the fold use `loading="lazy"`                                                                                         |
| Aspect ratio      | Explicit `width` and `height` attributes on all `<img>` elements to prevent CLS                                                    |
| CDN               | Images served via CDN with appropriate cache headers                                                                               |
| Uploads           | User-uploaded images (proposal photos, KYC documents) served from a separate domain per [Engineering Standard](L2-002) Section 1.4 |

### 9.3 Icon System

Icons are implemented as **inline SVG React components**.

Each icon is a React component that renders an `<svg>` element directly into the DOM. This approach is selected over SVG sprites and icon fonts for the following reasons:

- **Tree-shakeable**: Only icons actually imported are included in the bundle.
- **Accessible by default**: Each icon component accepts `aria-label` and renders `role="img"`; decorative icons render `aria-hidden="true"`.
- **Styleable via tokens**: SVG `fill` and `stroke` inherit from CSS `currentColor`, which is set via semantic colour tokens.
- **No runtime fetch**: No sprite sheet HTTP request; icons are part of the JS bundle and render synchronously.

Icon components follow a consistent API:

```tsx
interface IconProps {
  size?: 'sm' | 'md' | 'lg' // maps to semantic spacing tokens
  label?: string // sets aria-label; omit for decorative icons
  className?: string // layout positioning only
}
```

The project uses a curated subset of an open-source icon library (e.g., Lucide, Heroicons, or Phosphor) wrapped in project-specific components to maintain a single icon API. Direct use of the upstream library in component code is prohibited — all icons are re-exported through the project's icon module.

---

## 10. Frontend Testing Strategy

Implements [Engineering Standard](L2-002) Section 4.2: 80% coverage for UI components.

### 10.1 Test Layers

| Layer                   | Scope                                                                    | Tool                                                                       |
| ----------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Unit tests              | Individual component rendering, prop variations, event handling          | Vitest + React Testing Library                                             |
| Snapshot tests          | Visual regression detection for design system primitives                 | Vitest inline snapshots                                                    |
| Integration tests       | Component composition, form flows, API interaction (mocked)              | Vitest + React Testing Library + MSW (Mock Service Worker)                 |
| End-to-end tests        | Critical user flows: contribution, proposal browsing, account management | Playwright                                                                 |
| Accessibility tests     | Automated WCAG audit on every component                                  | axe-core (via `vitest-axe` for unit tests; `@axe-core/playwright` for E2E) |
| Visual regression tests | Screenshot comparison for design system components                       | Playwright screenshot assertions                                           |
| API integration tests   | Backend API endpoint testing (mocked or local server)                    | Supertest                                                                  |

**Tool rationale**:

- **Vitest**: Native Vite integration, fast HMR-aware test execution, compatible with Jest API. Preferred over Jest for Vite-based projects.
- **React Testing Library**: Tests components from the user's perspective (queries by role, label, text) rather than implementation details. Reinforces accessibility-first component design.
- **MSW (Mock Service Worker)**: Intercepts HTTP requests at the network level, allowing integration tests to exercise the real API client (including correlation ID attachment, error handling) without hitting a server.
- **Playwright**: Cross-browser E2E testing with first-class support for accessibility testing via axe-core integration. **Playwright MCP** (via `@anthropic-ai/mcp-playwright` or `@anthropic-ai/playwright-mcp`) is used during development for efficient LLM/AI agent integration — enabling AI-assisted test authoring, debugging, and visual inspection of test state.
- **Supertest**: Lightweight HTTP assertion library for testing Express API endpoints in isolation.

### 10.2 Coverage Requirements

| Component Type           | Minimum Coverage | Notes                                                       |
| ------------------------ | ---------------- | ----------------------------------------------------------- |
| Design system primitives | 90%              | Higher bar — these are shared foundations                   |
| Composite components     | 80%              | Per [Engineering Standard](L2-002) Section 4.2              |
| Page components          | 70%              | Focus on integration and data flow; visual coverage via E2E |
| Utility functions        | 90%              | Pure functions; easy to test exhaustively                   |

### 10.3 CI Integration

- All test layers run on every PR.
- Test failures block merge (per [Engineering Standard](L2-002) Section 4.4).
- Coverage reports are generated and compared against thresholds.
- Bundle size analysis runs on every PR with comparison against budgets.
- Lighthouse CI runs on key pages with performance budget enforcement.
- Accessibility audit runs on every PR.

---

## Interface Contracts

### With L2-001 (Brand Application Standard)

This spec **consumes** the Tier 2 semantic token system defined in [Brand Application Standard](L2-001) Section 2.
The component library implements the component specifications defined in [Brand Application Standard](L2-001) Section 3.
Voice-in-product patterns from [Brand Application Standard](L2-001) Section 4 govern all user-facing text rendered by frontend components.

**Interface**: Semantic token CSS custom properties.
Changes to the semantic token set in L2-001 require corresponding updates to the component library and this spec.

### With L3-001 (Architecture)

This spec **consumes** the API contracts, service boundaries, and deployment topology defined in [Architecture](L3-001).
The frontend is deployed as defined in L3-001; the frontend build pipeline integrates with the CI/CD architecture defined there.

**Interface**: API endpoints, authentication mechanism, deployment pipeline.
Changes to API contracts require corresponding updates to the frontend API client and generated types.

### With L4-001 (Account), L4-002 (Proposal), L4-003 (Donor)

These domain specs **consume** the component library, responsive design system, accessibility standards, and performance budgets defined in this spec.
Domain specs define the specific pages, workflows, and data requirements; this spec defines how those are built.

**Interface**: Component library API, design tokens, layout system.
Domain specs may not introduce visual properties that bypass this spec's token and component constraints.

---

## Change Log

| Date       | Version | Author | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | ------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| March 2026 | 0.1     | —      | Initial stub. Frontend architecture constraints, component library standards, performance budgets, accessibility implementation, responsive design, animation constraints, browser support, dark mode implementation, asset optimisation, and testing strategy. Framework selection and specific breakpoints deferred as open decisions.                                                                                                                                                  |
| March 2026 | 0.2     | —      | Resolved OQ-1: React 19.x selected as frontend framework per L3-008.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| March 2026 | 0.3     | —      | Resolved OQ-2 through OQ-9: Mobile-first responsive strategy with breakpoints at 640/768/1024/1280px. Bundle size budgets established. TanStack Query + React built-in state for state management. Inline SVG React components for icons. Vitest + React Testing Library + Playwright + MSW + Supertest for testing (with Playwright MCP for AI agent integration). SPA with selective static pre-rendering for SEO pages. Graceful degradation for no-JS with branded noscript fallback. |
| 2026-03-09 | 0.4     | —      | Documented patterns introduced in issues #40–#43 (Public Proposal Pages milestone): (1) Section 1.4 — lazy loading pattern for non-marketing routes using `React.lazy` + `Suspense` with a root `<Suspense>` wrapping `<Routes>`; (2) Section 1.5 — api/hooks layering convention (`src/api/<domain>.ts` for fetch functions, `src/hooks/use<Domain>.ts` for TanStack Query hooks, page components consume hooks only); (3) Section 1.5 — Vite dev-server proxy forwarding `/v1` to `http://localhost:3000` for local development. |
| 2026-03-10 | 0.5     | —      | Documented patterns introduced in issues #80–#81 (Milestone housekeeping milestone): (1) Section 1.2.1 — Trusted HTML Rendering: `dangerouslySetInnerHTML` permitted only for API-sourced content; raw user-supplied HTML explicitly forbidden (XSS); current usage is `proposal.description` in `ProposalDetailPage`; (2) Section 1.4 — Page title management: static `routeTitles` map in `Layout.tsx` for known routes; page components use `useEffect` for dynamic titles; title format `<Page Name> — Mars Mission Fund`. |

---

*This spec governs how the Mars Mission Fund frontend is built.
For brand identity and token definitions, see the [Brand Application Standard](L2-001).
For engineering constraints inherited by this spec, see the [Engineering Standard](L2-002).
For system architecture and API contracts, see [Architecture](L3-001).*
