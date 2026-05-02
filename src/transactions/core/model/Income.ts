import {
  Transaction,
  TransactionProps,
  TransactionType,
} from '@/transactions/core/model/Transaction';
import { Result } from '@/shared/base';

export class Income extends Transaction {
  private constructor(props: Omit<TransactionProps, 'type'>) {
    super({ ...props, type: TransactionType.INCOME });
  }

  static create(props: Omit<TransactionProps, 'type'>): Result<Income> {
    const effectiveProps = { ...props, type: TransactionType.INCOME };
    const result = super.create(effectiveProps);
    if (result.isFailure) return result;
    return Result.ok(new Income(effectiveProps));
  }

  static new(props: Omit<TransactionProps, 'type'>): Income {
    const effectiveProps = { ...props, type: TransactionType.INCOME };
    return new Income(effectiveProps);
  }
}
