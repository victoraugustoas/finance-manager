import { Account } from '@/accounts/core/model/Account';
import { ListTransactionsQueryResult } from '@/accounts/core/provider/ListTransactions.query';
import { Money } from '@/shared/ValueObjects';

export class EstimatedBalanceService {
  calculate(account: Account, transactions: ListTransactionsQueryResult[]): Money {
    return transactions.reduce((acc, t) => {
      const amount = Money.fromCents(t.amountInCents).value;
      return t.movementType === 'INCOME' || t.movementType === 'TRANSFER_IN'
        ? acc.add(amount)
        : acc.subtract(amount);
    }, account.actualBalance);
  }
}
