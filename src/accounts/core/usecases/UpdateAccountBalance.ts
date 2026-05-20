import { Result, UseCase } from '@/shared/base';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { Money } from '@/shared/ValueObjects';
import { TransactionType } from '@/shared/enums/TransactionType';

type UpdateAccountBalanceParams =
  | {
      updatedBy: 'NEW_TRANSACTION';
      accountId: string;
      value: number;
      effectivated: boolean;
      type: TransactionType;
    }
  | {
      updatedBy: 'EDIT';
      accountId: string;
      oldValue: number;
      newValue: number;
      newEffectivated: boolean;
      oldEffectivated: boolean;
      type: TransactionType;
    };

export class UpdateAccountBalance implements UseCase<UpdateAccountBalanceParams, void> {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  async execute(params: UpdateAccountBalanceParams): Promise<Result<void>> {
    const account = await this.accountsRepository.findById(params.accountId);
    if (account.isFailure) return account.asFail();

    if (params.updatedBy === 'NEW_TRANSACTION') {
      const money = Money.create(params.value);
      if (money.isFailure) return money.asFail();

      account.value.updateBalance({
        updatedBy: 'NEW_TRANSACTION',
        type: params.type,
        value: money.value,
        effectivated: params.effectivated,
      });
    } else {
      const oldMoney = Money.create(params.oldValue);
      const newMoney = Money.create(params.newValue);
      const combined = Result.combine([oldMoney, newMoney]);
      if (combined.isFailure) return combined.asFail();

      account.value.updateBalance({
        updatedBy: 'EDIT',
        type: params.type,
        oldValue: oldMoney.value,
        newValue: newMoney.value,
        oldEffectivated: params.oldEffectivated,
        newEffectivated: params.newEffectivated,
      });
    }

    return this.accountsRepository.save(account.value);
  }
}
