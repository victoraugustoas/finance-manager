import { Result } from '@/shared/base/result';
import { resolveVoConfig, ValueObject, ValueObjectConfig } from '@/shared/base/vo';
import { MoneyErrors } from '@/shared/errors/shared-errors';

/**
 * Monetary amount stored in minor units (cents), matching the integer columns
 * used by Prisma for `amount` / `openingBalance`.
 */
export class Money extends ValueObject<number, ValueObjectConfig> {
  static readonly NOT_FINITE = MoneyErrors.NOT_FINITE;
  static readonly CENTS_NOT_INTEGER = MoneyErrors.CENTS_NOT_INTEGER;

  private constructor(amountInCents: number, config?: ValueObjectConfig) {
    super(amountInCents, config);
  }

  get amountInCents(): number {
    return this.value;
  }

  /** Decimal value for display. E.g.: 2523 → 25.23 */
  get amount(): number {
    return this.value / 100;
  }

  /** Creates from a decimal amount (e.g. `25.23`). Throws when invalid. */
  static create(amount: number, config?: ValueObjectConfig): Money {
    const result = Money.tryCreate(amount, config);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  /** Creates from a decimal amount (e.g. `25.23`). */
  static tryCreate(amount: number, config?: ValueObjectConfig): Result<Money> {
    if (!Number.isFinite(amount)) {
      return Result.fail(Money.NOT_FINITE);
    }

    return Result.ok(new Money(Math.round(amount * 100), resolveVoConfig(config)));
  }

  /** Creates from minor units (cents). Throws when invalid. */
  static fromCents(amountInCents: number, config?: ValueObjectConfig): Money {
    const result = Money.tryFromCents(amountInCents, config);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  /** Creates from minor units (cents). */
  static tryFromCents(amountInCents: number, config?: ValueObjectConfig): Result<Money> {
    if (!Number.isInteger(amountInCents)) {
      return Result.fail(Money.CENTS_NOT_INTEGER);
    }

    return Result.ok(new Money(amountInCents, resolveVoConfig(config)));
  }

  add(other: Money): Money {
    return new Money(this.amountInCents + other.amountInCents);
  }

  subtract(other: Money): Money {
    return new Money(this.amountInCents - other.amountInCents);
  }

  isGreaterThan(other: Money): boolean {
    return this.amountInCents > other.amountInCents;
  }

  isLessThan(other: Money): boolean {
    return this.amountInCents < other.amountInCents;
  }
}
