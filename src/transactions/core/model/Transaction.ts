import { AggregateRoot, Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { isAfter, isSameDay } from 'date-fns';
import { Money } from '@/shared/ValueObjects';
import { Effectivated, EffectivatedProps } from '@/shared/ValueObjects/Effectivated';
import { TransactionType } from '@/shared/enums/TransactionType';

export { TransactionType };

export interface TransactionProps extends EffectivatedProps {
  id?: string;
  name: string;
  amount: number;
  categoryId: string;
  subCategoryId: string;
  notes?: string;
  dueDate: Date;
  entryDate: Date;
  accountId: string;
  type: TransactionType;
}

export class Transaction extends AggregateRoot<TransactionProps> {
  amount: Money;
  effectivated: Effectivated;

  protected constructor(props: TransactionProps) {
    super(props, props.id);
    this.amount = Money.new(props.amount);
    this.effectivated = Effectivated.new({
      effectivated: props.effectivated,
      effectivatedDate: props.effectivatedDate,
    });
  }

  static create(props: TransactionProps): Result<Transaction> {
    const { amount, effectivated, effectivatedDate } = props;

    const effectivatedResult = Effectivated.create({ effectivated, effectivatedDate });
    if (effectivatedResult.isFailure) return effectivatedResult.asFail();

    if (amount <= 0) return Result.fail({ code: Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE });

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

  edit(props: Omit<TransactionProps, 'type' | 'id'>): Result<void> {
    const validation = Transaction.create({ ...props, id: this.id, type: this.props.type });
    if (validation.isFailure) return validation.asFail();
    Object.assign(this.props, props);
    this.amount = Money.new(props.amount);
    this.effectivated = Effectivated.new({
      effectivated: props.effectivated,
      effectivatedDate: props.effectivatedDate,
    });
    return Result.ok();
  }

  override copyWith(props: Partial<TransactionProps>): this {
    const copy = Transaction.new({ ...this.props, ...props }) as this;
    this.domainEvents.forEach((event) => copy.addDomainEvent(event));
    return copy;
  }

  effectivate(effectivatedDate: Date): Result<void> {
    const isValidValidDate =
      isSameDay(effectivatedDate, this.props.entryDate) ||
      isAfter(effectivatedDate, this.props.entryDate);

    if (!isValidValidDate) {
      return Result.fail({ code: Errors.TRANSACTION_EFFECTIVATED_DATE_NOT_AFTER_ENTRY_DATE });
    }

    this.props.effectivatedDate = effectivatedDate;
    return Result.ok();
  }
}
