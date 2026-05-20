---
name: create-domain-service
description: >-
  Creates a Domain Service following DDD principles for this project. Use when
  business logic involves multiple entities or aggregates and does not belong
  naturally to any single one of them (e.g. coordinating state changes between
  two aggregates, or computing a domain result from a collection of domain
  objects).
---

# Create Domain Service (finance-manager)

## When to use a Domain Service

A Domain Service is the right choice when:

- The operation involves **two or more entities/aggregates** and would feel unnatural on any single one.
- The logic is about **domain rules** — even if it needs to load or persist data via repositories or other providers.
- The operation is **stateless** (pure computation) or **stateful only in its inputs** (coordinates mutations on entities it receives).

Do **not** use a Domain Service for:
- Logic that clearly belongs to a single entity → put it in the entity.
- NestJS infrastructure classes → those live in `infra/`.

---

## Two flavours in this project

| Flavour | When to use | Naming convention | File suffix |
|---|---|---|---|
| **Stateful** | Coordinates mutations across multiple entities received as constructor arguments | `{Action}Service` | `.service.ts` |
| **Stateless** | Pure computation on domain data; no side-effects | `{Noun}{Role}Service` (`ComposerService`, `CalculatorService`, `BuilderService`…) | `.service.ts` |

> Both are **plain TypeScript classes**. No `@Injectable()`, no base class, no interfaces required. They are instantiated with `new` inside use cases — never registered in the NestJS DI container.

---

## Rules for this project

1. **No base class** — domain services do not extend any base class.
2. **No NestJS decorator** — `@Injectable()` is for infrastructure; domain services are pure domain logic.
3. Place the file in `src/{context}/core/service/`.
4. **Stateful services** receive their entity/aggregate dependencies in the **constructor**.
5. **Stateless services** receive all inputs as **method arguments** and return a computed result.
6. A domain service **never** emits HTTP responses or calls external APIs — it operates within the domain layer.
7. Write a `*.spec.ts` next to the source file covering all meaningful branches.

---

## Templates

### Template A — Stateful Domain Service

Coordinates mutations across two or more aggregates. Constructed with the entities it will operate on; methods mutate them in-place.

```typescript
// src/{context}/core/service/MyAction.service.ts
import { SomeAggregate } from '@/{context}/core/model/SomeAggregate';
import { AnotherAggregate } from '@/{context}/core/model/AnotherAggregate';

export class MyActionService {
  constructor(
    private readonly someAggregate: SomeAggregate,
    private readonly anotherAggregate: AnotherAggregate,
  ) {}

  apply(/* domain-level arguments */): void {
    // Coordinate state changes across the two aggregates.
    // No return value needed — entities are mutated in-place.
    this.someAggregate.someMethod(/* ... */);
    this.anotherAggregate.anotherMethod(/* ... */);
  }
}
```

**How to use inside a use case:**

```typescript
// inside MyUseCase.execute():
const someAggregate = await this.someRepo.findById(params.someId);
const anotherAggregate = await this.anotherRepo.findById(params.anotherId);

const service = new MyActionService(someAggregate.value, anotherAggregate.value);
service.apply(/* ... */);

await this.someRepo.save(someAggregate.value);
await this.anotherRepo.save(anotherAggregate.value);
```

---

### Template B — Stateless Domain Service

Pure computation on domain data. No constructor dependencies. Instantiated once (often as a use-case field).

```typescript
// src/{context}/core/service/MyComposer.service.ts
import { SomeDomainType } from '@/{context}/core/model/SomeDomainType';
import { SomeResultDTO } from '@/{context}/core/dto/SomeResult.dto';

export class MyComposerService {
  static readonly SOME_DOMAIN_CONSTANT = 'value';

  computeResult(input: SomeDomainType[]): SomeResultDTO {
    // Pure domain logic here — no side-effects.
    return { /* ... */ };
  }
}
```

**How to use inside a use case:**

```typescript
// as a use-case field (instantiated once):
private readonly myComposer = new MyComposerService();

// inside execute():
const result = this.myComposer.computeResult(rows);
```

---

## Concrete examples

### Example 1: ApplyTransferBetweenAccountsService (Stateful — Template A)

