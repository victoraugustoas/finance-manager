import { Entity, EntityProps } from '@/shared/base/entity';
import { Result } from '@/shared/base/result';
import { Money } from '@/shared/ValueObjects/money.vo';

export interface AccountProps extends EntityProps {
  name: string;
  /** Opening balance in minor units (cents). */
  openingBalance: number;
}

export class Account extends Entity<Account, AccountProps> {
  private constructor(props: AccountProps) {
    super(props);
  }

  get name(): string {
    return this.props.name;
  }

  get openingBalance(): Money {
    return Money.fromCents(this.props.openingBalance);
  }

  static create(props: AccountProps): Account {
    const result = Account.tryCreate(props);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  static tryCreate(props: AccountProps): Result<Account> {
    const openingBalance = Money.tryFromCents(props.openingBalance);
    if (openingBalance.isFailure) {
      return openingBalance.withFail;
    }

    return Result.ok(
      new Account({ ...props, openingBalance: openingBalance.instance.amountInCents }),
    );
  }

  rename(name: string): Result<Account> {
    return this.cloneWith({ name });
  }
}
