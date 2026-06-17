# Prisma to TypeORM Migration Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task after Victor approves the migration strategy.

**Goal:** Replace Prisma ORM with TypeORM in the Finance Manager backend while preserving the current PostgreSQL schema, Clean Architecture boundaries, domain behavior, and API contracts.

**Architecture:** Keep domain/application ports unchanged and swap only infrastructure adapters. Introduce a shared TypeORM database module + entities, then migrate each Prisma repository/reader to a TypeORM equivalent one bounded context at a time. Keep `synchronize: false`; migrations must be explicit and reviewed.

**Tech Stack:** NestJS 11, TypeScript 6, PostgreSQL, TypeORM, `@nestjs/typeorm`, Jest, pnpm.

---

## Current State Summary

### Branch

Created branch:

```bash
git switch -c refactor/prisma-to-typeorm
```

Base branch at creation time: `feat/reporting-statement-query`.

### Prisma footprint found

Runtime and tests currently depend on Prisma in these areas:

- Shared DB service:
  - `src/shared/infra/PrismaService.ts`
- Outbox infrastructure:
  - `src/shared/events/infra/saveWithOutbox.ts`
  - `src/shared/events/infra/PrismaOutboxRepository.ts`
- Repositories:
  - `src/accounts/infra/database/repositories/PrismaAccounts.repository.ts`
  - `src/category/infra/database/repositories/PrismaCategories.repository.ts`
  - `src/transactions/infra/database/repositories/PrismaTransactions.repository.ts`
- Transaction readers:
  - `src/transactions/infra/database/readers/PrismaTransactionAccountReader.ts`
  - `src/transactions/infra/database/readers/PrismaTransactionCategoryHierarchyReader.ts`
  - `src/transactions/infra/database/readers/PrismaListExpenseReader.ts`
  - `src/transactions/infra/database/readers/PrismaListIncomeReader.ts`
  - `src/transactions/infra/database/readers/PrismaListTransfersReader.ts`
- Reporting readers:
  - `src/reporting/infra/database/readers/PrismaBreakdownCategoriesReader.ts`
  - `src/reporting/infra/database/readers/PrismaListAccountsReader.ts`
  - `src/reporting/infra/database/readers/PrismaListTransactionsReader.ts`
  - `src/reporting/infra/database/readers/PrismaStatementReader.ts`
- Nest modules currently provide `PrismaService` directly in:
  - `src/entrypoint/entrypoint.module.ts`
  - context modules under `src/**/infra/module/*.module.ts`
  - `src/shared/events/EventsModule.ts`

### Current database schema

The current Prisma schema defines these tables/enums:

- Tables:
  - `Account`
  - `Category`
  - `SubCategory`
  - `Transaction`
  - `Transfer`
  - `OutboxEvent`
  - `ProcessedEvent`
- Enums:
  - `CategoryType`: `INCOME`, `EXPENSE`
  - `TransactionType`: `INCOME`, `EXPENSE`
  - `OutboxEventStatus`: `PENDING`, `PROCESSING`, `PROCESSED`, `FAILED`

Important schema details to preserve:

- Table names are PascalCase and currently quoted in SQL migrations.
- `Account.name` is unique.
- `Category` has unique `(name, type)`.
- `SubCategory.categoryId` cascades on category deletion.
- `Transaction.amount`, `Transfer.amount`, and `Account.openingBalance` are stored in cents as integers.
- `OutboxEvent.payload` is JSON.
- `ProcessedEvent` has unique `(eventId, handler)`.
- Indexes exist on transaction/transfer foreign-key columns and outbox status/date.

---

## Proposed Migration Strategy

### Recommended path: adapter-by-adapter replacement, no domain rewrite

Do **not** rewrite domain models, handlers, controllers, DTOs, or ports unless a TypeORM migration forces it. The existing Clean Architecture boundary is good: Prisma is already mostly contained in `infra/database` and `shared/events/infra`.

The migration should happen in these layers:

1. Add TypeORM dependencies and shared database module.
2. Model the existing DB schema as TypeORM entities.
3. Replace Prisma transaction/outbox helper with TypeORM `DataSource.transaction` helper.
4. Replace write repositories.
5. Replace ACL/readers used by command validation.
6. Replace list/reporting readers.
7. Swap Nest module providers from Prisma classes to TypeORM classes.
8. Remove Prisma packages/generated client/scripts only after every reference is gone.
9. Update docs and verification commands.

