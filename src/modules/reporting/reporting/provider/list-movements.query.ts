import { Result } from '@/shared/base/result';
import { MovementOutDTO } from '../dto';

export interface ListMovementsQueryInput {
  accountId: string;
  /** Restricts to settled movements when set. */
  effectivated?: boolean;
  /** Inclusive `dueDate` window used by statement listings. */
  period?: { startDate: Date; endDate: Date };
  /** Upper bound on `dueDate`, used when accumulating balances. */
  dueUntil?: Date;
}

/**
 * Lists transactions and transfers touching one account, merged into a single movement shape.
 * Transfers are tagged `TRANSFER_IN` / `TRANSFER_OUT` from the account's point of view.
 * Unordered (consumers sort); returns an empty list when nothing matches (never `null`).
 */
export interface ListMovementsQuery {
  execute(input: ListMovementsQueryInput): Promise<Result<MovementOutDTO[]>>;
}
