# Finance Manager

[![PR Check](https://github.com/victoraugustoas/finance-manager/actions/workflows/unit-tests.yml/badge.svg)](https://github.com/victoraugustoas/finance-manager/actions/workflows/unit-tests.yml)
[![codecov](https://codecov.io/gh/victoraugustoas/finance-manager/graph/badge.svg)](https://codecov.io/gh/victoraugustoas/finance-manager)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10-f69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

Personal finance manager in TypeScript: record expenses, incomes, and transfers between accounts, with a foundation for analyses (for example, charts of largest expenses and incomes). The project follows **Clean Architecture** and **DDD** (Domain-Driven Design).

## Technologies

| Technology        | Primary use |
| ----------------- | ----------- |
| TypeScript 6      | Language and strict typing |
| Node.js           | Runtime (version in `.nvmrc`) |
| NestJS 11         | Framework (future application layer) |
| PostgreSQL        | Database (when infrastructure is in place) |
| Prisma 7          | ORM (after schema is defined) |
| ESLint + Prettier | Linting and formatting |
| Jest              | Unit tests |
| pnpm              | Package manager |

Exact versions are listed in `package.json`.

## Prerequisites

- **Node.js** matching `.nvmrc` (recommended via [nvm](https://github.com/nvm-sh/nvm))
- **Corepack** (not bundled with Node.js in recent releases; install globally, then enable — see Installation)
- **pnpm** (via Corepack after `corepack enable`, or install pnpm globally)
- **PostgreSQL** will be required once the infrastructure layer and Prisma are wired up

## Installation

```bash
nvm use
npm install -g corepack
corepack enable
pnpm install
```

Corepack is no longer shipped with Node.js in many setups; install it with `npm install -g corepack` before `corepack enable` so pnpm can be managed by Corepack.

The `prepare` script in `package.json` points Git at the hooks in `.githooks` (`git config core.hooksPath .githooks`).

## Available scripts

| Script                 | Description |
| ---------------------- | ----------- |
| `pnpm build`           | Compile the project (Nest CLI → `dist/`) |
| `pnpm start`           | Start the Nest app (requires `src/main.ts` when it exists) |
| `pnpm start:dev`       | Same as `start` with watch |
| `pnpm start:debug`     | Start in debug mode with watch |
| `pnpm start:prod`      | Run `node dist/main` |
| `pnpm lint`            | ESLint on `src` and `test` with `--fix` |
| `pnpm format`          | Prettier on `.ts` files under `src` and `test` |
| `pnpm test`            | Unit tests (Jest) |
| `pnpm test:watch`      | Jest in watch mode |
| `pnpm test:cov`        | Tests with coverage |
| `pnpm test:e2e`        | E2E tests (config in `test/jest-e2e.json`) |
| `pnpm prisma:generate` | `prisma generate` (after adding `prisma/schema.prisma`) |
| `pnpm prisma:migrate`  | `prisma migrate dev` |
| `pnpm prisma:studio`   | Prisma Studio |

**Current state:** there is no `src/main.ts` or Nest controllers yet; the reliable day-to-day commands are `pnpm test`, `pnpm lint`, `pnpm build`, and `pnpm format`. The `prisma:*` scripts only work after a Prisma schema and migrations exist in the repo.

## Project structure

```
src/
├── shared/                 # Shared primitives (Result, Entity, ValueObject, UseCase, etc.)
├── accounts/core/          # Account context — model and use case definitions
├── category/core/          # Category context — model and use case definitions
└── transactions/core/      # Transaction context — use case definitions
```

Each context that documents use cases has `core/definitions/UseCasesDefinitions.md` with business rules in domain language.

## Architecture

- **Clean Architecture:** separation between domain, use cases, and (future) infrastructure.
- **DDD:** aggregates, entities, value objects, and domain events where applicable; bounded contexts mapped to folders under `src/`.

**Bounded contexts (product view):**

| Context           | Responsibility |
| ----------------- | -------------- |
| **Account**       | Lifecycle of financial accounts |
| **Transaction**   | Expenses, incomes, and transfers |
| **Category**      | Expense and income categories |
| **Notifications** | Reactive context driven by events (to be reflected under `src/` when modeled) |

The `src/shared` folder holds base types (`UseCase`, `Result`, `ValueObject`, `Entity`, `AggregateRoot`, etc.) used across contexts.

## Conventions

- Domain and application component files use **PascalCase** (e.g. `Account.ts`, `Money.ts`).
- Tests: same base name with `.spec.ts` suffix (e.g. `Money.spec.ts`).
- Barrel files named `index.ts` stay lowercase.

See `AGENTS.md` for more detail for contributors and tooling.

## Git hooks

Hooks live in `.githooks` (enabled by the npm/pnpm `prepare` script after `pnpm install`):

| Hook           | Behavior |
| -------------- | ---------- |
| **pre-commit** | For each staged `.ts` file: Prettier + ESLint with fix, then re-stage |
| **pre-push**   | Runs `pnpm test` before push |

## CI/CD

On GitHub Actions, the **PR Check** workflow (`.github/workflows/unit-tests.yml`) runs on **pull requests** and on **pushes to `main`**: checkout, pnpm 10, Node from `.nvmrc`, `pnpm install --frozen-lockfile`, and `pnpm test:cov`. Coverage is uploaded to [Codecov](https://codecov.io/gh/victoraugustoas/finance-manager) (`coverage/lcov.info`). If the Codecov badge shows as unknown until the first successful upload, enable the Codecov GitHub app for the repository or wait for the first run on `main`.

---

License: **ISC** (see `package.json`).
