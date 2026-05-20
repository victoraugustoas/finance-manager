import { Result, UseCase } from '@/shared/base';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { Money } from '@/shared/ValueObjects';
import { ApplyTransferBetweenAccountsService } from '@/accounts/core/service/ApplyTransferBetweenAccounts.service';

interface ApplyTransferBetweenAccountsParams {
  accountIdOrigin: string;
  accountIdDestination: string;
  amount: number;
  effectivated: boolean;
}

export class ApplyTransferBetweenAccountsUseCase implements UseCase<
  ApplyTransferBetweenAccountsParams,
  void
> {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  async execute(params: ApplyTransferBetweenAccountsParams): Promise<Result<void>> {
    const accountOrigin = await this.accountsRepository.findById(params.accountIdOrigin);
    const accountDestination = await this.accountsRepository.findById(params.accountIdDestination);

    const amount = Money.create(params.amount);

    const combinedResults = Result.combine([accountOrigin, accountDestination, amount]);
    if (combinedResults.isFailure) return combinedResults.asFail();

    const applyTransferService = new ApplyTransferBetweenAccountsService(
      accountOrigin.value,
      accountDestination.value,
    );

    applyTransferService.applyTransfer(amount.value, params.effectivated);

    const combinedSave = Result.combine(
      await Promise.all([
        this.accountsRepository.save(accountOrigin.value),
        this.accountsRepository.save(accountDestination.value),
      ]),
    );

    if (combinedSave.isFailure) return combinedSave;

    return Result.ok();
  }
}
