import { Account } from '@/accounts/core/model/Account';
import { Money } from '@/shared/ValueObjects';

export type ListAccountsResult = {
  account: Account;
  balance: Money;
};
