import { Result } from '@/shared/base/result';
import { ReportingAccountOutDTO } from '../dto';

export const ReportingErrors = {
  ACCOUNT_NOT_FOUND: 'REFERENCE_ACCOUNT_NOT_FOUND',
} as const;

/**
 * Lists every account with its opening balance, without filters or pagination.
 * Returns an empty list when there is no account (never `null`).
 */
export interface ListAccountsQuery {
  execute(): Promise<Result<ReportingAccountOutDTO[]>>;
}
