import { Account } from '@/accounts/core/model/Account';
import { ListTransactionsReaderResult } from '@/accounts/core/ports/readers/ListTransactionsReader';
import { Money } from '@/shared/ValueObjects';

export class AccountBalanceCalculatorService {
  calculate(account: Account, transactions: ListTransactionsReaderResult[]): Money {
    return transactions.reduce((balance, transaction) => {
      const amount = Money.fromCents(transaction.amountInCents).value;
      return transaction.movementType === 'INCOME' || transaction.movementType === 'TRANSFER_IN'
        ? balance.add(amount)
        : balance.subtract(amount);
    }, account.openingBalance);
  }
}
