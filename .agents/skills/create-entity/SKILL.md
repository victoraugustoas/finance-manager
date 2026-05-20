---
name: create-entity
description: >-
  Creates an Entity or Aggregate Root following DDD principles for this project.
  Use when the user asks to create a new domain entity, aggregate root, or model
  class that is identified by its identity (ID), resides in /model, and may
  dispatch domain events on creation (register()) or on mutations.
---

# Create Entity / Aggregate Root (finance-manager)

## When to use an Entity

An Entity is the right choice when the concept:

- Is identified **by an ID** — two objects with the same data are still distinct if their IDs differ.
- Has a **lifecycle** — it can be created, mutated, and deleted.
- Carries **domain behaviour** that changes its state over time.

Use a Value Object instead when the concept has no identity and is fully defined by its values (see `create-value-object`).

## Three flavours in this project

| Flavour | Base class | `register()`? | When to use |
|---|---|---|---|
| **Entity** | `Entity<TProps>` | No | A child object inside an aggregate that does not emit events (e.g. `SubCategory`). |
| **Aggregate Root** | `AggregateRoot<TProps>` | No | Root of a cluster; owns consistency rules and may emit events on *mutations* (e.g. `Account`, `Category`). |
| **Aggregate Root with creation event** | `AggregateRoot<TProps>` (or subclass) | **Yes** | Root that must publish a domain event the moment it is first registered (e.g. `Expense`, `Income`, `Transfer`). |

> Rule of thumb: if the object appears directly as a Prisma model and must notify other bounded contexts when it is **created**, it needs `register()`.

---

## Rules for this project

1. Extend `Entity<TProps>` or `AggregateRoot<TProps>` from `@/shared/base`.
2. **Private (or `protected`) constructor** — instantiation is only via static factories. Use `protected` only when the class is meant to be subclassed (e.g. `Transaction` → `Expense`).
3. **Static factories** (first two are always required):
   - `create(props): Result<T>` — validates all business rules; returns `Result.fail` on any violation. Does **not** emit events.
   - `new(props): T` — skips validation; used **exclusively** to rehydrate from the database.
   - `register(props): Result<T>` *(Aggregate Roots with creation event only)* — calls `create()`, then adds the appropriate `DomainEvent` via `addDomainEvent()`. This is the factory the application layer calls when recording a brand-new aggregate.
4. Pass `props.id` as the second argument to `super`: `super(props, props.id)` — this preserves existing IDs on rehydration.
5. Expose data via **getter properties**; never expose `this.props` directly on the public API.
6. Place the file in `src/{context}/core/model/`.
7. Register error codes in `src/{context}/core/model/Errors.ts` (a dedicated enum per context). Then add that enum to the `ContextErrors` spread in `src/shared/base/Errors.ts`.
8. Domain events go in `src/{context}/core/events/`, extending `DomainEvent` from `@/shared/base/DomainEvent`.
9. Write a `*.spec.ts` next to the source file covering happy paths, edge cases, and every `Result.fail` branch.

---

## Validation utilities

Use `Check` (from `@/shared/base`) to express each rule as a `Result<void>`, then pipe them through `Result.combine()`:

| Method | Succeeds when |
|---|---|
| `Check.gt(value, min, error)` | `value > min` |
| `Check.gte(value, min, error)` | `value >= min` |
| `Check.lt(value, max, error)` | `value < max` |
| `Check.lte(value, max, error)` | `value <= max` |
| `Check.notEmpty(value, error)` | string is not empty or whitespace-only |
| `Check.notNull(value, error)` | value is not `null` or `undefined` |
| `Check.isTrue(condition, error)` | boolean condition is `true` |

`Result.combine(results)` stops at the first failure (fail-fast). Use it at the top of `create()` to centralise validations.

> Use `Result.fail()` directly only when a validation depends on the outcome of a previous one.

---

## Templates

### Template A — Entity (non-aggregate child)

```typescript
// src/{context}/core/model/MyEntity.ts
import { Entity } from '@/shared/base/Entity';
import { Result } from '@/shared/base/Result';
import { Check } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';

interface MyEntityProps {
  id?: string;
  name: string; // example field
}

export class MyEntity extends Entity<MyEntityProps> {
  private constructor(props: MyEntityProps) {
    super(props, props.id);
  }

  get name(): string {
    return this.props.name;
  }

  static create(props: MyEntityProps): Result<MyEntity> {
    const validation = Result.combine([
      Check.notEmpty(props.name, { code: Errors.MY_ENTITY_NAME_REQUIRED }),
    ]);
    if (validation.isFailure) return validation;

    return Result.ok(new MyEntity({ ...props, name: props.name.trim() }));
  }

  static new(props: MyEntityProps): MyEntity {
    return new MyEntity(props);
  }
}
```

