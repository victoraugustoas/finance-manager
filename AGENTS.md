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

### Use cases

Each context organizes application operations with CQRS: commands under `src/{context}/core/commands/`, queries under `src/{context}/core/queries/`, and ports under `src/{context}/core/ports/`.
Those files describe the use cases and their business rules.

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

### Shared folder

The shared folder contains base classes used across multiple contexts.

- Result: class to encapsulate results.
- ValueObject: class to represent value objects.
- Entity: class to represent entities.
- RootAggregate: class to represent aggregate roots.

### File naming convention

Code component files (classes, entities, value objects, aggregates, use cases, etc.) must use **PascalCase**.

Examples: `Account.ts`, `Category.ts`, `SubCategory.ts`, `AggregateRoot.ts`, `Money.ts`, `Result.ts`.

Test files follow the same pattern with the `.spec.ts` suffix: `Account.spec.ts`, `Money.spec.ts`.

Exceptions: `index.ts` (barrel files) remain in lowercase.

## Skills

- `.agents/skills/update-readme/SKILL.md` — Keep `README.md` up to date. Use at the end of any task that changes the project's structure, dependencies, scripts, contexts, environment variables, or conventions.
- `.agents/skills/create-value-object/SKILL.md` — Create a new Value Object following DDD. Use when encapsulating a primitive concept (email, CPF, phone, date range, etc.) that has invariants or behaviour.

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

- The project uses NestJS with `src/main.ts` and HTTP controllers (e.g. accounts, categories). `pnpm start:dev` runs the app when `DATABASE_URL` is set and migrations are applied.
- Prisma uses `prisma/schema.prisma` and migrations under `prisma/migrations`. Run `pnpm prisma:generate` after schema edits; apply migrations with `pnpm prisma:migrate` (requires PostgreSQL).
- PostgreSQL is required for persistence at runtime. Configure `DATABASE_URL` (see `.env` / Docker Compose as documented in `README.md`).
- Prisma 7 does not officially support Node.js 25 (only 20.19+, 22.12+, 24.0+), but it works fine for build/test. Ignore the preinstall warning.
- The dependencies `@eslint/js` and `typescript-eslint` were added to `package.json` because `eslint.config.mjs` imports them but they were not declared — these are required for `pnpm lint` to work.
- The `pnpm.onlyBuiltDependencies` config was added to `package.json` to allow build scripts from `@nestjs/core`, `@prisma/engines`, `prisma`, and `unrs-resolver` without requiring interactive approval.
- For a quick reference of available scripts, see the `scripts` section in `package.json`.
