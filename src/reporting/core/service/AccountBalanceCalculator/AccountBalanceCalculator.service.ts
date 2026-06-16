import {
  ListTransactionsReader,
  ListTransactionsReaderResult,
} from '@/reporting/core/ports/readers/ListTransactionsReader';
import { ListAccountsReader } from '@/reporting/core/ports/readers/ListAccountsReader';
import { Money } from '@/shared/ValueObjects';
import { endOfDay } from 'date-fns';
import { Check, Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';

export class AccountBalanceCalculatorService {
  constructor(
    private readonly listAccountsReader: ListAccountsReader,
    private readonly listTransactionsReader: ListTransactionsReader,
  ) {}

  async calculate(params: {
    accountId: string;
    endDate: Date;
  }): Promise<Result<{ balance: Money; estimatedBalance: Money }>> {
    const endDate = endOfDay(params.endDate);
    const accounts = await this.listAccountsReader.read();
    if (accounts.isFailure) return accounts.asFail();

    const account = accounts.value.find((account) => account.id === params.accountId);
    const accountResult = Check.notNull(account, {
      code: Errors.REFERENCE_ACCOUNT_NOT_FOUND,
      cls: this.constructor.name,
      data: { accountId: params.accountId },
    });
    if (accountResult.isFailure) return accountResult.asFail();

    const [transactionsEffectivated, allTransactions] = await Promise.all([
      this.listTransactionsReader.listTransactionsToEndDate({
        accountId: params.accountId,
        effectivated: true,
        endDate,
      }),
      this.listTransactionsReader.listTransactionsToEndDate({
        accountId: params.accountId,
        endDate,
      }),
    ]);

    const combinedResults = Result.combine([transactionsEffectivated, allTransactions]);
    if (combinedResults.isFailure) return combinedResults.asFail();

    return Result.ok({
      balance: this.accountBalanceCalculatorTransactions(
        account!.openingBalance,
        transactionsEffectivated.value,
      ),
      estimatedBalance: this.accountBalanceCalculatorTransactions(
        account!.openingBalance,
        allTransactions.value,
      ),
    });
  }

  accountBalanceCalculatorTransactions(
    openingBalance: Money,
    transactions: ListTransactionsReaderResult[],
  ) {
    return transactions.reduce(
      (balance, transaction) => this.accountBalanceCalculator(balance, transaction),
      openingBalance,
    );
  }

  accountBalanceCalculator(openingBalance: Money, transaction: ListTransactionsReaderResult) {
    const amount = transaction.amount;
    return transaction.movementType === 'INCOME' || transaction.movementType === 'TRANSFER_IN'
      ? openingBalance.add(amount)
      : openingBalance.subtract(amount);
  }
}
