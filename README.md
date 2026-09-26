# Mars Mission Fund

![Mars Mission Fund coin logo](assets/logo.svg)

![Mars Mission Fund](https://img.shields.io/badge/MARS_MISSION_FUND-FF5C1A?style=for-the-badge&labelColor=0B1628)

A sample crowdfunding application for coding workshops.
Mars Mission Fund is a fictional product that channels collective capital toward missions, technologies, and teams taking humanity to Mars.

The project is designed to teach software engineering practices using production-grade specifications, architecture patterns, and development workflows.

![TypeScript](https://img.shields.io/badge/TypeScript-FF8C42?style=flat-square&labelColor=0E2040&logo=typescript&logoColor=FF8C42)
![React](https://img.shields.io/badge/React_19-FF8C42?style=flat-square&labelColor=0E2040&logo=react&logoColor=FF8C42)
![Node.js](https://img.shields.io/badge/Node_20%2B-FF8C42?style=flat-square&labelColor=0E2040&logo=node.js&logoColor=FF8C42)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-FF8C42?style=flat-square&labelColor=0E2040&logo=postgresql&logoColor=FF8C42)
![Docker](https://img.shields.io/badge/Docker-FF8C42?style=flat-square&labelColor=0E2040&logo=docker&logoColor=FF8C42)

---

## What This Repo Contains

- **Product specifications** covering vision, brand, engineering standards, architecture, security, and domain workflows (see [specs/README.md](./specs/README.md))
- **Application source code** for a TypeScript full-stack crowdfunding platform
- **Infrastructure configuration** for local development via Docker Compose

The specifications are intentionally production-grade.
They serve as working documentation and as templates demonstrating how real-world specs should be structured.
Each spec includes a "Local demo scope" note identifying what matters for the workshop versus what is theatre.

---

## Tech Stack

| Layer                                                                       | Technology                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------------- |
| ![Lang](https://img.shields.io/badge/Language-0E2040?style=flat-square)     | TypeScript (frontend and backend)                       |
| ![Runtime](https://img.shields.io/badge/Runtime-0E2040?style=flat-square)   | Node.js 20+                                             |
| ![Frontend](https://img.shields.io/badge/Frontend-0E2040?style=flat-square) | React 19.x                                              |
| ![Backend](https://img.shields.io/badge/Backend-0E2040?style=flat-square)   | Express 5.x                                             |
| ![Database](https://img.shields.io/badge/Database-0E2040?style=flat-square) | PostgreSQL 16.11 (Aurora in production, Docker locally) |
| ![Arch](https://img.shields.io/badge/Architecture-0E2040?style=flat-square) | Layered Express routes over SQL query functions (production design in specs) |
| ![Testing](https://img.shields.io/badge/Testing-0E2040?style=flat-square)   | Vitest, Playwright, Testing Library, SuperTest          |
| ![Auth](https://img.shields.io/badge/Auth-0E2040?style=flat-square)         | JWT + bcrypt (Clerk planned for production — stubbed locally) |
| ![Payments](https://img.shields.io/badge/Payments-0E2040?style=flat-square) | Stripe (stubbed locally)                                |

For the full technology inventory, see [specs/tech/tech-stack.md](./specs/tech/tech-stack.md).

---

## Prerequisites

For the workshop: Docker and Git only. The workshop repository runs this app for you
in a container (Node, PostgreSQL, Playwright and Claude Code included).

To run it on your own machine instead: [Node.js](https://nodejs.org/) 20+, npm 10+,
[Docker](https://www.docker.com/) and Docker Compose.

---

## Getting Started

**In the workshop**, follow the guide in
[OrchLab-ai/workshop-example](https://github.com/OrchLab-ai/workshop-example): it clones
this repository as `app/` and starts it with `./workshop/up.sh`.

**On your own machine:**

```bash
./scripts/run-local.sh      # Docker Postgres + migrations + both dev servers (requires Node + Docker)
```

> **Note:** External services (Stripe, Clerk, Veriff, AWS SES) are stubbed or mocked for local development.
> See `.env.example` for required environment variables.

---

## Demo accounts

The local development seed includes three demo users for workshop use:

| Role          | Email                     | Password           |
| ------------- | ------------------------- | ------------------ |
| Backer        | `backer@example.com`      | `backer-demo-pass`   |
| Creator       | `creator@example.com`     | `creator-demo-pass`  |
| Administrator | `admin@example.com`       | `admin-demo-pass`    |

To log in: open the app at `http://localhost:5173`, click **Login** in the navigation bar, enter one of the email/password pairs above, and observe the role displayed in the nav after sign-in.

These credentials are for workshop and demo use only. The JWT is stored in `localStorage` and is valid only for the local development session.

---

## Project Structure

```text
packages/client/    React frontend (Vite + Tailwind)
packages/server/    Express API server
packages/shared/    Shared TypeScript types
specs/              Product and technical specifications (start here)
scripts/            Development and CI utility scripts
autonomous/         Image for the workshop's claude-container (Claude Code + Playwright + dbmate)
autonomous-demo/    Level 4: autonomous agent loop with guardrails (see its README)
```

---

## Specifications

The [specs/](./specs/) directory contains a layered specification system:

| Layer                                                                                       | Scope                                                     | Specs   |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------- |
| ![L1](https://img.shields.io/badge/L1-STRATEGIC-FF5C1A?style=flat-square&labelColor=0B1628) | Product vision and mission                                | 1 spec  |
| ![L2](https://img.shields.io/badge/L2-STANDARDS-FF8C42?style=flat-square&labelColor=0B1628) | Brand and engineering standards                           | 2 specs |
| ![L3](https://img.shields.io/badge/L3-TECHNICAL-1A3A6E?style=flat-square&labelColor=0B1628) | Architecture, security, frontend, data, audit, tech stack | 8 specs |
| ![L4](https://img.shields.io/badge/L4-DOMAIN-FFB347?style=flat-square&labelColor=0B1628)    | Account, campaign, donor, payments, KYC workflows         | 5 specs |

Read [specs/README.md](./specs/README.md) before implementing any feature.
It includes the full dependency graph, agent protocol, and cross-cutting concern index.

---

## Quality Gates

- Unit test coverage: 80%+ required
- Integration tests must pass
- E2E tests must pass
- ESLint and Prettier enforced
- Markdown linting via markdownlint-cli2

---

## Contributing

- Do not commit directly to `main` -- use feature branches
- Branch naming: `feat/`, `fix/`, `chore/` prefixes
- Push feature branches and open PRs against `main`

---

## Licence

This project is for educational purposes as part of a coding workshop.

---

![Mars Mission Fund](https://img.shields.io/badge/EVERY_DOLLAR_MOVES_THE_LAUNCH_WINDOW_CLOSER-0B1628?style=for-the-badge&labelColor=FF5C1A)
