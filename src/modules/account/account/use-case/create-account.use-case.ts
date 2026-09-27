import { Result } from '@/shared/base/result';
import { UseCase } from '@/shared/base/UseCase';
import { Money } from '@/shared/ValueObjects/money.vo';
import { CreateAccountInDTO } from '../dto';
import { Account } from '../model';
import { AccountRepository } from '../provider';

export class CreateAccount implements UseCase<CreateAccountInDTO, Account> {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: CreateAccountInDTO): Promise<Result<Account>> {
    const openingBalance = Money.tryCreate(input.openingBalance);
    if (openingBalance.isFailure) {
      return openingBalance.withFail;
    }

    const account = Account.tryCreate({
      name: input.name,
      openingBalance: openingBalance.instance.amountInCents,
    });
    if (account.isFailure) {
      return account.withFail;
    }

    const created = await this.accountRepository.create(account.instance);
    if (created.isFailure) {
      return created.withFail;
    }

    return Result.ok(account.instance);
  }
}
