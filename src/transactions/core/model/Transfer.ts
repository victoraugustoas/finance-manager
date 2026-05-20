import { AggregateRoot, Check, Result } from '@/shared/base';
import { Effectivated, EffectivatedProps } from '@/shared/ValueObjects/Effectivated';
import { Errors } from '@/shared/base/Errors';
import { isAfter, isSameDay } from 'date-fns';
import { TransferRegisteredEvent } from '@/transactions/core/events/TransferRegisteredEvent';

export interface TransferProps extends EffectivatedProps {
  id?: string;
  name: string;
  amount: number;
  notes?: string;
  dueDate: Date;
  entryDate: Date;
  accountIdOrigin: string;
  accountIdDestination: string;
}

export class Transfer extends AggregateRoot<TransferProps> {
  constructor(props: TransferProps) {
    super(props, props.id);
  }

  static new(props: TransferProps): Transfer {
    return new Transfer(props);
  }

  static register(props: TransferProps): Result<Transfer> {
    const newTransfer = Transfer.create(props);
    if (newTransfer.isFailure) return newTransfer;
    newTransfer.value.addDomainEvent(
      new TransferRegisteredEvent({
        accountIdDestination: props.accountIdDestination,
        accountIdOrigin: props.accountIdOrigin,
        effectivated: props.effectivated,
        amountInCents: props.amount,
        transactionId: newTransfer.value.id,
      }),
    );
    return Result.ok(newTransfer.value);
  }

  static create(props: TransferProps): Result<Transfer> {
    const { amount, effectivated, effectivatedDate } = props;

    const effectivatedResult = Effectivated.create({ effectivated, effectivatedDate });
    const amountIsPositive = Check.gt(amount, 0, { code: Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE });
    const dueDateIsAfterEntryDate = Check.isTrue(
      isSameDay(props.dueDate, props.entryDate) || isAfter(props.dueDate, props.entryDate),
      { code: Errors.TRANSACTION_DUE_DATE_NOT_AFTER_ENTRY_DATE },
    );
    const effectivatedDateIsAfterEntryDate = Check.isTrue(
      isSameDay(props.effectivatedDate!, props.entryDate) ||
        isAfter(props.effectivatedDate!, props.entryDate),
      { code: Errors.TRANSACTION_EFFECTIVATED_DATE_NOT_AFTER_ENTRY_DATE },
    );
    const accountOriginExists = Result.combine([
      Check.notNull(props.accountIdOrigin, { code: Errors.TRANSFER_ACCOUNT_ORIGIN_REQUIRED }),
      Check.notEmpty(props.accountIdOrigin, { code: Errors.TRANSFER_ACCOUNT_ORIGIN_REQUIRED }),
    ]);
    const accountDestinationExists = Result.combine([
      Check.notNull(props.accountIdDestination, {
        code: Errors.TRANSFER_ACCOUNT_DESTINATION_REQUIRED,
      }),
      Check.notEmpty(props.accountIdDestination, {
        code: Errors.TRANSFER_ACCOUNT_DESTINATION_REQUIRED,
      }),
    ]);

    const combinedResults = Result.combine([
      effectivatedResult,
      amountIsPositive,
      dueDateIsAfterEntryDate,
      ...(props.effectivatedDate !== undefined && effectivated
        ? [effectivatedDateIsAfterEntryDate]
        : []),
      accountOriginExists,
      accountDestinationExists,
    ]);
    if (combinedResults.isFailure) return combinedResults;

    return Result.ok(new Transfer(props));
  }
}
