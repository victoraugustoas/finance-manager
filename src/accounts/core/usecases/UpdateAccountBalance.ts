import { Result, UseCase } from '@/shared/base';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { Money } from '@/shared/ValueObjects';

interface UpdateAccountBalanceParams {
  accountId: string;
  value: number;
  effectivated: boolean;
  type: 'EXPENSE' | 'INCOME';
}

export class UpdateAccountBalance implements UseCase<UpdateAccountBalanceParams, void> {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  async execute(params: UpdateAccountBalanceParams): Promise<Result<void>> {
    const account = await this.accountsRepository.findById(params.accountId);
    const money = Money.create(params.value);

    const combined = Result.combine([account, money]);
    if (combined.isFailure) {
      return combined;
    }

    account.value.updateBalance({
      updatedBy: 'NEW_TRANSACTION',
      type: params.type,
      value: money.value,
      effectivated: params.effectivated,
    });

    const saved = await this.accountsRepository.save(account.value);
    if (saved.isFailure) {
      return saved;
    }
    return Result.ok(undefined);
  }
}
