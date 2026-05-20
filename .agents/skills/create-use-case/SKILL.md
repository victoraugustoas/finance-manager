---
name: create-use-case
description: >-
  Creates a Use Case following DDD principles for this project. Use when the
  user asks to implement an application operation that orchestrates domain
  objects, repositories, queries, and domain services to fulfill a single
  business intent.
---

# Create Use Case (finance-manager)

## What a Use Case is

A Use Case is the entry point for a single business operation. It:

- Receives a **flat params object** (primitives, no domain objects).
- Delegates domain logic to **entities**, **domain services**, and **value objects**.
- Uses **providers** (repositories, queries) to load and persist data.
- Returns `Promise<Result<T>>` — either the produced value or a structured error.

A Use Case does **not** contain domain rules itself. If a validation or computation feels like business logic, it belongs in an entity or a domain service.

---

## Providers: repositories vs. queries

Both are **`abstract class`** (not interfaces) in `src/{context}/core/provider/` so that NestJS can use them as injection tokens.

| Kind | Naming | Purpose | Example methods |
|---|---|---|---|
| **Repository** | `{Context}Repository` | Persist and load aggregates of the **same context** | `save()`, `findById()` |
| **Query** | `{Purpose}Query` | Read-only checks or projections, often **cross-context** | `existsById()`, `ensureHierarchy()` |

> Repositories return full domain entities. Queries return `Result<void>` (existence checks) or lightweight DTOs — never full aggregates from another context.

---

## Rules for this project

1. Implement `UseCase<Params, Return>` from `@/shared/base`.
2. Place the file in `src/{context}/core/usecases/{Action}.usecase.ts`.
3. Export the params type from the same file: `export type {Action}Params = { … }`.
4. The **constructor** receives only providers (repositories and queries). Domain services are **not** injected — instantiate them with `new` inside `execute()`.
5. `execute()` is always `async` and returns `Promise<Result<Return>>`.
6. Use `Result.combine([…])` to batch-check multiple results before proceeding.
7. Use `.asFail()` to propagate a typed failure up the call chain.
8. Use `Result.ok()` (no argument) when the return type is `void`.
9. Fire independent async calls in parallel with `Promise.all([…])`.
10. Write a `*.spec.ts` next to the source file; mock all providers with `jest.fn()`.

---

## Execution flow patterns

### Pattern 1 — Create and persist

Used when the operation simply creates a new aggregate and saves it.

```typescript
async execute(params: MyParams): Promise<Result<MyAggregate>> {
  const created = MyAggregate.create(params);
  if (created.isFailure) return created.asFail();

  const persisted = await this.myRepository.save(created.value);
  if (persisted.isFailure) return persisted.asFail();

  return Result.ok(created.value);
}
```

---

### Pattern 2 — Create with reference checks

Used when the new aggregate references IDs that must exist beforehand. Domain creation and reference checks are independent — run them in parallel, then combine.

```typescript
async execute(params: MyParams): Promise<Result<MyAggregate>> {
  const created = MyAggregate.register(params);          // domain validation (sync)
  const [refA, refB] = await Promise.all([               // reference checks (async)
    this.someQuery.existsById(params.someId),
    this.otherQuery.existsById(params.otherId),
  ]);

  const combined = Result.combine([created, refA, refB]);
  if (combined.isFailure) return combined.asFail();

  const persisted = await this.myRepository.save(created.value);
  if (persisted.isFailure) return persisted.asFail();

  return Result.ok(created.value);
}
```

---

### Pattern 3 — Load, mutate, and save

Used when the operation modifies an existing aggregate.

```typescript
async execute(params: MyParams): Promise<Result<void>> {
  const loaded = await this.myRepository.findById(params.id);
  if (loaded.isFailure) return loaded.asFail();

  const mutated = loaded.value.someAction(params);
  if (mutated.isFailure) return mutated.asFail();

  return this.myRepository.save(mutated.value);
}
```

---

### Pattern 4 — Coordinate multiple aggregates via a domain service

Used when the operation must mutate aggregates from the same or different contexts, delegating the coordination logic to a Domain Service.

