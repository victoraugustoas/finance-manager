import { CommandHandler, Result } from '@/shared/base';
import { Account } from '@/accounts/core/model/Account';
import { AccountsRepository } from '@/accounts/core/ports/repositories/Accounts.repository';
import { CreateAccountCommand } from './CreateAccount.command';

export class CreateAccountHandler implements CommandHandler<CreateAccountCommand, Account> {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  async handle(command: CreateAccountCommand): Promise<Result<Account>> {
    const createdAccount = Account.create(command);
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
