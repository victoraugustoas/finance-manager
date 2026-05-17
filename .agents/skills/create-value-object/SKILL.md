---
name: create-value-object
description: >-
  Creates a Value Object following DDD principles for this project. Use when
  the user asks to create a new value object, encapsulate a primitive, or move
  business logic that belongs to a concept (email, CPF, phone number, date
  range, etc.) into a dedicated, immutable type.
---

# Create Value Object (finance-manager)

## When to use a Value Object

A Value Object encapsulates a concept that:

- Is identified **by its value**, not by an identity (no ID field).
- Is **immutable** — once created, it never changes.
- Carries **business logic** that belongs to that concept (validation, formatting, comparison, operations).
- Would otherwise live as a naked primitive (`string`, `number`) scattered across the codebase.

Prefer a Value Object over a plain primitive whenever the concept has at least one invariant (e.g. "an email must contain @") or at least one behaviour (e.g. "money can be added to money").

## Rules for this project

1. Extend `ValueObject<TProps>` from `@/shared/base`.
2. **Private constructor** — instantiation is only via static factories.
3. Two static factories:
   - `create(…): Result<Vo>` — validates business rules using `Check` + `Result.combine()`.
   - `new(…): Vo` — skips validation; use only when the caller guarantees the data is already valid (e.g., when rehydrating from the database).
4. Expose data via **getter properties**, never by exposing `props` directly.
5. Place the file in `src/shared/ValueObjects/` for cross-context types; place it in `src/{context}/core/model/` for context-specific types.
6. Register every new error code in `src/shared/ValueObjects/Errors.ts` (`ValueObjectErrors` enum).
7. **Never mutate** — operations that derive a new value (e.g., `normalize()`) must return a new instance.
8. Write a `*.spec.ts` next to the source file covering happy paths, edge cases, and every `Result.fail` branch.

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

`Result.combine(results)` runs all checks and **stops at the first failure** (fail-fast). Use it at the top of `create()` to centralise all validations before constructing the object.

> Use a direct `Result.fail()` only when a validation depends on the result of a previous one (e.g., checking a date only when effectivated is true).

---

## Template

```typescript
// src/shared/ValueObjects/MyValueObject.ts
import { Check, Result, ValueObject } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';

type MyValueObjectProps = {
  value: string; // store the canonical/normalised form
};

export class MyValueObject extends ValueObject<MyValueObjectProps> {
  private constructor(props: MyValueObjectProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  // Add domain behaviours here, returning new instances when needed

  static create(raw: string): Result<MyValueObject> {
    const normalised = raw.trim().toLowerCase();

    const validation = Result.combine([
      Check.notEmpty(normalised, { code: Errors.MY_VALUE_OBJECT_REQUIRED }),
      // add more Check calls here for each additional invariant
    ]);

    if (validation.isFailure) return validation;

    return Result.ok(new MyValueObject({ value: normalised }));
  }

  static new(value: string): MyValueObject {
    return new MyValueObject({ value });
  }
}
```

```typescript
// src/shared/ValueObjects/Errors.ts  (add to the existing enum)
export enum ValueObjectErrors {
  // … existing entries …
  MY_VALUE_OBJECT_REQUIRED = 'MY_VALUE_OBJECT_REQUIRED',
}
```

---

## Concrete example: Email

### 1. Create `src/shared/ValueObjects/Email.ts`

```typescript
import { Check, Result, ValueObject } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';

type EmailProps = {
  value: string;
};

export class Email extends ValueObject<EmailProps> {
  private static readonly REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  /** Returns the local part before the '@'. */
  get localPart(): string {
    return this.props.value.split('@')[0];
  }

  /** Returns the domain part after the '@'. */
  get domain(): string {
    return this.props.value.split('@')[1];
  }

  static create(raw: string): Result<Email> {
    const normalised = raw.trim().toLowerCase();

    const validation = Result.combine([
      Check.notEmpty(normalised, { code: Errors.EMAIL_REQUIRED }),
      Check.isTrue(Email.REGEX.test(normalised), { code: Errors.EMAIL_INVALID_FORMAT }),
    ]);

    if (validation.isFailure) return validation;

    return Result.ok(new Email({ value: normalised }));
  }

  static new(value: string): Email {
    return new Email({ value });
  }
}
```

### 2. Add error codes to `src/shared/ValueObjects/Errors.ts`

```typescript
export enum ValueObjectErrors {
  // Money
  MONEY_CENTS_NOT_INTEGER = 'MONEY_CENTS_NOT_INTEGER',
  MONEY_NOT_FINITE = 'MONEY_NOT_FINITE',
  // Effectivated
  EFFECTIVATED_DATE_NOT_BE_NULL = 'EFFECTIVATED_DATE_NOT_BE_NULL',
  // Email
  EMAIL_REQUIRED = 'EMAIL_REQUIRED',
  EMAIL_INVALID_FORMAT = 'EMAIL_INVALID_FORMAT',
}
```

### 3. Export from the barrel (if one exists)

Add the new class to `src/shared/ValueObjects/index.ts` if a barrel file exists.

### 4. Write `src/shared/ValueObjects/Email.spec.ts`

```typescript
import { Errors } from '@/shared/base/Errors';
import { Email } from './Email';

describe('Email', () => {
  describe('create()', () => {
    it('should create with a valid email', () => {
      const result = Email.create('user@example.com');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('user@example.com');
    });

    it('should normalise to lowercase and trim whitespace', () => {
      const result = Email.create('  User@Example.COM  ');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('user@example.com');
    });

    it('should fail when the value is empty', () => {
      const result = Email.create('');

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.EMAIL_REQUIRED);
    });

    it('should fail when the value is only whitespace', () => {
      const result = Email.create('   ');

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.EMAIL_REQUIRED);
    });

    it('should fail when the format is invalid (missing @)', () => {
      const result = Email.create('notanemail');

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.EMAIL_INVALID_FORMAT);
    });

    it('should fail when the format is invalid (missing domain)', () => {
      const result = Email.create('user@');

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.EMAIL_INVALID_FORMAT);
    });
  });

  describe('localPart', () => {
    it('should return the local part before the @', () => {
      const email = Email.create('user@example.com').value;

      expect(email.localPart).toBe('user');
    });
  });

  describe('domain', () => {
    it('should return the domain part after the @', () => {
      const email = Email.create('user@example.com').value;

      expect(email.domain).toBe('example.com');
    });
  });

  describe('equals()', () => {
    it('should return true for two emails with the same value', () => {
      const a = Email.create('user@example.com').value;
      const b = Email.create('user@example.com').value;

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different emails', () => {
      const a = Email.create('user@example.com').value;
      const b = Email.create('other@example.com').value;

      expect(a.equals(b)).toBe(false);
    });
  });
});
```

---

## Execution checklist

1. [ ] Identify the concept and its invariants.
2. [ ] Create the Value Object file in the correct location.
3. [ ] Add error codes to `ValueObjectErrors`.
4. [ ] Export from the barrel (`index.ts`) if one exists.
5. [ ] Write the spec file covering all branches.
6. [ ] Run `pnpm test -- <SpecFileName>` and confirm all tests pass.
7. [ ] Run `pnpm lint` to ensure no linting issues.

## Quick command reference

```bash
pnpm test -- Email.spec.ts
pnpm lint
```
