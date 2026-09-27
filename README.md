# Finance Manager

[![PR Check](https://github.com/victoraugustoas/finance-manager/actions/workflows/unit-tests.yml/badge.svg)](https://github.com/victoraugustoas/finance-manager/actions/workflows/unit-tests.yml)
[![codecov](https://codecov.io/github/victoraugustoas/finance-manager/graph/badge.svg?token=E48S83JRKN)](https://codecov.io/github/victoraugustoas/finance-manager)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-11-f69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

Personal finance manager in TypeScript: record expenses, incomes, and transfers between accounts, with a foundation for analyses (for example, charts of largest expenses and incomes). The project follows **Clean Architecture** and **DDD** (Domain-Driven Design).

## Technologies

| Technology        | Primary use |
| ----------------- | ----------- |
| TypeScript 6      | Language and strict typing |
| Node.js 25        | Runtime (exact version in `.nvmrc`) |
| NestJS 11         | HTTP API and adapters (`src/main.ts`, Nest modules under `src/modules/*/infra/`); OpenAPI via `@nestjs/swagger` (Swagger UI at `/api`) |
| PostgreSQL        | Database (local stack via `docker compose`; see Installation) |
| Prisma 7          | ORM (`prisma/schema.prisma`; run `pnpm prisma:generate` after schema edits) |
| ESLint + Prettier | Linting and formatting |
| Jest 30           | Unit tests (`src/**/test/**` and `test/shared/**`) |
| pnpm 12           | Package manager (Corepack / CI) |

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

### API documentation (OpenAPI)

After starting the app (`pnpm start:dev` or `pnpm start`), **Swagger UI** and the generated OpenAPI document are available at **`/api`** (for example `http://localhost:3000/api` when `PORT` is unset). Controllers and DTOs use decorators such as `@ApiProperty`, `@ApiBody`, `@ApiCreatedResponse`, and `@ApiOkResponse` so request and response schemas stay aligned with the HTTP API.

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
| `pnpm test`            | Unit tests (Jest) and the bpmn-js script tests |
| `pnpm bpmn:svg`        | Validate a `.bpmn` with bpmn-js, write the sibling `.svg`, and print a Markdown image link (`--from <file.md>` makes the path relative to that file) |
| `pnpm test:watch`      | Jest in watch mode |
| `pnpm test:cov`        | Tests with coverage |
| `pnpm prisma:generate` | `prisma generate` (refresh client after `prisma/schema.prisma` changes) |
| `pnpm prisma:migrate`  | `prisma migrate dev` |
| `pnpm prisma:studio`   | Prisma Studio |

**Current state:** the Nest entry point is `src/main.ts` (`EntryPointModule`), which imports one Nest module per bounded context from `src/modules/<module>/infra/<module>.module.ts`. HTTP controllers cover `/accounts`, `/categories`, `/transactions`, and `/reporting`; successful flows return JSON bodies described in Swagger. Reliable commands include `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm format`, and `pnpm prisma:generate`. Applying schema changes with `pnpm prisma:migrate` requires PostgreSQL (`DATABASE_URL`) and uses migrations under `prisma/migrations`.

## Project structure

Top-level under `src/`: `main.ts`, `entrypoint/` (root Nest module), `shared/` (kernel), and `modules/` with one folder
per bounded context (`account`, `category`, `transaction`, `reporting`).

**`shared/`** — cross-cutting building blocks imported exclusively through the `@/shared` alias: `base/` (`result`,
`result-validator`, `result-error`, `entity`, `aggregate-root`, `vo`, `metadata`, `message`, `UseCase`),
`ValueObjects/` (`id.vo`, `money.vo`, `reporting-period.vo`), `enums/` (`category-type`, `transaction-type`),
`errors/` (`shared-errors`, `validation-error`, `validation-errors`), `infra/` (`prisma.service`, HTTP error mapping),
and `events/` (outbox infrastructure — `outbox-event`, `events.module`, and sub-folders `infra/` with
`save-with-outbox`, `outbox-relay.service`, `event-consumer`, `nest-event-emitter-publisher`,
`prisma-outbox.repository`, and `ports/` with `event-publisher`, `outbox-repository`).

**Modules (common layout)** — every module follows the same shape:

```text
src/modules/<module>/<aggregate>/model|provider|use-case|dto|service   # domain and application
src/modules/<module>/infra/<aggregate>/provider/prisma-*.repository.ts # write adapters
src/modules/<module>/infra/<aggregate>/provider/prisma-*.query.ts      # read adapters
src/modules/<module>/infra/<aggregate>/dto/*.http.dto.ts               # HTTP contracts
src/modules/<module>/infra/<aggregate>/<aggregate>.controller.ts       # REST controller
src/modules/<module>/infra/<module>.module.ts                          # Nest wiring
src/modules/<module>/test/<aggregate>/*.test.ts                        # unit tests (mocks in test/mock/)
```

`model/`, `use-case/` and `service/` exist only in the aggregate; the `infra/` layer mirrors the aggregate's `dto/` and
`provider/` folders, one Prisma file per domain contract.

**Module-specific notes**

| Module          | Notes |
| --------------- | ----- |
| **account**     | Aggregate `account`: entity plus the `create-account` use case |
| **category**    | Aggregate `category`: `Category` root with nested `SubCategory`, plus the categories listing query |
| **transaction** | Aggregate `transaction`: `Expense`, `Income` and `Transfer` roots, domain events, ACL queries (`account-reference`, `category-hierarchy`) and listing queries |
| **reporting**   | Read-only module: queries, projection DTOs, pure domain services (`service/`) and read use cases (`find-*`) |

Other project roots: `prisma/` holds the schema and migrations; `test/shared/` holds the kernel unit tests;
`openspec/` holds specs and changes; `.agents/skills/` holds the authoring skills.

## Architecture

- **Clean Architecture:** the aggregate folder holds domain and application code (entities, value objects, use cases, domain services, provider contracts as interfaces) while `infra/` holds adapters (Prisma repositories and queries, HTTP DTOs, controllers, Nest module).
- **CQRS:** writes go through `use-case/*.use-case.ts` over repository contracts; reads go through `provider/*.query.ts` contracts that controllers call directly. A `find-*.use-case.ts` read use case exists only by exception (reporting combines several queries or applies rules SQL cannot express), and each one documents that justification in a comment.
- **DDD:** aggregates, entities, value objects, and domain events where applicable; bounded contexts mapped to folders under `src/modules/`.
- **Outbox pattern:** domain events are persisted atomically alongside the aggregate in an `OutboxEvent` table via `saveWithOutbox`. `OutboxRelayService` polls every 5 s, dispatches pending events through NestJS `EventEmitter2`, and marks them processed. Consumers extend `EventConsumer<TPayload>` (in `shared/events/infra/`) which handles idempotency via a `ProcessedEvent` table.

**Bounded contexts (product view):**

| Context           | Responsibility |
| ----------------- | -------------- |
| **Account**       | Lifecycle of financial accounts |
| **Transaction**   | Expenses, incomes, and transfers |
| **Category**      | Expense and income categories |
| **Reporting**     | Aggregates for analysis (e.g. `GET /reporting/accounts` returns account balances; `GET /reporting/categories/breakdown` returns `{ "categories": [...] }` with at most six rows; overflow is aggregated under `Others` per domain rules) |
| **Notifications** | Reactive context driven by events (a module under `src/modules/` only once implemented) |

The `src/shared` tree holds domain primitives under `shared/base` (`Result`, `UseCase`, `Entity`, `AggregateRoot`, the value-object base) and reusable value objects under `shared/ValueObjects` (`Id`, `Money`, `ReportingPeriod`).

## Conventions

- Files use **kebab-case** with English suffixes: `<name>.entity.ts`, `<name>.vo.ts`, `<name>.repository.ts`, `<name>.query.ts`, `<verb>-<name>.use-case.ts`, `<name>.service.ts`, `*.http.dto.ts`, `prisma-<name>.repository.ts`, `prisma-<name>.query.ts`, `<aggregate>.controller.ts`, `<module>.module.ts`. The one exception is `@/shared/base/UseCase`, whose path the `module-*` skills still reference.
- Classes and interfaces stay **PascalCase**; barrel files named `index.ts` stay lowercase.
- Tests use the `.test.ts` suffix and live in `src/modules/<module>/test/` (module code) or `test/shared/` (kernel). In-memory repository mocks live under `test/**/mock/`, never inside the aggregate.
- Monetary values are stored and passed around in minor units (cents) inside the domain; HTTP DTOs expose decimal amounts.
- TypeScript path alias: `@/*` → `src/*` (see `tsconfig.json` `compilerOptions.paths`); the kernel is always imported as `@/shared/...`, never by relative path.
- Authoring skills live in `.agents/skills/module-*` (aggregate, entity, value object, domain service, repository, query CQRS, DTO, use case) and are the source of truth for structure and naming.
- OpenSpec changes use the `spec-driven-bpmn` schema. When a capability's delta changes its business process, the change carries `specs/<capability>/process.bpmn` (BPMN 2.0 XML) and `process.svg`. `pnpm bpmn:svg -- <file.bpmn>` validates the XML with bpmn-js and writes the SVG. Markdown in the same directory references it as `![Process name](process.svg)` inside the spec `## Purpose`. From another file, `pnpm bpmn:svg -- <file.bpmn> --from <file.md>` prints the relative image link. Retiring that process uses `process.retired` and removes that image line. After spec sync, the archive skill copies or deletes `openspec/specs/<capability>/process.bpmn` and `process.svg`. The `openspec archive` CLI merges only `spec.md` and does not promote the diagram.

See `AGENTS.md` for more detail for contributors and tooling.

## Git Hooks

Hooks live in `.githooks` (enabled by the npm/pnpm `prepare` script after `pnpm install`):

| Hook           | Behavior |
| -------------- | ---------- |
| **pre-commit** | For each staged `.ts` file: Prettier + ESLint with fix, then re-stage |
| **pre-push**   | Runs `pnpm test` before push |

## CI/CD

On GitHub Actions, the **PR Check** workflow (`.github/workflows/unit-tests.yml`) runs on **pull requests** and on **pushes to `main`**: checkout, pnpm via `pnpm/action-setup` (version from `packageManager`), Node from `.nvmrc`, `pnpm install --frozen-lockfile`, `pnpm prisma:generate`, and `pnpm test:cov`. A step verifies that `coverage/lcov.info` exists. Coverage is uploaded to [Codecov](https://codecov.io/gh/victoraugustoas/finance-manager) via **OIDC** (`use_oidc: true` on `codecov/codecov-action@v7`, workflow `permissions: id-token: write`) so you do not need a `CODECOV_TOKEN` secret for uploads from this repo's Actions. The Codecov step is configured with `fail_ci_if_error: false` so an upload failure does not fail the job. Install the [Codecov GitHub app](https://github.com/apps/codecov) on the repository if uploads still fail (required for OIDC trust in some setups). Jest reporters include `lcov` in `jest.config.ts`.

---

License: **ISC** (see `package.json`).
