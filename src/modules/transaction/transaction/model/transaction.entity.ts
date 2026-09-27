import { AggregateRoot } from '@/shared/base/aggregate-root';
import { EntityProps } from '@/shared/base/entity';
import { Result } from '@/shared/base/result';
import { TransactionType } from '@/shared/enums/transaction-type';
import { Money } from '@/shared/ValueObjects/money.vo';
import { isAfter, isSameDay } from 'date-fns';
import { Effectivated, EffectivatedProps } from './effectivated.vo';
import { TransactionEditedEvent } from './transaction.event';

export interface TransactionProps extends EntityProps, EffectivatedProps {
  name: string;
  /** Amount in minor units (cents). */
  amount: number;
  categoryId: string;
  subCategoryId: string;
  notes?: string;
  dueDate: Date;
  entryDate: Date;
  accountId: string;
  type: TransactionType;
}

export type EditTransactionProps = Omit<TransactionProps, 'id' | 'type'>;

/** Common invariants of income and expense movements. */
export abstract class Transaction<Type> extends AggregateRoot<Type, TransactionProps> {
  static readonly AMOUNT_NOT_POSITIVE = 'AMOUNT_NOT_ZERO_OR_NEGATIVE';
  static readonly DUE_DATE_BEFORE_ENTRY_DATE = 'TRANSACTION_DUE_DATE_NOT_AFTER_ENTRY_DATE';
  static readonly EFFECTIVATED_DATE_BEFORE_ENTRY_DATE =
    'TRANSACTION_EFFECTIVATED_DATE_NOT_AFTER_ENTRY_DATE';

  protected constructor(props: TransactionProps) {
    super(props);
  }

  get name(): string {
    return this.props.name;
  }

  get amount(): Money {
    return Money.fromCents(this.props.amount);
  }

  get type(): TransactionType {
    return this.props.type;
  }

  get effectivated(): Effectivated {
    return Effectivated.create({
      effectivated: this.props.effectivated,
      effectivatedDate: this.props.effectivatedDate,
    });
  }

  get accountId(): string {
    return this.props.accountId;
  }

  get categoryId(): string {
    return this.props.categoryId;
  }

  get subCategoryId(): string {
    return this.props.subCategoryId;
  }

  /** Validates the invariants shared by every transaction type. */
  protected static validateProps(props: TransactionProps): Result<void> {
    const effectivated = Effectivated.tryCreate({
      effectivated: props.effectivated,
      effectivatedDate: props.effectivatedDate,
    });
    if (effectivated.isFailure) {
      return effectivated.withFail;
    }

    const amount = Money.tryFromCents(props.amount);
    if (amount.isFailure) {
      return amount.withFail;
    }

    if (props.amount <= 0) {
      return Result.fail(Transaction.AMOUNT_NOT_POSITIVE);
    }

    const dueDateIsAfterEntryDate =
      isSameDay(props.dueDate, props.entryDate) || isAfter(props.dueDate, props.entryDate);
    if (!dueDateIsAfterEntryDate) {
      return Result.fail(Transaction.DUE_DATE_BEFORE_ENTRY_DATE);
    }

    if (props.effectivated && props.effectivatedDate !== undefined) {
      const effectivatedDateIsAfterEntryDate =
        isSameDay(props.effectivatedDate, props.entryDate) ||
        isAfter(props.effectivatedDate, props.entryDate);
      if (!effectivatedDateIsAfterEntryDate) {
        return Result.fail(Transaction.EFFECTIVATED_DATE_BEFORE_ENTRY_DATE);
      }
    }

    return Result.ok();
  }

  /** Validated copy carrying a `transaction.edited` event. */
  edit(props: EditTransactionProps): Result<Type> {
    const oldValues: Omit<TransactionProps, 'id'> = { ...this.props };
    const validation = Transaction.validateProps({
      ...this.props,
      ...props,
      type: this.props.type,
    });
    if (validation.isFailure) {
      return validation.withFail;
    }

    const cloned = this.cloneWith({ ...props, type: this.props.type });
    if (cloned.isFailure) {
      return cloned;
    }

    const edited = cloned.instance as unknown as Transaction<Type>;
    edited.addEvent(
      new TransactionEditedEvent({
        oldValues,
        newValues: { ...props, type: this.props.type },
      }),
    );

    return cloned;
  }

  /** Marks the movement as settled on a date not earlier than its entry date. */
  effectivate(effectivatedDate: Date): Result<Type> {
    const isValidDate =
      isSameDay(effectivatedDate, this.props.entryDate) ||
      isAfter(effectivatedDate, this.props.entryDate);
    if (!isValidDate) {
      return Result.fail(Transaction.EFFECTIVATED_DATE_BEFORE_ENTRY_DATE);
    }

    return this.cloneWith({ effectivated: true, effectivatedDate } as Partial<TransactionProps>);
  }
}
