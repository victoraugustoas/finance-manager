import { Account } from '@/accounts/core/model/Account';
import { ListTransactionsQueryResult } from '@/accounts/core/provider/ListTransactions.query';
import { Money } from '@/shared/ValueObjects';

export class AccountBalanceCalculatorService {
  calculate(account: Account, transactions: ListTransactionsQueryResult[]): Money {
    return transactions.reduce((balance, transaction) => {
      const amount = Money.fromCents(transaction.amountInCents).value;
      return transaction.movementType === 'INCOME' || transaction.movementType === 'TRANSFER_IN'
        ? balance.add(amount)
        : balance.subtract(amount);
    }, account.openingBalance);
  }
}
