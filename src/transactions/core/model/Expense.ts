import { Result } from '@/shared/base';
import {
  Transaction,
  TransactionProps,
  TransactionType,
} from '@/transactions/core/model/Transaction';

export class Expense extends Transaction {
  private constructor(props: Omit<TransactionProps, 'type'>) {
    super({ ...props, type: TransactionType.EXPENSE });
  }

  static create(props: Omit<TransactionProps, 'type'>): Result<Expense> {
    const effectiveProps = { ...props, type: TransactionType.EXPENSE };
    const result = super.create(effectiveProps);
    if (result.isFailure) return result;
    return Result.ok(new Expense(effectiveProps));
  }

  static new(props: Omit<TransactionProps, 'type'>): Expense {
    const effectiveProps = { ...props, type: TransactionType.EXPENSE };
    return new Expense(effectiveProps);
  }
}