### Migration ownership decision

Recommended:

- Use TypeORM migrations going forward.
- Keep `synchronize: false` in every environment.
- Add a **baseline TypeORM migration** that creates the current schema.
  - For a fresh DB: run it normally.
  - For an existing DB already created by Prisma migrations: run it with TypeORM fake mode or manually record it in the TypeORM migrations table after validating schema equivalence.

Alternative:

- Keep Prisma migrations as historical SQL only and start TypeORM migrations from the next schema change.
- This is simpler short-term but weaker for fresh-environment setup because a new DB still depends on old Prisma migration tooling.

My recommendation: create the TypeORM baseline migration and document the existing-DB `--fake` path.

---

## Naming and File Layout

### Shared TypeORM infrastructure

Create:

- `src/shared/infra/typeorm/TypeOrmDatabaseModule.ts`
- `src/shared/infra/typeorm/TypeOrmDataSourceOptions.ts`
- `src/shared/infra/typeorm/entities/Account.orm-entity.ts`
- `src/shared/infra/typeorm/entities/Category.orm-entity.ts`
- `src/shared/infra/typeorm/entities/SubCategory.orm-entity.ts`
- `src/shared/infra/typeorm/entities/Transaction.orm-entity.ts`
- `src/shared/infra/typeorm/entities/Transfer.orm-entity.ts`
- `src/shared/infra/typeorm/entities/OutboxEvent.orm-entity.ts`
- `src/shared/infra/typeorm/entities/ProcessedEvent.orm-entity.ts`
- `src/shared/infra/typeorm/entities/index.ts`

Why shared entities? The same tables are read/written by multiple bounded contexts: for example `reporting` reads `Account`, `Transaction`, `Transfer`, `Category`, and `SubCategory`. Keeping persistence entities centralized avoids duplicate mappings.

### TypeORM adapter naming

Create new adapters beside current Prisma adapters first:

- `TypeOrmAccounts.repository.ts`
- `TypeOrmCategories.repository.ts`
- `TypeOrmTransactions.repository.ts`
- `TypeOrmTransactionAccountReader.ts`
- `TypeOrmTransactionCategoryHierarchyReader.ts`
- `TypeOrmListExpenseReader.ts`
- `TypeOrmListIncomeReader.ts`
- `TypeOrmListTransfersReader.ts`
- `TypeOrmBreakdownCategoriesReader.ts`
- `TypeOrmListAccountsReader.ts`
- `TypeOrmListTransactionsReader.ts`
- `TypeOrmStatementReader.ts`
- `TypeOrmOutboxRepository.ts`
- `saveWithTypeOrmOutbox.ts`

Only delete Prisma files after the TypeORM versions are wired and tests pass.

---

## Entities Draft

Example shape only; final code should be adjusted while implementing.

```ts
// src/shared/infra/typeorm/entities/Account.orm-entity.ts
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TransactionOrmEntity } from './Transaction.orm-entity';
import { TransferOrmEntity } from './Transfer.orm-entity';

@Entity({ name: 'Account' })
export class AccountOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  name!: string;

  @Column({ type: 'integer' })
  openingBalance!: number;

  @OneToMany(() => TransactionOrmEntity, (transaction) => transaction.account)
  transactions!: TransactionOrmEntity[];

  @OneToMany(() => TransferOrmEntity, (transfer) => transfer.accountOrigin)
  transfersAsOrigin!: TransferOrmEntity[];

  @OneToMany(() => TransferOrmEntity, (transfer) => transfer.accountDestination)
  transfersAsDestination!: TransferOrmEntity[];
}
```

