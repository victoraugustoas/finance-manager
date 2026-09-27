import { Result } from '@/shared/base/result';
import { TransactionType } from '@/shared/enums/transaction-type';
import { Transaction, TransactionProps } from './transaction.entity';
import { TransactionRegisteredEvent } from './transaction.event';

export type ExpenseProps = Omit<TransactionProps, 'type'>;

export class Expense extends Transaction<Expense> {
  private constructor(props: ExpenseProps) {
    super({ ...props, type: TransactionType.EXPENSE });
  }

  static create(props: ExpenseProps): Expense {
    const result = Expense.tryCreate(props);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  static tryCreate(props: ExpenseProps): Result<Expense> {
    const validation = Expense.validateProps({ ...props, type: TransactionType.EXPENSE });
    if (validation.isFailure) {
      return validation.withFail;
    }

    return Result.ok(new Expense(props));
  }

  /** Valid expense carrying a `transaction.registered` event. */
  static register(props: ExpenseProps): Result<Expense> {
    const expense = Expense.tryCreate(props);
    if (expense.isFailure) {
      return expense;
    }

    expense.instance.addEvent(
      new TransactionRegisteredEvent({
        transactionId: expense.instance.id,
        type: TransactionType.EXPENSE,
        amountInCents: expense.instance.amount.amountInCents,
        accountId: expense.instance.accountId,
        categoryId: expense.instance.categoryId,
        subCategoryId: expense.instance.subCategoryId,
        effectivated: expense.instance.effectivated.effectivated,
      }),
    );

    return expense;
  }
}
