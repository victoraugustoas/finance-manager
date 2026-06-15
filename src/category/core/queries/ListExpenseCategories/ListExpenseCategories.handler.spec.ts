import { Category } from '@/category/core/model/Category';
import { CategoryType } from '@/shared/enums/CategoryType';
import { CategoriesRepository } from '@/category/core/ports/repositories/Categories.repository';
import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { ListExpenseCategoriesHandler } from './ListExpenseCategories.handler';

const makeCategory = (id: string, name: string): Category =>
  Category.new({
    id,
    name,
    type: CategoryType.EXPENSE,
    subCategories: [{ id: `${id}-sub`, name: 'Others' }],
  });

describe('ListExpenseCategoriesHandler', () => {
  it('should return all expense categories from repository', async () => {
    const categories = [makeCategory('cat-1', 'Food'), makeCategory('cat-2', 'Transport')];
    const categoriesRepository = {
      findAllByType: jest.fn().mockResolvedValue(Result.ok(categories)),
    } as unknown as CategoriesRepository;

    const handler = new ListExpenseCategoriesHandler(categoriesRepository);
    const result = await handler.handle();

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(categories);
    expect(categoriesRepository.findAllByType).toHaveBeenCalledWith(CategoryType.EXPENSE);
    expect(categoriesRepository.findAllByType).toHaveBeenCalledTimes(1);
  });

  it('should propagate repository failures', async () => {
    const categoriesRepository = {
      findAllByType: jest
        .fn()
        .mockResolvedValue(
          Result.fail<Category[]>({ code: Errors.PRISMA_QUERY_ERROR, cls: 'test' }),
        ),
    } as unknown as CategoriesRepository;

    const handler = new ListExpenseCategoriesHandler(categoriesRepository);
    const result = await handler.handle();

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
  });
});
