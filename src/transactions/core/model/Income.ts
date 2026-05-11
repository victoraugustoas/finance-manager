import {
  Transaction,
  TransactionProps,
  TransactionType,
} from '@/transactions/core/model/Transaction';
import { Result } from '@/shared/base';
import { TransactionRegisteredEvent } from '@/transactions/core/events/TransactionRegisteredEvent';
import { TransactionEditedEvent } from '@/transactions/core/events/TransactionEditedEvent';

export class Income extends Transaction {
  private constructor(props: Omit<TransactionProps, 'type'>) {
    super({ ...props, type: TransactionType.INCOME });
  }

  static register(props: Omit<TransactionProps, 'type'>): Result<Income> {
    const income = Income.create(props);
    if (income.isFailure) return income;
    income.value.addDomainEvent(
      new TransactionRegisteredEvent({
        transactionId: income.value.id,
        type: TransactionType.INCOME,
        amountInCents: props.amount,
        accountId: props.accountId,
        categoryId: props.categoryId,
        subCategoryId: props.subCategoryId,
        effectivated: props.effectivated,
      }),
    );
    return Result.ok(income.value);
  }

  static create(props: Omit<TransactionProps, 'type'>): Result<Income> {
    const effectiveProps = { ...props, type: TransactionType.INCOME };
    const result = super.create(effectiveProps);
    if (result.isFailure) return result;
    const income = new Income(effectiveProps);
    return Result.ok(income);
  }

  static new(props: Omit<TransactionProps, 'type'>): Income {
    const effectiveProps = { ...props, type: TransactionType.INCOME };
    return new Income(effectiveProps);
  }

  edit(props: Omit<TransactionProps, 'type' | 'id'>): Result<Income> {
    const income = super.edit(props);
    if (income.isFailure) {
      return income.asFail();
    }
    this.addDomainEvent(
      new TransactionEditedEvent({
        newValues: { ...props, type: this.props.type },
        oldValues: this.props,
      }),
    );
    return Result.ok(income.value);
  }
}
