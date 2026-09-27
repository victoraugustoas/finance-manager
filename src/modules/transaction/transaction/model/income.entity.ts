import { Result } from '@/shared/base/result';
import { TransactionType } from '@/shared/enums/transaction-type';
import { Transaction, TransactionProps } from './transaction.entity';
import { TransactionRegisteredEvent } from './transaction.event';

export type IncomeProps = Omit<TransactionProps, 'type'>;

export class Income extends Transaction<Income> {
  private constructor(props: IncomeProps) {
    super({ ...props, type: TransactionType.INCOME });
  }

  static create(props: IncomeProps): Income {
    const result = Income.tryCreate(props);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  static tryCreate(props: IncomeProps): Result<Income> {
    const validation = Income.validateProps({ ...props, type: TransactionType.INCOME });
    if (validation.isFailure) {
      return validation.withFail;
    }

    return Result.ok(new Income(props));
  }

  /** Valid income carrying a `transaction.registered` event. */
  static register(props: IncomeProps): Result<Income> {
    const income = Income.tryCreate(props);
    if (income.isFailure) {
      return income;
    }

    income.instance.addEvent(
      new TransactionRegisteredEvent({
        transactionId: income.instance.id,
        type: TransactionType.INCOME,
        amountInCents: income.instance.amount.amountInCents,
        accountId: income.instance.accountId,
        categoryId: income.instance.categoryId,
        subCategoryId: income.instance.subCategoryId,
        effectivated: income.instance.effectivated.effectivated,
      }),
    );

    return income;
  }
}
