import { Result, UseCase } from '@/shared/base';
import { Account, AccountProps } from '@/accounts/core/model/Account';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';

type CreateAccountParams = Omit<AccountProps, 'id'>;

export class CreateAccountUseCase implements UseCase<CreateAccountParams, Account> {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  async execute(params: CreateAccountParams): Promise<Result<Account>> {
    const createdAccount = Account.create(params);
    if (createdAccount.isFailure) {
      return createdAccount.asFail();
    }

    const createdInPersistenceLayer = await this.accountsRepository.save(createdAccount.value);
    if (createdInPersistenceLayer.isFailure) {
      return createdInPersistenceLayer.asFail();
    }

    return Result.ok(createdAccount.value);
  }
}