---

### Template B — Aggregate Root (without creation event)

```typescript
// src/{context}/core/model/MyAggregate.ts
import { AggregateRoot, Result } from '@/shared/base';
import { Check } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';

export interface MyAggregateProps {
  id?: string;
  name: string; // example field
}

export class MyAggregate extends AggregateRoot<MyAggregateProps> {
  private constructor(props: MyAggregateProps) {
    super(props, props.id);
  }

  get name(): string {
    return this.props.name;
  }

  static create(props: MyAggregateProps): Result<MyAggregate> {
    const validation = Result.combine([
      Check.notEmpty(props.name, { code: Errors.MY_AGGREGATE_NAME_REQUIRED }),
    ]);
    if (validation.isFailure) return validation;

    return Result.ok(new MyAggregate({ ...props, name: props.name.trim() }));
  }

  static new(props: MyAggregateProps): MyAggregate {
    return new MyAggregate(props);
  }

  // Domain mutation methods that may emit events via this.addDomainEvent(...)
}
```

---

### Template C — Aggregate Root with creation event

```typescript
// src/{context}/core/model/MyAggregate.ts
import { AggregateRoot, Result } from '@/shared/base';
import { Check } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { MyAggregateRegisteredEvent } from '@/{context}/core/events/MyAggregateRegisteredEvent';

export interface MyAggregateProps {
  id?: string;
  name: string; // example field
}

export class MyAggregate extends AggregateRoot<MyAggregateProps> {
  private constructor(props: MyAggregateProps) {
    super(props, props.id);
  }

  get name(): string {
    return this.props.name;
  }

  static register(props: MyAggregateProps): Result<MyAggregate> {
    const aggregate = MyAggregate.create(props);
    if (aggregate.isFailure) return aggregate;
    aggregate.value.addDomainEvent(
      new MyAggregateRegisteredEvent({
        id: aggregate.value.id,
        name: aggregate.value.name,
        // include all fields that subscribers need
      }),
    );
    return aggregate;
  }

  static create(props: MyAggregateProps): Result<MyAggregate> {
    const validation = Result.combine([
      Check.notEmpty(props.name, { code: Errors.MY_AGGREGATE_NAME_REQUIRED }),
    ]);
    if (validation.isFailure) return validation;

    return Result.ok(new MyAggregate({ ...props, name: props.name.trim() }));
  }

  static new(props: MyAggregateProps): MyAggregate {
    return new MyAggregate(props);
  }
}
```

---

## Domain Event template

```typescript
// src/{context}/core/events/MyAggregateRegisteredEvent.ts
import { DomainEvent } from '@/shared/base/DomainEvent';

export interface MyAggregateRegisteredPayload {
  id: string;
  name: string;
  // add all fields subscribers need
}

export class MyAggregateRegisteredEvent extends DomainEvent {
  static readonly EVENT_NAME = '{context}.myAggregate.registered';

  constructor(private readonly data: MyAggregateRegisteredPayload) {
    super();
  }

  get eventName(): string {
    return MyAggregateRegisteredEvent.EVENT_NAME;
  }

  get payload(): Record<string, unknown> {
    return { ...this.data };
  }
}
```

---

## Error codes

```typescript
// src/{context}/core/model/Errors.ts  (create if it does not exist)
export enum MyContextErrors {
  MY_ENTITY_NAME_REQUIRED = 'MY_ENTITY_NAME_REQUIRED',
  MY_AGGREGATE_NAME_REQUIRED = 'MY_AGGREGATE_NAME_REQUIRED',
}
```

```typescript
// src/shared/base/Errors.ts  — add the new enum to ContextErrors
import { MyContextErrors } from '@/{context}/core/model/Errors';

const ContextErrors = {
  ...CategoryErrors,
  ...TransactionErrors,
  ...ReportingErrors,
  ...MyContextErrors, // ← add this line
};
```

---

## Concrete examples

### Example 1: SubCategory (Entity — Template A)

```typescript
// src/category/core/model/SubCategory.ts
import { Entity } from '@/shared/base/Entity';
import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';

interface SubCategoryProps {
  id?: string;
  name: string;
}

export class SubCategory extends Entity<SubCategoryProps> {
  private constructor(props: SubCategoryProps) {
    super(props, props.id);
  }

  get name(): string {
    return this.props.name;
  }

  static create(props: SubCategoryProps): Result<SubCategory> {
    const trimmed = props.name.trim();
    if (!trimmed) {
      return Result.fail({ code: Errors.SUBCATEGORY_NAME_EMPTY });
    }
    return Result.ok(new SubCategory({ ...props, name: trimmed }));
  }

  static new(props: SubCategoryProps): SubCategory {
    return new SubCategory(props);
  }
}
```

