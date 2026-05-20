import { Result, UseCase } from '@/shared/base';
import { TransactionsRepository } from '@/transactions/core/provider/Transactions.repository';
import { TransactionAccountQuery } from '@/transactions/core/provider/TransactionAccount.query';
import { Transfer } from '@/transactions/core/model/Transfer';

interface RegisterTransferParams {
  name: string;
  amount: number;
  dueDate: Date;
  entryDate: Date;
  effectivated: boolean;
  effectivatedDate?: Date;
  accountIdOrigin: string;
  accountIdDestination: string;
  notes?: string;
}

export class RegisterTransferUseCase implements UseCase<RegisterTransferParams, void> {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly accounts: TransactionAccountQuery,
  ) {}

  async execute(params: RegisterTransferParams): Promise<Result<void>> {
    const newTransfer = Transfer.register(params);
    const combinedResults = Result.combine([
      ...(await Promise.all([
        this.accounts.existsById(params.accountIdOrigin),
        this.accounts.existsById(params.accountIdDestination),
      ])),
      newTransfer,
    ]);

    if (combinedResults.isFailure) return combinedResults.asFail();

    const persisted = await this.transactionsRepository.saveTransfer(newTransfer.value);
    if (persisted.isFailure) return persisted;

    return Result.ok();
  }
}
