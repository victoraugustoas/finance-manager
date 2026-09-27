import { Result } from '@/shared/base/result';
import { ListTransactionsQueryInDTO, TransferListItemOutDTO } from '../dto';

/**
 * Lists transfers whose `entryDate` falls inside the requested period, newest first.
 * Both boundaries are optional: each missing one falls back to the current month.
 * No pagination; an empty list is returned when nothing matches (never `null`).
 * Fails with `END_DATE_NOT_AFTER_START_DATE` when the period is inverted.
 */
export interface ListTransfersQuery {
  execute(input: ListTransactionsQueryInDTO): Promise<Result<TransferListItemOutDTO[]>>;
}
