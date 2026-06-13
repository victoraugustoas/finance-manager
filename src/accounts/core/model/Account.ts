import { AggregateRoot, Result } from '@/shared/base';
import { Money } from '@/shared/ValueObjects';

export interface AccountProps {
  id?: string;
  name: string;
  openingBalance: number;
}

export class Account extends AggregateRoot<AccountProps> {
  name: string;
  readonly openingBalance: Money;

  private constructor(props: AccountProps) {
    super(props, props.id);
    this.name = props.name;
    this.openingBalance = Money.create(props.openingBalance).value;
  }

  static create(props: AccountProps): Result<Account> {
    const openingBalance = Money.create(props.openingBalance);
    if (openingBalance.isFailure) return openingBalance.asFail();

    return Result.ok(new Account(props));
  }

  static new(props: AccountProps): Account {
    return new Account(props);
  }
}
