import { AggregateRoot, Result } from '@/shared/base';
import { Money } from '@/shared/ValueObjects';

export interface AccountProps {
  id?: string;
  name: string;
  balance: number;
  openingBalance: number;
}

export class Account extends AggregateRoot<AccountProps> {
  name: string;
  balance: Money;
  readonly openingBalance: Money;

  private constructor(props: AccountProps) {
    super(props, props.id);
    this.name = props.name;
    this.balance = Money.create(props.balance).value;
    this.openingBalance = Money.create(props.openingBalance).value;
  }

  get actualBalance(): Money {
    return this.balance.add(this.openingBalance);
  }

  static create(props: AccountProps): Result<Account> {
    const balance = Money.create(props.balance);
    const openingBalance = Money.create(props.openingBalance);
    const combine = Result.combine([balance, openingBalance]);

    if (combine.isFailure) return combine;

    return Result.ok(new Account(props));
  }

  static new(props: AccountProps): Account {
    return new Account(props);
  }

  updateBalance(value: Money, type: 'EXPENSE' | 'INCOME', effectivated: boolean): void {
    if (!effectivated) return;
    if (type === 'EXPENSE') this.balance = this.balance.subtract(value);
    if (type === 'INCOME') this.balance = this.balance.add(value);
  }
}
