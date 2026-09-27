import { CategoryType } from '@/shared/enums/category-type';
import { RegisterIncome } from '@/modules/transaction';
import { InMemoryTransactionRepository } from '../mock/in-memory-transaction.repository';
import {
  acceptingAccountReference,
  acceptingCategoryHierarchy,
} from '../mock/reference-query.mock';

const input = {
  name: 'Salary',
  amount: 3500,
  dueDate: new Date('2026-01-15T12:00:00.000Z'),
  entryDate: new Date('2026-01-10T12:00:00.000Z'),
  effectivated: true,
  effectivatedDate: new Date('2026-01-12T12:00:00.000Z'),
  accountId: '33333333-3333-3333-3333-333333333333',
  categoryId: '11111111-1111-1111-1111-111111111111',
  subCategoryId: '22222222-2222-2222-2222-222222222222',
};

describe('RegisterIncome', () => {
  test('should persist the income with its settlement date', async () => {
    const repository = new InMemoryTransactionRepository();
    const categoryHierarchy = acceptingCategoryHierarchy();
    const useCase = new RegisterIncome(repository, acceptingAccountReference(), categoryHierarchy);

    const result = await useCase.execute(input);

    expect(result.isOk).toBe(true);
    expect(result.instance.amount.amountInCents).toBe(350000);
    expect(result.instance.effectivated.effectivatedDate).toEqual(input.effectivatedDate);
    expect(categoryHierarchy.execute).toHaveBeenCalledWith(
      expect.objectContaining({ type: CategoryType.INCOME }),
    );
  });

  test('should drop the settlement date when the income is not effectivated', async () => {
    const useCase = new RegisterIncome(
      new InMemoryTransactionRepository(),
      acceptingAccountReference(),
      acceptingCategoryHierarchy(),
    );

    const result = await useCase.execute({ ...input, effectivated: false });

    expect(result.isOk).toBe(true);
    expect(result.instance.effectivated.effectivatedDate).toBeUndefined();
  });
});
