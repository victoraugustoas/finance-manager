import { Money } from '@/shared/ValueObjects/money.vo';
import { AccountBalanceCalculatorService, MovementOutDTO, MovementType } from '@/modules/reporting';

const movement = (movementType: MovementType, amountInCents: number): MovementOutDTO => ({
  id: '11111111-1111-1111-1111-111111111111',
  movementType,
  name: 'Movement',
  amountInCents,
  dueDate: new Date('2026-01-10T12:00:00.000Z'),
  entryDate: new Date('2026-01-10T12:00:00.000Z'),
  effectivated: true,
});

describe('AccountBalanceCalculatorService', () => {
  const service = new AccountBalanceCalculatorService();

  test('should add incomes and transfers in', () => {
    const balance = service.accumulate(Money.fromCents(1000), [
      movement('INCOME', 500),
      movement('TRANSFER_IN', 250),
    ]);

    expect(balance.amountInCents).toBe(1750);
  });

  test('should subtract expenses and transfers out', () => {
    const balance = service.accumulate(Money.fromCents(1000), [
      movement('EXPENSE', 300),
      movement('TRANSFER_OUT', 200),
    ]);

    expect(balance.amountInCents).toBe(500);
  });

  test('should keep the opening balance when there is no movement', () => {
    expect(service.accumulate(Money.fromCents(4200), []).amountInCents).toBe(4200);
  });
});
