# ADR-0001: npm Workspaces Monorepo Structure

> **Status**: Accepted
> **Date**: 2026-03-10
> **Deciders**: Engineering team

## Context

The Mars Mission Fund codebase contains three distinct units: a React frontend client, an Express backend server, and a shared type library.
These units share development tooling (ESLint, TypeScript, Prettier) and internal type contracts.
A monorepo structure was needed to manage these units together while keeping their concerns separated.

Two questions arose when designing the monorepo structure:

1. Which monorepo tooling to use: npm workspaces, Turborepo, or Nx?
1. Which top-level directory name to use for workspace packages: `packages/` or `src/`?

## Decision

### Monorepo Tooling: npm workspaces

npm workspaces (built into npm 7+) is used instead of Turborepo or Nx.

**Rationale**:

- The project has three packages (`client`, `server`, `shared`); there is no build orchestration problem that justifies additional tooling.
- Turborepo and Nx provide value through intelligent task scheduling and remote caching — benefits that materialise at scale (many packages, long build times).
  For a three-package monorepo, these features add complexity without measurable benefit.
- npm workspaces requires zero additional dependencies, zero additional configuration files, and zero build graph reasoning.
- All workspace-aware commands (`npm install`, `npm run`, `npm test`) work identically to standard npm commands.
  No new CLI tooling is required for contributors to learn.

### Package Directory: `packages/`

The workspace packages live under `packages/` instead of `src/`.

**Rationale**:

- `packages/` is the established industry convention for npm workspace directories (used by React, Jest, Babel, and the majority of public monorepos on npm).
  Contributors familiar with open-source monorepos will immediately understand the structure.
- `src/` conventionally signals a single package's source code, not a collection of independently installable/deployable units.
  Using `src/` would create ambiguity about whether the directory contains the root project's source or multiple projects.
- `packages/` signals that each subdirectory is a publishable or deployable unit, which accurately describes `client`, `server`, and `shared`.

## Consequences

**Positive**:

- Zero additional build tooling dependencies.
- Standard npm commands work across the entire monorepo without wrappers.
- Directory naming follows community convention, reducing onboarding friction.
- Shared packages (`@mmf/shared`) are resolved via workspace symlinks — no publishing step required during development.

**Negative**:

- No intelligent task scheduling: running `npm run build` at the root runs all workspace build scripts in parallel without dependency-aware ordering.
  This is acceptable because the three packages have simple, well-understood build dependencies.
- If the monorepo grows significantly (10+ packages with complex inter-dependencies), this decision should be revisited in favour of Turborepo or Nx.

**Neutral**:

- All three packages retain independent `package.json`, `tsconfig.json`, and test configuration files.
  Shared tooling config (ESLint, Prettier) is defined at the repo root and extended by each package.

## Compliance

- Satisfies [Engineering Standard](../standards/engineering.md) Section 3.1: architectural decisions affecting the repository structure are recorded as ADRs.
- Satisfies [Engineering Standard](../standards/engineering.md) Section 2.5: vendor evaluation rationale is documented (npm workspaces vs Turborepo vs Nx).