```ts
// src/shared/infra/typeorm/entities/Category.orm-entity.ts
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SubCategoryOrmEntity } from './SubCategory.orm-entity';
import { TransactionOrmEntity } from './Transaction.orm-entity';

export enum CategoryTypeOrm {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

@Entity({ name: 'Category' })
@Index(['name', 'type'], { unique: true })
export class CategoryOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'enum', enum: CategoryTypeOrm, enumName: 'CategoryType' })
  type!: CategoryTypeOrm;

  @OneToMany(() => SubCategoryOrmEntity, (subCategory) => subCategory.category)
  subCategories!: SubCategoryOrmEntity[];

  @OneToMany(() => TransactionOrmEntity, (transaction) => transaction.category)
  transactions!: TransactionOrmEntity[];
}
```

```ts
// src/shared/infra/typeorm/entities/Transaction.orm-entity.ts
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AccountOrmEntity } from './Account.orm-entity';
import { CategoryOrmEntity } from './Category.orm-entity';
import { SubCategoryOrmEntity } from './SubCategory.orm-entity';

export enum TransactionTypeOrm {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

@Entity({ name: 'Transaction' })
@Index(['accountId'])
@Index(['categoryId'])
@Index(['subCategoryId'])
export class TransactionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'integer' })
  amount!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'timestamptz' })
  dueDate!: Date;

  @Column({ type: 'timestamptz' })
  entryDate!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  effectivatedDate!: Date | null;

  @Column({ type: 'boolean' })
  effectivated!: boolean;

  @Column({ type: 'enum', enum: TransactionTypeOrm, enumName: 'TransactionType' })
  type!: TransactionTypeOrm;

  @Column({ type: 'uuid' })
  categoryId!: string;

  @Column({ type: 'uuid' })
  subCategoryId!: string;

  @Column({ type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => AccountOrmEntity, (account) => account.transactions)
  @JoinColumn({ name: 'accountId' })
  account!: AccountOrmEntity;

  @ManyToOne(() => CategoryOrmEntity, (category) => category.transactions)
  @JoinColumn({ name: 'categoryId' })
  category!: CategoryOrmEntity;

  @ManyToOne(() => SubCategoryOrmEntity, (subCategory) => subCategory.transactions)
  @JoinColumn({ name: 'subCategoryId' })
  subCategory!: SubCategoryOrmEntity;
}
```

Need to verify exact `timestamp` vs `timestamptz` against the existing Prisma SQL migrations before finalizing entity column types.

---

## Task Plan

### Phase 0: Confirm decisions before coding

**Objective:** Align on migration policy before changing runtime code.

**Decisions needed from Victor:**

1. Should the TypeORM migration start from current feature branch `feat/reporting-statement-query`, or should we rebase/create from `main` first?
2. Should we preserve PascalCase DB table names exactly (`Account`, `Transaction`, etc.)? Recommendation: yes, to avoid data migration.
3. Should the first TypeORM migration be a full baseline schema migration? Recommendation: yes.
4. For existing DBs, should we document `migration:run --fake` for the baseline? Recommendation: yes.
5. Should we rename error codes from `PRISMA_*` to generic `DATABASE_*`? Recommendation: yes, in the same migration PR if tests are updated together.

**No code implementation should proceed until these are agreed.**

---

### Phase 1: Add TypeORM dependencies and scripts

**Objective:** Install TypeORM without removing Prisma yet.

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Changes:**

Install:

```bash
pnpm add typeorm @nestjs/typeorm
```

`pg` already exists and should remain.

Add scripts:

```json
{
  "typeorm": "typeorm-ts-node-commonjs",
  "typeorm:migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/shared/infra/typeorm/TypeOrmDataSource.ts",
  "typeorm:migration:run": "typeorm-ts-node-commonjs migration:run -d src/shared/infra/typeorm/TypeOrmDataSource.ts",
  "typeorm:migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/shared/infra/typeorm/TypeOrmDataSource.ts"
}
```

**Verification:**

```bash
pnpm build
pnpm test
```

Expected: pass with Prisma still active.

---

### Phase 2: Add TypeORM database module and entities

**Objective:** Represent the current database schema in TypeORM without wiring runtime providers yet.

**Files:**

- Create: `src/shared/infra/typeorm/TypeOrmDataSource.ts`
- Create: `src/shared/infra/typeorm/TypeOrmDatabaseModule.ts`
- Create: `src/shared/infra/typeorm/entities/*.orm-entity.ts`
- Create: `src/shared/infra/typeorm/entities/index.ts`

**Implementation notes:**

