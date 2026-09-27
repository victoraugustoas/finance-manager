import { Money } from '@/shared/ValueObjects/money.vo';
import { MovementOutDTO } from '../dto';

/**
 * Pure balance arithmetic: incoming movements add, outgoing movements subtract.
 * Reading movements is the read side's job; this service never performs I/O.
 */
export class AccountBalanceCalculatorService {
  applyMovement(balance: Money, movement: MovementOutDTO): Money {
    const amount = Money.fromCents(movement.amountInCents);

    return movement.movementType === 'INCOME' || movement.movementType === 'TRANSFER_IN'
      ? balance.add(amount)
      : balance.subtract(amount);
  }

  accumulate(openingBalance: Money, movements: MovementOutDTO[]): Money {
    return movements.reduce(
      (balance, movement) => this.applyMovement(balance, movement),
      openingBalance,
    );
  }
}
