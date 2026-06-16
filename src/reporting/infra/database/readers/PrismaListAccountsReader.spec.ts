import { PrismaListAccountsReader } from '@/reporting/infra/database/readers/PrismaListAccountsReader';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';

describe('PrismaListAccountsReader', () => {
  let findMany: jest.Mock;
  let reader: PrismaListAccountsReader;

  beforeEach(() => {
    findMany = jest.fn();

    reader = new PrismaListAccountsReader({
      account: { findMany },
    } as unknown as PrismaService);
  });

  it('should return all accounts as read models', async () => {
    findMany.mockResolvedValue([
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Checking',
        openingBalance: 2500,
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Savings',
        openingBalance: 15000,
      },
    ]);

    const result = await reader.read();

    expect(result.isSuccess).toBe(true);
    expect(result.value).toHaveLength(2);
    expect(result.value[0].id).toBe('11111111-1111-1111-1111-111111111111');
    expect(result.value[0].name).toBe('Checking');
    expect(result.value[0].openingBalance.amountInCents).toBe(2500);
    expect(result.value[1].id).toBe('22222222-2222-2222-2222-222222222222');
    expect(result.value[1].name).toBe('Savings');
    expect(result.value[1].openingBalance.amountInCents).toBe(15000);
  });

  it('should call findMany without filters', async () => {
    findMany.mockResolvedValue([]);

    await reader.read();

    expect(findMany).toHaveBeenCalledWith();
  });

  it('should return PRISMA_QUERY_ERROR when findMany throws', async () => {
    findMany.mockRejectedValue(new Error('Connection lost'));

    const result = await reader.read();

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
  });
});
