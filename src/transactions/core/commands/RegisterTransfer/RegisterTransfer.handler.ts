import { RegisterTransferCommand } from './RegisterTransfer.command';
import { Result } from '@/shared/base';
import { TransactionsRepository } from '@/transactions/core/ports/repositories/Transactions.repository';
import { TransactionAccountReader } from '@/transactions/core/ports/acl/TransactionAccount.reader';
import { Transfer } from '@/transactions/core/model/Transfer';

export class RegisterTransferHandler {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly accounts: TransactionAccountReader,
  ) {}

  async handle(params: RegisterTransferCommand): Promise<Result<void>> {
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