```typescript
async execute(params: MyParams): Promise<Result<void>> {
  const [aggA, aggB] = await Promise.all([
    this.repoA.findById(params.aggAId),
    this.repoB.findById(params.aggBId),
  ]);

  const combined = Result.combine([aggA, aggB]);
  if (combined.isFailure) return combined.asFail();

  const service = new MyDomainService(aggA.value, aggB.value);
  service.apply(params);

  const saved = Result.combine(
    await Promise.all([
      this.repoA.save(aggA.value),
      this.repoB.save(aggB.value),
    ]),
  );
  if (saved.isFailure) return saved;

  return Result.ok();
}
```

---

### Pattern 5 — Query and compute

Used for read operations that apply domain logic to query results (no persistence).

```typescript
// domain service field — instantiated once, no provider dependency
private readonly myComposer = new MyComposerService();

async execute(params: MyParams): Promise<Result<MyDTO>> {
  const period = SomeDomainConcept.create(params);
  if (period.isFailure) return period.asFail();

  const rows = await this.myQuery.execute({ period: period.value });
  if (rows.isFailure) return rows.asFail();

  return Result.ok(this.myComposer.compute(rows.value));
}
```

---

## Full template

```typescript
// src/{context}/core/usecases/MyAction.usecase.ts
import { Result, UseCase } from '@/shared/base';
import { MyAggregate } from '@/{context}/core/model/MyAggregate';
import { MyRepository } from '@/{context}/core/provider/My.repository';
import { SomeQuery } from '@/{context}/core/provider/Some.query';

export type MyActionParams = {
  // flat primitives only — no domain objects
  name: string;
  amount: number;
  relatedId: string;
};

export class MyActionUseCase implements UseCase<MyActionParams, MyActionReturn> {
  constructor(
    private readonly myRepository: MyRepository,
    private readonly someQuery: SomeQuery,
  ) {}

  async execute(params: MyActionParams): Promise<Result<MyActionReturn>> {
    const aggregate = MyAggregate.create(params);
    const refCheck = await this.someQuery.existsById(params.relatedId);

    const combined = Result.combine([aggregate, refCheck]);
    if (combined.isFailure) return combined.asFail();

    const persisted = await this.myRepository.save(aggregate.value);
    if (persisted.isFailure) return persisted.asFail();

    return Result.ok(aggregate.value);
  }
}
```

---

## Concrete examples

### Example 1: CreateCategoryUseCase (Pattern 1)

```typescript
// src/category/core/usecases/CreateCategory.usecase.ts
export class CreateCategoryUseCase implements UseCase<CreateCategoryParams, Category> {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async execute(params: CreateCategoryParams): Promise<Result<Category>> {
    const created = Category.create(params);
    if (created.isFailure) return created.asFail();

    const persisted = await this.categoriesRepository.save(created.value);
    if (persisted.isFailure) return persisted.asFail();

    return Result.ok(created.value);
  }
}
```

---

### Example 2: RegisterExpenseUseCase (Pattern 2)

```typescript
// src/transactions/core/usecases/RegisterExpense.usecase.ts
export class RegisterExpenseUseCase implements UseCase<RegisterExpenseParams, Expense> {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly accounts: TransactionAccountQuery,
    private readonly categoryHierarchy: TransactionCategoryHierarchyQuery,
  ) {}

  async execute(params: RegisterExpenseParams): Promise<Result<Expense>> {
    const expense = Expense.register(params);
    const [accountRef, categoryRef] = await Promise.all([
      this.accounts.existsById(params.accountId),
      this.categoryHierarchy.ensureExpenseHierarchy(params.categoryId, params.subCategoryId),
    ]);

    const combined = Result.combine([expense, accountRef, categoryRef]);
    if (combined.isFailure) return combined.asFail();

    const persisted = await this.transactionsRepository.saveExpense(expense.value);
    if (persisted.isFailure) return persisted.asFail();

    return Result.ok(expense.value);
  }
}
```

---

### Example 3: ApplyTransferBetweenAccountsUseCase (Pattern 4)