```typescript
// src/accounts/core/service/ApplyTransferBetweenAccounts.service.ts
import { Account } from '@/accounts/core/model/Account';
import { Money } from '@/shared/ValueObjects';

export class ApplyTransferBetweenAccountsService {
  constructor(
    private readonly accountOrigin: Account,
    private readonly accountDestination: Account,
  ) {}

  applyTransfer(amount: Money, effectivated: boolean): void {
    if (effectivated) {
      this.accountOrigin.deduceBalance(amount);
      this.accountDestination.creditBalance(amount);
    }
  }
}
```

The use case fetches both accounts, instantiates the service, calls `applyTransfer`, then saves both accounts. The service knows nothing about repositories.

---

### Example 2: BreakdownCategoriesComposerService (Stateless — Template B)

```typescript
// src/reporting/core/service/BreakdownCategoriesComposer.service.ts
import { BreakdownCategoriesDTO } from '@/reporting/core/dto/BreakdownCategories.dto';
import { Money } from '@/shared/ValueObjects';

export type CategoryBreakdownRow = { name: string; total: Money };

export class BreakdownCategoriesComposerService {
  static readonly othersCategoryLabel = 'Others';

  applySixCategoryCap(sortedDescending: CategoryBreakdownRow[]): BreakdownCategoriesDTO {
    if (sortedDescending.length <= 6) {
      return { categories: sortedDescending };
    }
    const topFive = sortedDescending.slice(0, 5);
    const othersTotal = sortedDescending
      .slice(5)
      .reduce((acc, row) => acc.add(row.total), Money.new(0));
    // ... sort and return capped list
  }
}
```

The use case holds `private readonly composer = new BreakdownCategoriesComposerService()` as a field and calls `composer.applySixCategoryCap(rows)`.

---

## Spec template

### Stateful service spec

```typescript
// src/{context}/core/service/MyAction.service.spec.ts
import { SomeAggregate } from '@/{context}/core/model/SomeAggregate';
import { AnotherAggregate } from '@/{context}/core/model/AnotherAggregate';
import { MyActionService } from './MyAction.service';

describe('MyActionService', () => {
  const makeA = () => SomeAggregate.new({ /* ... */ });
  const makeB = () => AnotherAggregate.new({ /* ... */ });

  describe('apply()', () => {
    it('should mutate both aggregates correctly', () => {
      const a = makeA();
      const b = makeB();
      const service = new MyActionService(a, b);

      service.apply(/* ... */);

      expect(a.someField).toBe(/* expected */);
      expect(b.anotherField).toBe(/* expected */);
    });

    it('should not mutate when the condition is not met', () => {
      const a = makeA();
      const b = makeB();
      const service = new MyActionService(a, b);

      service.apply(/* condition=false */);

      expect(a.someField).toBe(/* unchanged */);
      expect(b.anotherField).toBe(/* unchanged */);
    });
  });
});
```

### Stateless service spec

```typescript
// src/{context}/core/service/MyComposer.service.spec.ts
import { MyComposerService } from './MyComposer.service';

describe('MyComposerService', () => {
  const composer = new MyComposerService();

  describe('computeResult()', () => {
    it('should return the expected result for a valid input', () => {
      const input = [/* ... */];

      const result = composer.computeResult(input);

      expect(result).toEqual(/* expected */);
    });

    it('should handle the edge case of an empty input', () => {
      const result = composer.computeResult([]);

      expect(result).toEqual(/* expected */);
    });
  });
});
```

---

## Execution checklist

1. [ ] Confirm the logic does **not** belong to a single entity — if it does, add it there instead.
2. [ ] Choose the flavour: **Stateful** (Template A) or **Stateless** (Template B).
3. [ ] Create the service file at `src/{context}/core/service/`.
   - Stateful → `MyAction.service.ts`
   - Stateless → `MyComposer.service.ts` (or `MyCalculator.service.ts`, `MyResolver.service.ts`, etc.)
4. [ ] Write `src/{context}/core/service/MyService.spec.ts` covering all meaningful branches.
5. [ ] Run `pnpm test -- MyService.spec.ts` and confirm all tests pass.
6. [ ] Run `pnpm lint` to ensure no linting issues.

## Quick command reference

```bash
pnpm test -- MyAction.service.spec.ts
pnpm lint
```
