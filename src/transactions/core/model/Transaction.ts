import { AggregateRoot, Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { isAfter, isSameDay } from 'date-fns';
import { Money } from '@/shared/ValueObjects';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface TransactionProps {
  id?: string;
  name: string;
  amount: number;
  categoryId: string;
  subCategoryId: string;
  notes?: string;
  dueDate: Date;
  entryDate: Date;
  effectivatedDate?: Date;
  effectivated: boolean;
  accountId: string;
  type: TransactionType;
}

export class Transaction extends AggregateRoot<TransactionProps> {
  amount: Money;

  protected constructor(props: TransactionProps) {
    super(props, props.id);
    this.amount = Money.new(props.amount);
  }

  static create(props: TransactionProps): Result<Transaction> {
    const { amount, effectivated, effectivatedDate } = props;
    if (amount <= 0) return Result.fail({ code: Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE });
    if (effectivated && !effectivatedDate)
      return Result.fail({ code: Errors.EFFECTIVATED_DATE_NOT_BE_NULL });

    const dueDateIsAfterEntryDate =
      isSameDay(props.dueDate, props.entryDate) || isAfter(props.dueDate, props.entryDate);
    if (!dueDateIsAfterEntryDate)
      return Result.fail({ code: Errors.TRANSACTION_DUE_DATE_NOT_AFTER_ENTRY_DATE });

    const effectivatedDateIsAfterEntryDate =
      isSameDay(props.effectivatedDate!, props.entryDate) ||
      isAfter(props.effectivatedDate!, props.entryDate);
    if (effectivatedDate !== undefined && effectivated && !effectivatedDateIsAfterEntryDate) {
      return Result.fail({ code: Errors.TRANSACTION_EFFECTIVATED_DATE_NOT_AFTER_ENTRY_DATE });
    }

    return Result.ok(new Transaction(props));
  }

  static new(props: TransactionProps): Transaction {
    return new Transaction(props);
  }

  edit(props: Omit<TransactionProps, 'type'>): Result<Transaction> {
    const effectivatedDate = props.effectivated ? props.effectivatedDate : undefined;

    const transactionResult = Transaction.create({
      ...props,
      id: this.id,
      type: this.props.type,
      effectivatedDate,
    });
    if (transactionResult.isFailure) return transactionResult.asFail();

    return Result.ok(transactionResult.value);
  }

  effectivate(effectivatedDate: Date): Result<void> {
    const isValidValidDate =
      isSameDay(effectivatedDate, this.props.entryDate) ||
      isAfter(effectivatedDate, this.props.entryDate);

    if (!isValidValidDate) {
      return Result.fail({ code: Errors.TRANSACTION_EFFECTIVATED_DATE_NOT_AFTER_ENTRY_DATE });
    }

    this.props.effectivatedDate = effectivatedDate;
    return Result.ok(undefined);
  }
}