- Use `ConfigModule.forRoot()` / `process.env.DATABASE_URL` consistently with current app setup.
- Use `synchronize: false`.
- Use `migrationsRun: false`.
- Register all entities centrally.
- Preserve existing enum names with `enumName`.
- Preserve exact table names with `@Entity({ name: '...' })`.

**Verification:**

```bash
pnpm build
pnpm test
```

Expected: pass. No runtime behavior changed yet.

---

### Phase 3: Add TypeORM outbox transaction helper

**Objective:** Replace Prisma `$transaction` outbox behavior with TypeORM `DataSource.transaction` while preserving atomic save + outbox insert.

**Files:**

- Create: `src/shared/events/infra/saveWithTypeOrmOutbox.ts`
- Create/modify tests mirroring: `src/shared/events/infra/saveWithOutbox.spec.ts`

**Shape:**

```ts
import { DataSource, EntityManager } from 'typeorm';
import { DomainEvent } from '@/shared/base/DomainEvent';
import { OutboxEventStatus } from '@/shared/events/OutboxEvent';
import { OutboxEventOrmEntity } from '@/shared/infra/typeorm/entities';

export async function saveWithTypeOrmOutbox(
  dataSource: DataSource,
  events: ReadonlyArray<DomainEvent>,
  operation: (manager: EntityManager) => Promise<void>,
): Promise<void> {
  await dataSource.transaction(async (manager) => {
    await operation(manager);

    if (events.length > 0) {
      await manager.getRepository(OutboxEventOrmEntity).insert(
        events.map((event) => ({
          id: event.eventId,
          eventName: event.eventName,
          payload: event.payload,
          occurredAt: event.occurredAt,
          status: OutboxEventStatus.PENDING,
        })),
      );
    }
  });
}
```

**Verification:**

```bash
pnpm test -- saveWithTypeOrmOutbox
pnpm test
```

Expected: helper persists outbox rows inside same transaction; failure in operation rolls back outbox.

---

### Phase 4: Migrate shared outbox repository

**Objective:** Replace `PrismaOutboxRepository` with `TypeOrmOutboxRepository`.

**Files:**

- Create: `src/shared/events/infra/TypeOrmOutboxRepository.ts`
- Create/modify: `src/shared/events/infra/TypeOrmOutboxRepository.spec.ts`
- Modify: `src/shared/events/EventsModule.ts`

**Important behavior:**

- `claimPending(limit)` must atomically claim pending events.
- Current Prisma implementation does `findMany` + `updateMany` inside one transaction but does not lock rows explicitly.
- With TypeORM/Postgres, prefer row-level locking:
  - query pending rows ordered by `createdAt ASC`
  - use `FOR UPDATE SKIP LOCKED`
  - update selected IDs to `PROCESSING`
  - return selected events

**Verification:**

```bash
pnpm test -- TypeOrmOutboxRepository
pnpm test -- EventConsumer
pnpm test
```

Expected: event polling/idempotency behavior remains unchanged.

---

### Phase 5: Migrate write repositories by bounded context

**Objective:** Replace Prisma repositories behind existing ports, one context at a time.

#### 5.1 Accounts

**Files:**

- Create: `src/accounts/infra/database/repositories/TypeOrmAccounts.repository.ts`
- Create/modify: `src/accounts/infra/database/repositories/TypeOrmAccounts.repository.spec.ts`
- Modify: `src/accounts/infra/module/accounts.module.ts`

**Mapping notes:**

- `save(account)` should use `manager.getRepository(AccountOrmEntity).upsert(...)` inside `saveWithTypeOrmOutbox`.
- TypeORM `upsert` conflict target: `['id']`.
- Preserve `openingBalance` in cents.

#### 5.2 Categories

**Files:**

- Create: `src/category/infra/database/repositories/TypeOrmCategories.repository.ts`
- Create/modify tests
- Modify: `src/category/infra/module/categories.module.ts`

**Mapping notes:**

- Preserve category/subcategory inserts and unique `(name, type)` behavior.
- Preserve cascade semantics for subcategories.

#### 5.3 Transactions

**Files:**

