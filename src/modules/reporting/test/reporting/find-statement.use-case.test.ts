import {
  AccountBalanceCalculatorService,
  FindStatement,
  MovementOutDTO,
  ReportingErrors,
} from '@/modules/reporting';
import { stubListAccounts, stubListMovements } from '../mock/reporting-query.mock';

const accountId = '11111111-1111-1111-1111-111111111111';
const otherAccountId = '33333333-3333-3333-3333-333333333333';

const movement = (
  overrides: Partial<MovementOutDTO> & Pick<MovementOutDTO, 'movementType' | 'amountInCents'>,
): MovementOutDTO => ({
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Movement',
  dueDate: new Date('2026-01-10T12:00:00.000Z'),
  entryDate: new Date('2026-01-05T12:00:00.000Z'),
  effectivated: true,
  ...overrides,
});

const input = {
  startDate: new Date('2026-01-01T00:00:00.000Z'),
  endDate: new Date('2026-01-31T00:00:00.000Z'),
};

describe('FindStatement', () => {
  test('should group entries by day and fold the running balance', async () => {
    const useCase = new FindStatement(
      stubListAccounts([{ id: accountId, name: 'Checking', openingBalanceInCents: 10000 }]),
      stubListMovements({
        [accountId]: [
          movement({ movementType: 'INCOME', amountInCents: 5000 }),
          movement({
            id: '44444444-4444-4444-4444-444444444444',
            movementType: 'EXPENSE',
            amountInCents: 2000,
            dueDate: new Date('2026-01-20T12:00:00.000Z'),
          }),
        ],
      }),
      new AccountBalanceCalculatorService(),
    );

    const result = await useCase.execute({ ...input, accountId });

    expect(result.isOk).toBe(true);
    expect(result.instance.days).toHaveLength(2);
    expect(result.instance.initialBalanceInCents).toBe(13000);
    expect(result.instance.finalBalanceInCents).toBe(16000);
  });

  test('should list a transfer between selected accounts only once', async () => {
    const transfer = movement({
      id: '55555555-5555-5555-5555-555555555555',
      movementType: 'TRANSFER_OUT',
      amountInCents: 3000,
    });
    const useCase = new FindStatement(
      stubListAccounts([
        { id: accountId, name: 'Checking', openingBalanceInCents: 0 },
        { id: otherAccountId, name: 'Savings', openingBalanceInCents: 0 },
      ]),
      stubListMovements({
        [accountId]: [transfer],
        [otherAccountId]: [{ ...transfer, movementType: 'TRANSFER_IN' }],
      }),
      new AccountBalanceCalculatorService(),
    );

    const result = await useCase.execute(input);

    expect(result.instance.days).toHaveLength(1);
    expect(result.instance.days[0].entries).toHaveLength(1);
    expect(result.instance.days[0].entries[0].movementType).toBe('TRANSFER');
    expect(result.instance.days[0].entries[0].balanceImpact.direction).toBe('NEUTRAL');
  });

  test('should fail when the requested account does not exist', async () => {
    const useCase = new FindStatement(
      stubListAccounts([{ id: accountId, name: 'Checking', openingBalanceInCents: 0 }]),
      stubListMovements({}),
      new AccountBalanceCalculatorService(),
    );

    const result = await useCase.execute({ ...input, accountId: otherAccountId });

    expect(result.errors).toContain(ReportingErrors.ACCOUNT_NOT_FOUND);
  });

  test('should fail when the period is inverted', async () => {
    const useCase = new FindStatement(
      stubListAccounts([]),
      stubListMovements({}),
      new AccountBalanceCalculatorService(),
    );

    const result = await useCase.execute({
      startDate: new Date('2026-02-01T00:00:00.000Z'),
      endDate: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(result.errors).toContain('END_DATE_NOT_AFTER_START_DATE');
  });
});
