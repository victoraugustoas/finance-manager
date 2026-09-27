import { AggregateRoot } from '@/shared/base/aggregate-root';
import { EntityProps } from '@/shared/base/entity';
import { Result } from '@/shared/base/result';
import { Money } from '@/shared/ValueObjects/money.vo';
import { isAfter, isSameDay } from 'date-fns';
import { Effectivated, EffectivatedProps } from './effectivated.vo';
import { TransferRegisteredEvent } from './transaction.event';

export interface TransferProps extends EntityProps, EffectivatedProps {
  name: string;
  /** Amount in minor units (cents). */
  amount: number;
  notes?: string;
  dueDate: Date;
  entryDate: Date;
  accountIdOrigin: string;
  accountIdDestination: string;
}

export class Transfer extends AggregateRoot<Transfer, TransferProps> {
  static readonly AMOUNT_NOT_POSITIVE = 'AMOUNT_NOT_ZERO_OR_NEGATIVE';
  static readonly DUE_DATE_BEFORE_ENTRY_DATE = 'TRANSACTION_DUE_DATE_NOT_AFTER_ENTRY_DATE';
  static readonly EFFECTIVATED_DATE_BEFORE_ENTRY_DATE =
    'TRANSACTION_EFFECTIVATED_DATE_NOT_AFTER_ENTRY_DATE';
  static readonly ACCOUNT_ORIGIN_REQUIRED = 'TRANSFER_ACCOUNT_ORIGIN_REQUIRED';
  static readonly ACCOUNT_DESTINATION_REQUIRED = 'TRANSFER_ACCOUNT_DESTINATION_REQUIRED';

  private constructor(props: TransferProps) {
    super(props);
  }

  get name(): string {
    return this.props.name;
  }

  get amount(): Money {
    return Money.fromCents(this.props.amount);
  }

  get effectivated(): Effectivated {
    return Effectivated.create({
      effectivated: this.props.effectivated,
      effectivatedDate: this.props.effectivatedDate,
    });
  }

  get accountIdOrigin(): string {
    return this.props.accountIdOrigin;
  }

  get accountIdDestination(): string {
    return this.props.accountIdDestination;
  }

  static create(props: TransferProps): Transfer {
    const result = Transfer.tryCreate(props);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  static tryCreate(props: TransferProps): Result<Transfer> {
    const effectivated = Effectivated.tryCreate({
      effectivated: props.effectivated,
      effectivatedDate: props.effectivatedDate,
    });

    const amount = Money.tryFromCents(props.amount);

    const dueDateIsAfterEntryDate =
      isSameDay(props.dueDate, props.entryDate) || isAfter(props.dueDate, props.entryDate);

    const effectivatedDateIsAfterEntryDate =
      props.effectivated && props.effectivatedDate !== undefined
        ? isSameDay(props.effectivatedDate, props.entryDate) ||
          isAfter(props.effectivatedDate, props.entryDate)
        : true;

    const validation = Result.combine([
      effectivated,
      amount,
      props.amount > 0 ? Result.ok() : Result.fail<void>(Transfer.AMOUNT_NOT_POSITIVE),
      dueDateIsAfterEntryDate
        ? Result.ok()
        : Result.fail<void>(Transfer.DUE_DATE_BEFORE_ENTRY_DATE),
      effectivatedDateIsAfterEntryDate
        ? Result.ok()
        : Result.fail<void>(Transfer.EFFECTIVATED_DATE_BEFORE_ENTRY_DATE),
      props.accountIdOrigin ? Result.ok() : Result.fail<void>(Transfer.ACCOUNT_ORIGIN_REQUIRED),
      props.accountIdDestination
        ? Result.ok()
        : Result.fail<void>(Transfer.ACCOUNT_DESTINATION_REQUIRED),
    ]);
    if (validation.isFailure) {
      return validation.withFail;
    }

    return Result.ok(new Transfer(props));
  }

  /** Valid transfer carrying a `transfer.registered` event. */
  static register(props: TransferProps): Result<Transfer> {
    const transfer = Transfer.tryCreate(props);
    if (transfer.isFailure) {
      return transfer;
    }

    transfer.instance.addEvent(
      new TransferRegisteredEvent({
        transactionId: transfer.instance.id,
        amountInCents: transfer.instance.amount.amountInCents,
        accountIdOrigin: transfer.instance.accountIdOrigin,
        accountIdDestination: transfer.instance.accountIdDestination,
        effectivated: transfer.instance.effectivated.effectivated,
      }),
    );

    return transfer;
  }
}