- Create: `src/transactions/infra/database/repositories/TypeOrmTransactions.repository.ts`
- Create/modify tests
- Modify: `src/transactions/infra/module/transactions.module.ts`

**Mapping notes:**

- Replace `PrismaTransactionType` with `TransactionTypeOrm` or shared enum mapping.
- Preserve `Money.amountInCents` conversions.
- Save expenses/incomes in `Transaction` table; transfers in `Transfer` table.
- Preserve outbox atomicity.

**Verification for Phase 5:**

```bash
pnpm test -- TypeOrmAccounts
pnpm test -- TypeOrmCategories
pnpm test -- TypeOrmTransactions
pnpm test
```

---

### Phase 6: Migrate command-side ACL readers

**Objective:** Migrate readers used by command handlers to validate existence/hierarchy.

**Files:**

- Create: `src/transactions/infra/database/readers/TypeOrmTransactionAccountReader.ts`
- Create: `src/transactions/infra/database/readers/TypeOrmTransactionCategoryHierarchyReader.ts`
- Create/modify corresponding specs
- Modify: `src/transactions/infra/module/transactions.module.ts`

**Verification:**

```bash
pnpm test -- TypeOrmTransactionAccountReader
pnpm test -- TypeOrmTransactionCategoryHierarchyReader
pnpm test -- RegisterExpense
pnpm test -- RegisterIncome
pnpm test -- RegisterTransfer
```

Expected: command validation behavior unchanged.

---

### Phase 7: Migrate transaction list readers

**Objective:** Replace transaction read-side Prisma readers.

**Files:**

- Create: `src/transactions/infra/database/readers/TypeOrmListExpenseReader.ts`
- Create: `src/transactions/infra/database/readers/TypeOrmListIncomeReader.ts`
- Create: `src/transactions/infra/database/readers/TypeOrmListTransfersReader.ts`
- Create/modify specs
- Modify: `src/transactions/infra/module/transactions.module.ts`

**Verification:**

```bash
pnpm test -- TypeOrmListExpenseReader
pnpm test -- TypeOrmListIncomeReader
pnpm test -- TypeOrmListTransfersReader
pnpm test -- Transactions.controller
```

Expected: list endpoints keep response shape and ordering.

---

### Phase 8: Migrate reporting readers

**Objective:** Replace reporting Prisma readers, including aggregate/raw SQL equivalents.

**Files:**

- Create: `src/reporting/infra/database/readers/TypeOrmBreakdownCategoriesReader.ts`
- Create: `src/reporting/infra/database/readers/TypeOrmListAccountsReader.ts`
- Create: `src/reporting/infra/database/readers/TypeOrmListTransactionsReader.ts`
- Create: `src/reporting/infra/database/readers/TypeOrmStatementReader.ts`
- Create/modify specs
- Modify: `src/reporting/infra/module/reporting.module.ts`

**Mapping notes:**

- For simple reads, use repository `.find` / query builder with relations.
- For category breakdown, use QueryBuilder or raw SQL through `dataSource.query`.
- Preserve exact money conversion from cents.
- Preserve transfer balance-impact rules in `StatementReader`.
- Preserve sorting:
  - due date asc
  - name asc pt-BR where currently done in app memory
  - id asc

**Verification:**

```bash
pnpm test -- TypeOrmBreakdownCategoriesReader
pnpm test -- TypeOrmListAccountsReader
pnpm test -- TypeOrmListTransactionsReader
pnpm test -- TypeOrmStatementReader
pnpm test -- Reporting.controller
pnpm test
```

---

### Phase 9: Swap root modules to TypeORM and remove Prisma runtime

**Objective:** Make the app boot with TypeORM only.

**Files:**

- Modify: `src/entrypoint/entrypoint.module.ts`
- Modify: all context modules under `src/**/infra/module/*.module.ts`
- Modify: `src/shared/events/EventsModule.ts`
- Delete after all references are gone:
  - `src/shared/infra/PrismaService.ts`
  - all `Prisma*.ts` adapters replaced by TypeORM equivalents

**Verification:**

```bash
search_files "PrismaService|generated/prisma|@prisma/client|Prisma\." src --file_glob "*.ts"
pnpm build
pnpm test
```

Expected: no Prisma runtime references remain.

---

### Phase 10: Migrations and Prisma removal

