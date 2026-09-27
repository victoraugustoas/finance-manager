import {
  AccountBalanceCalculatorService,
  FindAccountsWithBalance,
  MovementOutDTO,
} from '@/modules/reporting';
import { stubListAccounts, stubListMovements } from '../mock/reporting-query.mock';

const accountId = '11111111-1111-1111-1111-111111111111';

const movement = (
  overrides: Partial<MovementOutDTO> & Pick<MovementOutDTO, 'movementType' | 'amountInCents'>,
): MovementOutDTO => ({
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Movement',
  dueDate: new Date('2026-01-10T12:00:00.000Z'),
  entryDate: new Date('2026-01-10T12:00:00.000Z'),
  effectivated: true,
  ...overrides,
});

describe('FindAccountsWithBalance', () => {
  test('should separate settled balance from estimated balance', async () => {
    const useCase = new FindAccountsWithBalance(
      stubListAccounts([{ id: accountId, name: 'Checking', openingBalanceInCents: 10000 }]),
      stubListMovements({
        [accountId]: [
          movement({ movementType: 'INCOME', amountInCents: 5000 }),
          movement({ movementType: 'EXPENSE', amountInCents: 2000, effectivated: false }),
        ],
      }),
      new AccountBalanceCalculatorService(),
    );

    const result = await useCase.execute({ endDate: new Date('2026-01-31T00:00:00.000Z') });

    expect(result.isOk).toBe(true);
    expect(result.instance).toHaveLength(1);
    expect(result.instance[0].balanceInCents).toBe(15000);
    expect(result.instance[0].estimatedBalanceInCents).toBe(13000);
  });

  test('should return an empty list when there is no account', async () => {
    const useCase = new FindAccountsWithBalance(
      stubListAccounts([]),
      stubListMovements({}),
      new AccountBalanceCalculatorService(),
    );

    const result = await useCase.execute({ endDate: new Date('2026-01-31T00:00:00.000Z') });

    expect(result.isOk).toBe(true);
    expect(result.instance).toEqual([]);
  });
});
