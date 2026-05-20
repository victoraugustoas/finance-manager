import { Account } from '@/accounts/core/model/Account';
import { Money } from '@/shared/ValueObjects';

export class ApplyTransferBetweenAccountsService {
  constructor(
    private readonly accountOrigin: Account,
    private readonly accountDestination: Account,
  ) {}

  applyTransfer(amount: Money, effectivated: boolean): void {
    if (effectivated) {
      this.accountOrigin.deduceBalance(amount);
      this.accountDestination.creditBalance(amount);
    }
  }
}
