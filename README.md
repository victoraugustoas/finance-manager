# Finance Manager

[![PR Check](https://github.com/victoraugustoas/finance-manager/actions/workflows/unit-tests.yml/badge.svg)](https://github.com/victoraugustoas/finance-manager/actions/workflows/unit-tests.yml)
[![codecov](https://codecov.io/github/victoraugustoas/finance-manager/graph/badge.svg?token=E48S83JRKN)](https://codecov.io/github/victoraugustoas/finance-manager)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10-f69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

Personal finance manager in TypeScript: record expenses, incomes, and transfers between accounts, with a foundation for analyses (for example, charts of largest expenses and incomes). The project follows **Clean Architecture** and **DDD** (Domain-Driven Design).

## Technologies

| Technology        | Primary use |
| ----------------- | ----------- |
| TypeScript 6      | Language and strict typing |
| Node.js 25        | Runtime (exact version in `.nvmrc`) |
| NestJS 11         | HTTP API and application layer (`src/main.ts`, modules under `src/`) |
| PostgreSQL        | Database (local stack via `docker compose`; see Installation) |
| Prisma 7          | ORM (`prisma/schema.prisma`; run `pnpm prisma:generate` after schema edits) |
| ESLint + Prettier | Linting and formatting |
| Jest 30           | Unit tests |
| pnpm 10           | Package manager (Corepack / CI) |

Exact versions are listed in `package.json`.

## Prerequisites

- **Node.js** matching `.nvmrc` (recommended via [nvm](https://github.com/nvm-sh/nvm))
- **Corepack** (not bundled with Node.js in recent releases; install globally, then enable — see Installation)
- **pnpm** (via Corepack after `corepack enable`, or install pnpm globally)
- **Docker** (optional) — to run PostgreSQL locally via `docker compose` (see Installation)
- **PostgreSQL** — use Docker Compose at the repo root or install PostgreSQL yourself; values in `DATABASE_URL` (`.env`) must match your database (Compose defaults: user `devuser`, database `finance-manager`, password `devuserpassword`, port `5432` — see `docker-compose.yml`)

Prisma 7 does not officially list Node.js 25 in its supported versions, but build and tests run cleanly on the Node version in `.nvmrc`; you may see a preinstall warning.

## Installation

```bash
nvm use
npm install -g corepack
corepack enable
pnpm install
```

Corepack is no longer shipped with Node.js in many setups; install it with `npm install -g corepack` before `corepack enable` so pnpm can be managed by Corepack.

The `prepare` script in `package.json` points Git at the hooks in `.githooks` (`git config core.hooksPath .githooks`).

PostgreSQL for local development (credentials match the default `DATABASE_URL` in `.env`):

```bash
docker compose up -d
```

Stop and remove containers (volume keeps data): `docker compose down`. Remove data as well: `docker compose down -v`.

The Compose file mounts the named volume at `/var/lib/postgresql`, as required by the official PostgreSQL 18 Docker image. If Postgres fails to start after changing from an older layout (volume previously mounted at `/var/lib/postgresql/data`), remove the stale volume with `docker compose down -v` and bring the stack back up—then recreate the schema (`pnpm prisma:migrate`) or restore from backup. Production upgrades should follow [PostgreSQL migration guidance](https://github.com/docker-library/postgres/issues/37).

## Available scripts

| Script                 | Description |
| ---------------------- | ----------- |
| `pnpm build`           | Compile the project (Nest CLI → `dist/`) |
| `pnpm start`           | Start the Nest app (`src/main.ts`) |
| `pnpm start:dev`       | Same as `start` with watch |
| `pnpm start:debug`     | Start in debug mode with watch |
| `pnpm start:prod`      | Run `node dist/main` |
| `pnpm lint`            | ESLint on `src` and `test` with `--fix` |
| `pnpm format`          | Prettier on `.ts` files under `src` and `test` |
| `pnpm test`            | Unit tests (Jest) |
| `pnpm test:watch`      | Jest in watch mode |
| `pnpm test:cov`        | Tests with coverage |
| `pnpm test:e2e`        | E2E tests (config in `test/jest-e2e.json`) |
| `pnpm prisma:generate` | `prisma generate` (refresh client after `prisma/schema.prisma` changes) |
| `pnpm prisma:migrate`  | `prisma migrate dev` |
| `pnpm prisma:studio`   | Prisma Studio |

**Current state:** the Nest entry point is `src/main.ts` (`EntryPointModule`). HTTP controllers exist under `accounts`, `category`, `reporting`, and `transactions` infrastructure. Reliable commands include `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm format`, and `pnpm prisma:generate`. Applying schema changes with `pnpm prisma:migrate` requires PostgreSQL (`DATABASE_URL`) and uses migrations under `prisma/migrations`.

## Project structure

Top-level under `src/`: `main.ts`, `entrypoint/` (root Nest module), `shared/`, and one folder per bounded context
(`accounts`, `category`, `reporting`, `transactions`).

**`shared/`** — cross-cutting building blocks: `base/` (e.g. `Result`, `Entity`, `ValueObject`, `UseCase`,
`AggregateRoot`, `DomainEvent`), `ValueObjects/` (e.g. `Money`), and `infra/` (e.g. `PrismaService`, HTTP error mapping).

**Bounded contexts (common layout)** — each context uses `core/` for domain and application code and `infra/` for
adapters. Typical `core/` layers: `definitions/` (`UseCasesDefinitions.md` per context), `model/`, `provider/`,
`usecases/`. Typical `infra/`: `controllers/`, `db/`, `dtos/`, `module/`.

**Context-specific additions**

| Context       | Extra paths (beyond the common layout) |
| ------------- | -------------------------------------- |
| **reporting** | `core/dto/`, `core/service/` |
| **transactions** | `infra/acl/account/` — read-only access into the Account context |

Other project roots: `http/` holds sample **REST Client** requests (one `.http` file per bounded context with HTTP:
`accounts`, `category`, `reporting`, `transactions`); `prisma/` holds the schema and migrations.

Contexts document use cases under `core/definitions/UseCasesDefinitions.md` in domain language.

## Architecture

- **Clean Architecture:** separation between domain (`core/`), application use cases, and infrastructure (`infra/` — HTTP, Prisma). Cross-context reads at the persistence boundary may use ACLs under `infra/acl/` (ports in `core/provider/`, adapters that talk to Prisma or other integrations).
- **DDD:** aggregates, entities, value objects, and domain events where applicable; bounded contexts mapped to folders under `src/`.

**Bounded contexts (product view):**

| Context           | Responsibility |
| ----------------- | -------------- |
| **Account**       | Lifecycle of financial accounts |
| **Transaction**   | Expenses, incomes, and transfers |
| **Category**      | Expense and income categories |
| **Reporting**     | Aggregates for analysis (e.g. totals by category over a period, filters such as dates and posted status) |
| **Notifications** | Reactive context driven by events (to be reflected under `src/` when modeled) |

The `src/shared` tree holds domain primitives under `shared/base` (`UseCase`, `Result`, `ValueObject`, `Entity`, `AggregateRoot`, etc.) and reusable value objects under `shared/ValueObjects`.

## Conventions

- Domain and application component files use **PascalCase** (e.g. `Account.ts`, `Money.ts`).
- Tests: same base name with `.spec.ts` suffix (e.g. `Money.spec.ts`).
- Barrel files named `index.ts` stay lowercase.
- TypeScript path alias: `@/*` → `src/*` (see `tsconfig.json` `compilerOptions.paths`).

See `AGENTS.md` for more detail for contributors and tooling.

## Git Hooks

Hooks live in `.githooks` (enabled by the npm/pnpm `prepare` script after `pnpm install`):

| Hook           | Behavior |
| -------------- | ---------- |
| **pre-commit** | For each staged `.ts` file: Prettier + ESLint with fix, then re-stage |
| **pre-push**   | Runs `pnpm test` before push |

## CI/CD

On GitHub Actions, the **PR Check** workflow (`.github/workflows/unit-tests.yml`) runs on **pull requests** and on **pushes to `main`**: checkout, **pnpm 10**, Node from `.nvmrc`, `pnpm install --frozen-lockfile`, and `pnpm test:cov`. A step verifies that `coverage/lcov.info` exists. Coverage is uploaded to [Codecov](https://codecov.io/gh/victoraugustoas/finance-manager) via **OIDC** (`use_oidc: true` on `codecov/codecov-action@v6`, workflow `permissions: id-token: write`) so you do not need a `CODECOV_TOKEN` secret for uploads from this repo’s Actions. The Codecov step is configured with `fail_ci_if_error: false` so an upload failure does not fail the job. Install the [Codecov GitHub app](https://github.com/apps/codecov) on the repository if uploads still fail (required for OIDC trust in some setups). Jest reporters include `lcov` in `jest.config.ts`.

---

License: **ISC** (see `package.json`).
