import {Result, ValueObject} from '../base';
import {Errors} from "@/shared/base/Errors";

type MoneyProps = {
  amountInCents: number;
};

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  get amountInCents(): number {
    return this.props.amountInCents;
  }

  /** Valor decimal para exibição. Ex: 2523 → 25.23 */
  get amount(): number {
    return this.props.amountInCents / 100;
  }

  static create(amount: number): Result<Money> {
    if (!Number.isFinite(amount)) {
      return Result.fail({code: Errors.MONEY_NOT_FINITE});
    }

    return Result.ok(new Money({amountInCents: Math.round(amount * 100)}));
  }

  static fromCents(amountInCents: number): Result<Money> {
    if (!Number.isInteger(amountInCents)) {
      return Result.fail({code: Errors.MONEY_CENTS_NOT_INTEGER});
    }
    return Result.ok(new Money({amountInCents}));
  }

  add(other: Money): Money {
    return new Money({amountInCents: this.amountInCents + other.amountInCents});
  }

  subtract(other: Money): Result<Money> {
    const result = this.amountInCents - other.amountInCents;

    return Result.ok(new Money({amountInCents: result}));
  }

  isGreaterThan(other: Money): boolean {
    return this.amountInCents > other.amountInCents;
  }

  isLessThan(other: Money): boolean {
    return this.amountInCents < other.amountInCents;
  }
}