**Objective:** Move schema ownership to TypeORM.

**Files:**

- Create: `src/shared/infra/typeorm/migrations/<timestamp>-BaselineSchema.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Optionally remove after migration strategy is approved:
  - `prisma/schema.prisma`
  - `prisma/migrations/**`

**Dependencies to remove once all references are gone:**

```bash
pnpm remove @prisma/client @prisma/adapter-pg prisma
```

**Scripts to remove:**

- `prisma:generate`
- `prisma:migrate`
- `prisma:studio`

**Docs to update:**

- `README.md`
- `AGENTS.md`
- any `.agents/skills/*` that mention Prisma commands or Prisma infrastructure

**Verification:**

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test
```

If a local database is available:

```bash
pnpm typeorm:migration:run
pnpm start:dev
```

Then smoke-test endpoints:

- `POST /accounts`
- `POST /categories`
- `POST /transactions/expenses`
- `POST /transactions/incomes`
- `GET /reporting/accounts?endDate=...`
- `GET /reporting/statement?endDate=...`

---

## Testing Strategy

### Unit tests

Keep existing behavior tests. For each Prisma adapter spec, create or rename the TypeORM equivalent spec. The expected behavior should be identical.

### Integration-like adapter tests

If current adapter tests mock Prisma method chains heavily, prefer replacing them with narrower tests around:

- mapping domain model → persistence shape
- mapping persistence row → domain/read DTO
- query filters and ordering
- outbox transaction behavior

### Full validation commands

Minimum before merge:

```bash
pnpm build
pnpm lint
pnpm test
pnpm test:cov
```

With DB available:

```bash
pnpm typeorm:migration:run
pnpm start:dev
```

---

## Risks and Mitigations

### Risk: TypeORM enum names differ from Prisma enum names

Mitigation: use explicit `enumName` matching the existing PostgreSQL enum names. Confirm by inspecting generated Prisma SQL migrations.

### Risk: Table names/column names drift

Mitigation: set explicit `@Entity({ name })`, `@Column({ name })`, `@JoinColumn({ name })`, and index names where necessary.

### Risk: Existing DB cannot run baseline migration

Mitigation: document `migration:run --fake` for the baseline after schema equivalence is verified, or keep a manual SQL baseline insertion into TypeORM migration table.

### Risk: Outbox claim concurrency changes

Mitigation: use `FOR UPDATE SKIP LOCKED` and add tests around claiming pending events.

### Risk: raw SQL/reporting output changes

Mitigation: keep reporting reader tests focused on exact totals, order, and transfer balance impact.

### Risk: error enum still says Prisma

Mitigation: rename `PRISMA_INSERT_ERROR` and `PRISMA_QUERY_ERROR` to generic DB errors, or intentionally keep old codes temporarily for API compatibility. This needs a decision.

---

## Proposed Commit Sequence

1. `chore: add typeorm dependencies and database module`
2. `feat: add typeorm persistence entities`
3. `feat(events): add typeorm outbox transaction helper`
4. `refactor(events): migrate outbox repository to typeorm`
5. `refactor(accounts): migrate repository to typeorm`
6. `refactor(category): migrate repository to typeorm`
7. `refactor(transactions): migrate write repository to typeorm`
8. `refactor(transactions): migrate readers to typeorm`
9. `refactor(reporting): migrate readers to typeorm`
10. `chore: switch modules to typeorm providers`
11. `chore: remove prisma dependencies and scripts`
12. `docs: update persistence documentation`

---

## Open Questions for Victor

1. Quer que essa branch nasça da branch atual `feat/reporting-statement-query` ou prefere que eu recrie a partir da `main`?
2. Mantemos os nomes atuais das tabelas em PascalCase para evitar migração de dados?
3. Fazemos uma baseline migration completa do TypeORM e usamos `--fake` em bases existentes?
4. Podemos renomear os erros `PRISMA_*` para `DATABASE_*` nessa mesma migração?
5. Preferência para implementação:
   - tudo em um PR grande; ou
   - PRs menores por camada/contexto?

Minha recomendação: PRs menores por fase, começando por infraestrutura TypeORM + entidades, depois eventos/outbox, depois contextos.
