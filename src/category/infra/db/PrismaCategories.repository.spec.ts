import { Category, DEFAULT_SUBCATEGORY_NAME } from '@/category/core/model/Category';
import { CategoryType } from '@/shared/enums/CategoryType';
import { PrismaCategoriesRepository } from '@/category/infra/db/PrismaCategories.repository';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';

describe('', () => {
  const categoryId = '11111111-1111-1111-1111-111111111111';
  const subCategoryId = '22222222-2222-2222-2222-222222222222';

  const makeCategory = (): Category =>
    Category.new({
      id: categoryId,
      name: 'Grocery',
      type: CategoryType.EXPENSE,
      subCategories: [{ id: subCategoryId, name: DEFAULT_SUBCATEGORY_NAME }],
    });

  const makeTransactionPrisma = () => {
    const categoryUpsert = jest.fn().mockResolvedValue(undefined);
    const subCategoryUpsert = jest.fn().mockResolvedValue(undefined);
    const subCategoryDeleteMany = jest.fn().mockResolvedValue(undefined);
    const tx = {
      category: { upsert: categoryUpsert },
      subCategory: { upsert: subCategoryUpsert, deleteMany: subCategoryDeleteMany },
    };
    const $transaction = jest.fn(async (cb: (t: typeof tx) => Promise<void>) => {
      await cb(tx);
    });
    const prisma = {
      $transaction,
      category: { findUnique: jest.fn() },
    } as unknown as PrismaService;
    return {
      prisma,
      categoryUpsert,
      subCategoryUpsert,
      subCategoryDeleteMany,
      $transaction,
      tx,
    };
  };

  describe('save()', () => {
    it('should run transaction with upserts and deleteMany and return ok', async () => {
      const { prisma, categoryUpsert, subCategoryUpsert, subCategoryDeleteMany, $transaction } =
        makeTransactionPrisma();
      const repository = new PrismaCategoriesRepository(prisma);
      const category = makeCategory();

      const result = await repository.save(category);

      expect(result.isSuccess).toBe(true);
      expect($transaction).toHaveBeenCalledTimes(1);
      expect(categoryUpsert).toHaveBeenCalledTimes(1);
      expect(categoryUpsert).toHaveBeenCalledWith({
        where: { id: categoryId },
        create: {
          id: categoryId,
          name: 'Grocery',
          type: CategoryType.EXPENSE,
          subCategories: {
            create: [{ id: subCategoryId, name: DEFAULT_SUBCATEGORY_NAME }],
          },
        },
        update: {
          name: 'Grocery',
          type: CategoryType.EXPENSE,
        },
      });
      expect(subCategoryUpsert).toHaveBeenCalledTimes(1);
      expect(subCategoryUpsert).toHaveBeenCalledWith({
        where: { id: subCategoryId },
        create: {
          id: subCategoryId,
          name: DEFAULT_SUBCATEGORY_NAME,
          categoryId,
        },
        update: {
          name: DEFAULT_SUBCATEGORY_NAME,
        },
      });
      expect(subCategoryDeleteMany).toHaveBeenCalledTimes(1);
      expect(subCategoryDeleteMany).toHaveBeenCalledWith({
        where: {
          categoryId,
          id: { notIn: [subCategoryId] },
        },
      });
    });

    it('should delete all subcategories when none remain on the aggregate', async () => {
      const { prisma, subCategoryDeleteMany, $transaction } = makeTransactionPrisma();
      const category = Category.new({
        id: categoryId,
        name: 'Empty',
        type: CategoryType.EXPENSE,
      });

      const repository = new PrismaCategoriesRepository(prisma);
      const result = await repository.save(category);

      expect(result.isSuccess).toBe(true);
      expect($transaction).toHaveBeenCalledTimes(1);
      expect(subCategoryDeleteMany).toHaveBeenCalledWith({
        where: { categoryId },
      });
    });
  });

  it('should return PRISMA_INSERT_ERROR when transaction throws', async () => {
    const prismaError = new Error('Unique constraint failed');
    const prisma = {
      $transaction: jest.fn().mockRejectedValue(prismaError),
      category: { findUnique: jest.fn() },
    } as unknown as PrismaService;

    const repository = new PrismaCategoriesRepository(prisma);
    const category = makeCategory();

    const result = await repository.save(category);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
    expect(result.errors[0].cls).toBe('PrismaCategoriesRepository');
    expect(result.errors[0].data).toEqual({ error: String(prismaError) });
  });

  describe('findById()', () => {
    it('should return null when row is missing', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = {
        $transaction: jest.fn(),
        category: { findUnique },
      } as unknown as PrismaService;

      const repository = new PrismaCategoriesRepository(prisma);

      const found = await repository.findById(categoryId);

      expect(found).toBeNull();
      expect(findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
        include: { subCategories: true },
      });
    });

    it('should map a row to a Category aggregate', async () => {
      const findUnique = jest.fn().mockResolvedValue({
        id: categoryId,
        name: 'Grocery',
        type: CategoryType.EXPENSE,
        subCategories: [{ id: subCategoryId, name: 'Books' }],
      });
      const prisma = {
        $transaction: jest.fn(),
        category: { findUnique },
      } as unknown as PrismaService;

      const repository = new PrismaCategoriesRepository(prisma);

      const found = await repository.findById(categoryId);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(categoryId);
      expect(found!.name).toBe('Grocery');
      expect(found!.type).toBe(CategoryType.EXPENSE);
      expect(found!.subCategories.map((s) => ({ id: s.id, name: s.name }))).toEqual([
        { id: subCategoryId, name: 'Books' },
      ]);
    });
  });
});
