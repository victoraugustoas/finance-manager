import { ListTransactionsReaderResult } from '@/reporting/core/ports/readers/ListTransactionsReader';
import { ListAccountsReaderResult } from '@/reporting/core/ports/readers/ListAccountsReader';
import { Money } from '@/shared/ValueObjects';

export class AccountBalanceCalculatorService {
  calculate(
    account: ListAccountsReaderResult,
    transactions: ListTransactionsReaderResult[],
  ): Money {
    return transactions.reduce((balance, transaction) => {
      const amount = Money.fromCents(transaction.amountInCents).value;
      return transaction.movementType === 'INCOME' || transaction.movementType === 'TRANSFER_IN'
        ? balance.add(amount)
        : balance.subtract(amount);
    }, account.openingBalance);
  }
}
