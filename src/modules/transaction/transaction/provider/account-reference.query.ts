import { Result } from '@/shared/base/result';

export const AccountReferenceErrors = {
  ACCOUNT_NOT_FOUND: 'REFERENCE_ACCOUNT_NOT_FOUND',
} as const;

export interface AccountReferenceQueryInput {
  accountId: string;
}

/**
 * Cross-context check (ACL) that an account exists before a movement references it.
 * Returns an empty success; fails with `REFERENCE_ACCOUNT_NOT_FOUND` when absent.
 */
export interface AccountReferenceQuery {
  execute(input: AccountReferenceQueryInput): Promise<Result<void>>;
}
