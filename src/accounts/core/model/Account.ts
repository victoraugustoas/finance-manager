import { AggregateRoot, Result } from '@/shared/base';
import { Money } from '@/shared/ValueObjects';
import { TransactionType } from '@/shared/enums/TransactionType';

export interface AccountProps {
  id?: string;
  name: string;
  balance: number;
  openingBalance: number;
}

interface NewTransaction {
  updatedBy: 'NEW_TRANSACTION';
  value: Money;
  type: TransactionType;
  effectivated: boolean;
}

interface DeleteTransaction {
  updatedBy: 'DELETE';
  oldValue: Money;
  type: TransactionType;
}

interface EditValueTransaction {
  updatedBy: 'EDIT';
  oldValue: Money;
  newValue: Money;
  oldEffectivated: boolean;
  newEffectivated: boolean;
  type: TransactionType;
}

type AdjustBalanceParams = NewTransaction | DeleteTransaction | EditValueTransaction;

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

  creditBalance(value: Money): void {
    this.balance = this.balance.add(value);
  }

  deduceBalance(value: Money): void {
    this.balance = this.balance.subtract(value);
  }

  updateBalance(params: AdjustBalanceParams): void {
    switch (params.updatedBy) {
      case 'NEW_TRANSACTION':
        if (params.effectivated) {
          return this.adjustBalanceInCreationTransactions(params.value, params.type);
        }
        break;
      case 'EDIT':
        return this.adjustBalanceInEditTransactions(
          params.oldValue,
          params.newValue,
          params.type,
          params.oldEffectivated,
          params.newEffectivated,
        );
      case 'DELETE':
        return this.adjustBalanceInRemoveTransactions(params.oldValue, params.type);
    }
  }

  private adjustBalanceInRemoveTransactions(oldValue: Money, type: TransactionType) {
    if (type === 'EXPENSE') {
      this.balance = this.balance.add(oldValue);
    } else {
      if (type === 'INCOME') {
        this.balance = this.balance.subtract(oldValue);
      }
    }
  }

  private adjustBalanceInEditTransactions(
    oldValue: Money,
    newValue: Money,
    type: TransactionType,
    oldEffectivated: boolean,
    newEffectivated: boolean,
  ) {
    if (oldEffectivated && !newEffectivated) {
      if (type === 'EXPENSE') {
        this.balance = this.balance.add(oldValue);
        this.balance = this.balance.subtract(newValue);
      } else {
        if (type === 'INCOME') {
          this.balance = this.balance.subtract(oldValue);
          this.balance = this.balance.add(newValue);
        }
      }
    }
    if (!oldEffectivated && newEffectivated) {
      if (type === 'EXPENSE') {
        this.balance = this.balance.subtract(newValue);
      } else {
        if (type === 'INCOME') {
          this.balance = this.balance.add(newValue);
        }
      }
    }
  }

  private adjustBalanceInCreationTransactions(value: Money, type: TransactionType) {
    if (type === 'EXPENSE') {
      this.balance = this.balance.subtract(value);
    } else {
      if (type === 'INCOME') {
        this.balance = this.balance.add(value);
      }
    }
  }
}