---

### Example 2: Expense (Aggregate Root with creation event — Template C, subclass)

```typescript
// src/transactions/core/model/Expense.ts
import { Result } from '@/shared/base';
import { Transaction, TransactionProps, TransactionType } from './Transaction';
import { TransactionRegisteredEvent } from '@/transactions/core/events/TransactionRegisteredEvent';

export class Expense extends Transaction {
  private constructor(props: Omit<TransactionProps, 'type'>) {
    super({ ...props, type: TransactionType.EXPENSE });
  }

  static register(props: Omit<TransactionProps, 'type'>): Result<Expense> {
    const expense = Expense.create(props);
    if (expense.isFailure) return expense;
    expense.value.addDomainEvent(
      new TransactionRegisteredEvent({
        transactionId: expense.value.id,
        type: TransactionType.EXPENSE,
        amountInCents: props.amount,
        accountId: props.accountId,
        categoryId: props.categoryId,
        subCategoryId: props.subCategoryId,
        effectivated: props.effectivated,
      }),
    );
    return expense;
  }

  static create(props: Omit<TransactionProps, 'type'>): Result<Expense> {
    const result = super.create({ ...props, type: TransactionType.EXPENSE });
    if (result.isFailure) return result;
    return Result.ok(new Expense(props));
  }

  static new(props: Omit<TransactionProps, 'type'>): Expense {
    return new Expense(props);
  }
}
```

---

## Spec template

```typescript
// src/{context}/core/model/MyAggregate.spec.ts
import { Errors } from '@/shared/base/Errors';
import { MyAggregate } from './MyAggregate';

describe('MyAggregate', () => {
  const validProps = {
    name: 'valid name',
  };

  describe('create()', () => {
    it('should create with valid props', () => {
      const result = MyAggregate.create(validProps);

      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('valid name');
    });

    it('should trim whitespace from name', () => {
      const result = MyAggregate.create({ name: '  valid name  ' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('valid name');
    });

    it('should fail when name is empty', () => {
      const result = MyAggregate.create({ name: '' });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.MY_AGGREGATE_NAME_REQUIRED);
    });

    it('should fail when name is only whitespace', () => {
      const result = MyAggregate.create({ name: '   ' });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.MY_AGGREGATE_NAME_REQUIRED);
    });
  });

  describe('new()', () => {
    it('should build without validation', () => {
      const entity = MyAggregate.new({ id: 'existing-id', name: 'any' });

      expect(entity.id).toBe('existing-id');
      expect(entity.name).toBe('any');
    });
  });

  // If register() exists:
  describe('register()', () => {
    it('should add a domain event on success', () => {
      const result = MyAggregate.register(validProps);

      expect(result.isSuccess).toBe(true);
      expect(result.value.domainEvents).toHaveLength(1);
      expect(result.value.domainEvents[0].eventName).toBe('context.myAggregate.registered');
    });

    it('should propagate validation errors from create()', () => {
      const result = MyAggregate.register({ name: '' });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.MY_AGGREGATE_NAME_REQUIRED);
    });
  });

  describe('equals()', () => {
    it('should be equal when IDs match', () => {
      const a = MyAggregate.new({ id: 'same-id', name: 'a' });
      const b = MyAggregate.new({ id: 'same-id', name: 'b' });

      expect(a.equals(b)).toBe(true);
    });

    it('should not be equal when IDs differ', () => {
      const a = MyAggregate.create(validProps).value;
      const b = MyAggregate.create(validProps).value;

      expect(a.equals(b)).toBe(false);
    });
  });
});
```

---

## Execution checklist

1. [ ] Decide the flavour: **Entity**, **Aggregate Root**, or **Aggregate Root with `register()`**.
2. [ ] Create the entity/aggregate file at `src/{context}/core/model/MyEntity.ts`.
3. [ ] If a creation event is needed, create `src/{context}/core/events/MyEntityRegisteredEvent.ts`.
4. [ ] Add error codes to `src/{context}/core/model/Errors.ts` (create the file if it does not exist).
5. [ ] Register the enum in `src/shared/base/Errors.ts` under `ContextErrors` (if it is a new context).
6. [ ] Write `src/{context}/core/model/MyEntity.spec.ts` covering all branches.
7. [ ] Run `pnpm test -- MyEntity.spec.ts` and confirm all tests pass.
8. [ ] Run `pnpm lint` to ensure no linting issues.

## Quick command reference

```bash
pnpm test -- MyEntity.spec.ts
pnpm lint
```
