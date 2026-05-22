import { Account } from '@/accounts/core/model/Account';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { Result, UseCase } from '@/shared/base';

export type ListAccountsParams = Record<string, never>;

export class ListAccountsUseCase implements UseCase<ListAccountsParams, Account[]> {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  async execute(_params: ListAccountsParams = {}): Promise<Result<Account[]>> {
    const accounts = await this.accountsRepository.findAll();
    if (accounts.isFailure) {
      return accounts.asFail();
    }

    return Result.ok(accounts.value);
  }
}
