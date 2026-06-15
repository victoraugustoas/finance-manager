import { PrismaTransactionCategoryHierarchyReader } from '@/transactions/infra/database/readers/PrismaTransactionCategoryHierarchyReader';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';

jest.mock(
  'generated/prisma/client',
  () => ({ CategoryType: { INCOME: 'INCOME', EXPENSE: 'EXPENSE' } }),
  { virtual: true },
);

describe('PrismaTransactionCategoryHierarchyReader', () => {
  const categoryId = '11111111-1111-1111-1111-111111111111';
  const subCategoryId = '22222222-2222-2222-2222-222222222222';

  let categoryFindUnique: jest.Mock;
  let subCategoryFindUnique: jest.Mock;
  let prisma: PrismaService;
  let acl: PrismaTransactionCategoryHierarchyReader;

  beforeEach(() => {
    categoryFindUnique = jest.fn();
    subCategoryFindUnique = jest.fn();
    prisma = {
      category: { findUnique: categoryFindUnique },
      subCategory: { findUnique: subCategoryFindUnique },
    } as unknown as PrismaService;
    acl = new PrismaTransactionCategoryHierarchyReader(prisma);
  });

  describe('ensureIncomeHierarchy()', () => {
    it('should return ok when category is INCOME type and subCategory belongs to it', async () => {
      categoryFindUnique.mockResolvedValue({ type: 'INCOME' });
      subCategoryFindUnique.mockResolvedValue({ categoryId });

      const result = await acl.ensureIncomeHierarchy(categoryId, subCategoryId);

      expect(result.isSuccess).toBe(true);
    });

    it('should query category with correct where and select', async () => {
      categoryFindUnique.mockResolvedValue({ type: 'INCOME' });
      subCategoryFindUnique.mockResolvedValue({ categoryId });

      await acl.ensureIncomeHierarchy(categoryId, subCategoryId);

      expect(categoryFindUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
        select: { type: true },
      });
    });

    it('should query subCategory with correct where and select', async () => {
      categoryFindUnique.mockResolvedValue({ type: 'INCOME' });
      subCategoryFindUnique.mockResolvedValue({ categoryId });

      await acl.ensureIncomeHierarchy(categoryId, subCategoryId);

      expect(subCategoryFindUnique).toHaveBeenCalledWith({
        where: { id: subCategoryId },
        select: { categoryId: true },
      });
    });

    it('should return REFERENCE_CATEGORY_NOT_FOUND when category does not exist', async () => {
      categoryFindUnique.mockResolvedValue(null);

      const result = await acl.ensureIncomeHierarchy(categoryId, subCategoryId);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.REFERENCE_CATEGORY_NOT_FOUND);
      expect(result.errors[0].cls).toBe('PrismaTransactionCategoryHierarchyReader');
      expect(result.errors[0].data).toEqual({ categoryId });
    });

    it('should not query subCategory when category is not found', async () => {
      categoryFindUnique.mockResolvedValue(null);

      await acl.ensureIncomeHierarchy(categoryId, subCategoryId);

      expect(subCategoryFindUnique).not.toHaveBeenCalled();
    });

    it('should return REFERENCE_CATEGORY_WRONG_TYPE when category has wrong type', async () => {
      categoryFindUnique.mockResolvedValue({ type: 'EXPENSE' });

      const result = await acl.ensureIncomeHierarchy(categoryId, subCategoryId);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.REFERENCE_CATEGORY_WRONG_TYPE);
      expect(result.errors[0].cls).toBe('PrismaTransactionCategoryHierarchyReader');
      expect(result.errors[0].data).toEqual({ categoryId, expectedType: 'INCOME' });
    });

    it('should not query subCategory when category type is wrong', async () => {
      categoryFindUnique.mockResolvedValue({ type: 'EXPENSE' });

      await acl.ensureIncomeHierarchy(categoryId, subCategoryId);

      expect(subCategoryFindUnique).not.toHaveBeenCalled();
    });

    it('should return REFERENCE_SUBCATEGORY_NOT_FOUND when subCategory does not exist', async () => {
      categoryFindUnique.mockResolvedValue({ type: 'INCOME' });
      subCategoryFindUnique.mockResolvedValue(null);

      const result = await acl.ensureIncomeHierarchy(categoryId, subCategoryId);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.REFERENCE_SUBCATEGORY_NOT_FOUND);
      expect(result.errors[0].cls).toBe('PrismaTransactionCategoryHierarchyReader');
      expect(result.errors[0].data).toEqual({ subCategoryId });
    });

    it('should return REFERENCE_SUBCATEGORY_NOT_IN_CATEGORY when subCategory belongs to another category', async () => {
      categoryFindUnique.mockResolvedValue({ type: 'INCOME' });
      subCategoryFindUnique.mockResolvedValue({ categoryId: 'other-category-id' });

      const result = await acl.ensureIncomeHierarchy(categoryId, subCategoryId);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.REFERENCE_SUBCATEGORY_NOT_IN_CATEGORY);
      expect(result.errors[0].cls).toBe('PrismaTransactionCategoryHierarchyReader');
      expect(result.errors[0].data).toEqual({ categoryId, subCategoryId });
    });

    it('should return PRISMA_QUERY_ERROR when findUnique throws', async () => {
      const dbError = new Error('connection refused');
      categoryFindUnique.mockRejectedValue(dbError);

      const result = await acl.ensureIncomeHierarchy(categoryId, subCategoryId);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
      expect(result.errors[0].cls).toBe('PrismaTransactionCategoryHierarchyReader');
      expect(result.errors[0].data).toEqual({ categoryId, subCategoryId, error: String(dbError) });
    });
  });

  describe('ensureExpenseHierarchy()', () => {
    it('should return ok when category is EXPENSE type and subCategory belongs to it', async () => {
      categoryFindUnique.mockResolvedValue({ type: 'EXPENSE' });
      subCategoryFindUnique.mockResolvedValue({ categoryId });

      const result = await acl.ensureExpenseHierarchy(categoryId, subCategoryId);

      expect(result.isSuccess).toBe(true);
    });

    it('should return REFERENCE_CATEGORY_WRONG_TYPE when category has INCOME type', async () => {
      categoryFindUnique.mockResolvedValue({ type: 'INCOME' });

      const result = await acl.ensureExpenseHierarchy(categoryId, subCategoryId);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.REFERENCE_CATEGORY_WRONG_TYPE);
      expect(result.errors[0].data).toEqual({ categoryId, expectedType: 'EXPENSE' });
    });
  });
});
