import { AccountProps } from '@/accounts/core/model/Account';

export type CreateAccountCommand = Omit<AccountProps, 'id'>;