```typescript
// src/accounts/core/usecases/ApplyTransferBetweenAccounts.usecase.ts
export class ApplyTransferBetweenAccountsUseCase implements UseCase<…, void> {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  async execute(params: ApplyTransferBetweenAccountsParams): Promise<Result<void>> {
    const [accountOrigin, accountDestination] = await Promise.all([
      this.accountsRepository.findById(params.accountIdOrigin),
      this.accountsRepository.findById(params.accountIdDestination),
    ]);
    const amount = Money.create(params.amount);

    const combined = Result.combine([accountOrigin, accountDestination, amount]);
    if (combined.isFailure) return combined.asFail();

    const service = new ApplyTransferBetweenAccountsService(
      accountOrigin.value,
      accountDestination.value,
    );
    service.applyTransfer(amount.value, params.effectivated);

    const saved = Result.combine(
      await Promise.all([
        this.accountsRepository.save(accountOrigin.value),
        this.accountsRepository.save(accountDestination.value),
      ]),
    );
    if (saved.isFailure) return saved;

    return Result.ok();
  }
}
```

---

## Spec template

Providers are mocked inline with `jest.fn()` and cast via `as unknown as ProviderType`.
Entities are built with `.new()` — no validation needed in tests.

```typescript
// src/{context}/core/usecases/MyAction.usecase.spec.ts
import { Result } from '@/shared/base/Result';
import { Errors } from '@/shared/base/Errors';
import { MyRepository } from '@/{context}/core/provider/My.repository';
import { SomeQuery } from '@/{context}/core/provider/Some.query';
import { MyActionUseCase } from './MyAction.usecase';

describe('MyActionUseCase', () => {
  const baseParams = {
    name: 'valid name',
    amount: 100,
    relatedId: 'related-id',
  };

  const makeRepo = (overrides?: Partial<MyRepository>) =>
    ({
      save: jest.fn().mockResolvedValue(Result.ok(undefined)),
      findById: jest.fn(),
      ...overrides,
    }) as unknown as MyRepository;

  const makeQuery = (ok = true) =>
    ({
      existsById: jest.fn().mockResolvedValue(
        ok ? Result.ok(undefined) : Result.fail({ code: Errors.REFERENCE_ACCOUNT_NOT_FOUND, cls: 'test' }),
      ),
    }) as unknown as SomeQuery;

  it('should persist and return the aggregate when validation passes', async () => {
    const repo = makeRepo();
    const query = makeQuery();
    const useCase = new MyActionUseCase(repo, query);

    const result = await useCase.execute(baseParams);

    expect(result.isSuccess).toBe(true);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('should fail on domain validation without calling persistence', async () => {
    const repo = makeRepo();
    const query = makeQuery();
    const useCase = new MyActionUseCase(repo, query);

    const result = await useCase.execute({ ...baseParams, amount: 0 });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.MY_AMOUNT_INVALID);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should fail on reference check without calling persistence', async () => {
    const repo = makeRepo();
    const query = makeQuery(false);
    const useCase = new MyActionUseCase(repo, query);

    const result = await useCase.execute(baseParams);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.REFERENCE_ACCOUNT_NOT_FOUND);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should propagate persistence failure', async () => {
    const repo = makeRepo({
      save: jest.fn().mockResolvedValue(
        Result.fail({ code: Errors.PRISMA_INSERT_ERROR, cls: 'test' }),
      ),
    });
    const query = makeQuery();
    const useCase = new MyActionUseCase(repo, query);

    const result = await useCase.execute(baseParams);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
  });
});
```

---

## Execution checklist

1. [ ] Identify the pattern: **Create**, **Create with refs**, **Load+mutate**, **Domain service**, or **Query+compute**.
2. [ ] Create `src/{context}/core/usecases/{Action}.usecase.ts` and export the params type.
3. [ ] Create any missing provider (`abstract class`) in `src/{context}/core/provider/` if it does not exist yet.
4. [ ] Implement `execute()` following the matching pattern above.
5. [ ] Write `src/{context}/core/usecases/{Action}.usecase.spec.ts` covering all branches.
6. [ ] Run `pnpm test -- {Action}.usecase.spec.ts` and confirm all tests pass.
7. [ ] Run `pnpm lint` to ensure no linting issues.

## Quick command reference

```bash
pnpm test -- MyAction.usecase.spec.ts
pnpm lint
```
