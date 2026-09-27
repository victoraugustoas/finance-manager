# Project overview

## Briefing

This project is a personal finance manager.
It can register expenses, incomes, and transfers between accounts.
It generates financial analyses such as charts showing where the largest expenses and incomes are,
allowing users to have a holistic view of their financial life.

## Project organization

The project is built using Clean Architecture and
DDD (Domain Driven Design) principles. Written in TypeScript.

### Technologies

- Typescript (v6)
- Node.js (.nvmrc)
- NestJS
- PostgreSQL
- Prisma
- Eslint
- Prettier
- Pnpm as a package manager

### Module layout

Business code lives in `src/modules/<module>/`, with the Nest bootstrap staying in `src/` (`main.ts`, `entrypoint/`):

```text
src/modules/<module>/<aggregate>/model|provider|use-case|dto|service   # domain and application
src/modules/<module>/infra/<aggregate>/provider/prisma-*.repository.ts # write adapters
src/modules/<module>/infra/<aggregate>/provider/prisma-*.query.ts      # read adapters
src/modules/<module>/infra/<aggregate>/dto/*.http.dto.ts               # HTTP contracts
src/modules/<module>/infra/<aggregate>/<aggregate>.controller.ts       # REST controller
src/modules/<module>/infra/<module>.module.ts                          # Nest wiring
src/modules/<module>/test/<aggregate>/*.test.ts                        # unit tests (mocks in test/mock/)
```

`model/`, `use-case/` and `service/` exist only in the aggregate; `infra/` mirrors the aggregate's `dto/` and
`provider/` folders, with one Prisma file per domain contract. Each module exposes `src/modules/<module>/index.ts`.

### Application operations

Writes are use cases in `<aggregate>/use-case/<verb>-<name>.use-case.ts` implementing `UseCase<IN, OUT>` over
repository contracts in `<aggregate>/provider/*.repository.ts`. Reads are query contracts in
`<aggregate>/provider/*.query.ts` with `execute(input)` returning `Result<DTO>`, called directly by controllers.
A read use case (`find-*.use-case.ts`) is allowed only by exception — combining several queries or applying rules that
do not fit SQL — and must document the justification in a comment. The legacy `CommandHandler` / `QueryHandler`
contracts no longer exist and must not be reintroduced.

### Bounded contexts

The system is organized into bounded contexts to define its functionalities.

#### Account

Responsible for the lifecycle of financial accounts.

#### Transaction

Manages expenses, incomes, and transfers.

#### Category

Manages expense and income categories.

#### Reporting

Aggregates and presents financial data for analysis (for example, breakdown of totals by category
over a period, with filters such as date range and posted status).

#### Notifications

Reactive context, triggered by events.

### Shared kernel

`src/shared/**` holds the kernel, imported exclusively through the `@/shared` alias (`@/*` → `src/*`), never by
relative path and never as a workspace package:

- `base/result`, `base/result-validator`, `base/result-error`: `Result` and its validation helpers.
- `base/entity`, `base/aggregate-root`: entity identity, `cloneWith`, pending domain events.
- `base/vo`, `base/metadata`, `base/message`: value-object base and error metadata.
- `base/UseCase`: `UseCase<IN, OUT>` contract (path kept in PascalCase because the `module-*` skills reference it).
- `ValueObjects/`: `Id`, `Money` (minor units), `ReportingPeriod`.
- `errors/`, `enums/`, `infra/`, `events/`: shared error codes, domain enums, `PrismaService` plus HTTP error mapping, and the outbox infrastructure.

### File naming convention

Code component files use **kebab-case** with English suffixes: `<name>.entity.ts`, `<name>.vo.ts`,
`<name>.repository.ts`, `<name>.query.ts`, `<verb>-<name>.use-case.ts`, `<name>.service.ts`, `*.http.dto.ts`,
`prisma-<name>.repository.ts`, `prisma-<name>.query.ts`, `<aggregate>.controller.ts`, `<module>.module.ts`.

Examples: `account.entity.ts`, `sub-category.entity.ts`, `money.vo.ts`, `create-account.use-case.ts`,
`prisma-list-categories.query.ts`.

Classes and interfaces stay in **PascalCase**. Tests use the `.test.ts` suffix under
`src/modules/<module>/test/` (module) or `test/shared/` (kernel); in-memory mocks live in `test/**/mock/`.

Exceptions: `index.ts` (barrel files) remain lowercase, and `@/shared/base/UseCase` keeps its historical path.

## Skills

- `.agents/skills/update-readme/SKILL.md` — Keep `README.md` up to date. Use at the end of any task that changes the project's structure, dependencies, scripts, contexts, environment variables, or conventions.
- `.agents/skills/module-aggregate/SKILL.md` — Scaffold a new aggregate inside an existing module.
- `.agents/skills/module-entity/SKILL.md` — Implement or review entities (`*.entity.ts`) over the shared `Entity`.
- `.agents/skills/module-value-object/SKILL.md` — Implement or review value objects (`*.vo.ts`).
- `.agents/skills/module-domain-service/SKILL.md` — Implement pure domain services (`*.service.ts`) inside an aggregate.
- `.agents/skills/module-repository/SKILL.md` — Write repository contracts and their Prisma adapters.
- `.agents/skills/module-query-cqrs/SKILL.md` — Write read-side query contracts and their Prisma adapters.
- `.agents/skills/module-dto/SKILL.md` — Write aggregate DTOs and HTTP DTOs.
- `.agents/skills/module-use-case/SKILL.md` — Write application use cases orchestrating providers and domain rules.

## Commands

- Install Node.js

```bash
nvm install
```

- Use the correct Node.js version

```bash
nvm use
```

- Install and enable Corepack

Corepack is not bundled with Node.js in many setups; install it globally, then enable it so pnpm can be managed by Corepack.

```bash
npm install -g corepack
corepack enable
```

- Install project dependencies

```bash
pnpm install
```

## Cursor Cloud specific instructions

- The project uses NestJS with `src/main.ts` and one Nest module per bounded context under `src/modules/<module>/infra/<module>.module.ts` (accounts, categories, transactions, reporting). `pnpm start:dev` runs the app when `DATABASE_URL` is set and migrations are applied; `.env` is loaded by `dotenv` in `src/main.ts`.
- Prisma uses `prisma/schema.prisma` and migrations under `prisma/migrations`. Run `pnpm prisma:generate` after schema edits; apply migrations with `pnpm prisma:migrate` (requires PostgreSQL).
- PostgreSQL is required for persistence at runtime. Configure `DATABASE_URL` (see `.env` / Docker Compose as documented in `README.md`).
- Prisma 7 does not officially support Node.js 25 (only 20.19+, 22.12+, 24.0+), but it works fine for build/test. Ignore the preinstall warning.
- The dependencies `@eslint/js` and `typescript-eslint` were added to `package.json` because `eslint.config.mjs` imports them but they were not declared — these are required for `pnpm lint` to work.
- The `pnpm.onlyBuiltDependencies` config was added to `package.json` to allow build scripts from `@nestjs/core`, `@prisma/engines`, `prisma`, and `unrs-resolver` without requiring interactive approval.
- For a quick reference of available scripts, see the `scripts` section in `package.json`.
