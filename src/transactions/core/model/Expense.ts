import { Result } from '@/shared/base';
import {
  Transaction,
  TransactionProps,
  TransactionType,
} from '@/transactions/core/model/Transaction';
import { TransactionRegisteredEvent } from '@/transactions/core/events/TransactionRegisteredEvent';
import { TransactionEditedEvent } from '@/transactions/core/events/TransactionEditedEvent';

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
    const effectiveProps = { ...props, type: TransactionType.EXPENSE };
    const result = super.create(effectiveProps);
    if (result.isFailure) return result;
    const expense = new Expense(effectiveProps);
    return Result.ok(expense);
  }

  static new(props: Omit<TransactionProps, 'type'>): Expense {
    const effectiveProps = { ...props, type: TransactionType.EXPENSE };
    return new Expense(effectiveProps);
  }

  edit(props: Omit<TransactionProps, 'type' | 'id'>): Result<void> {
    const oldValues = { ...this.props };
    const editResult = super.edit(props);
    if (editResult.isFailure) return editResult.asFail();
    this.addDomainEvent(
      new TransactionEditedEvent({
        newValues: { ...props, type: this.props.type },
        oldValues,
      }),
    );
    return Result.ok();
  }
}
