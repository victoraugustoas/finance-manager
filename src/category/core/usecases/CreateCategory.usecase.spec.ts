import { DEFAULT_SUBCATEGORY_NAME } from '@/category/core/model/Category';
import { CategoryType } from '@/shared/enums/CategoryType';
import { CategoriesRepository } from '@/category/core/provider/categories.repository';
import { CreateCategoryUseCase } from '@/category/core/usecases/CreateCategory.usecase';
import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';

describe('CreateCategoryUseCase', () => {
  const baseParams = {
    name: 'Grocery',
    type: CategoryType.EXPENSE,
  };

  it('should fail when domain validation fails without calling persistence', async () => {
    const categoriesRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    } as unknown as CategoriesRepository;

    const useCase = new CreateCategoryUseCase(categoriesRepository);

    const result = await useCase.execute({ ...baseParams, name: '   ' });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.CATEGORY_NAME_EMPTY);
    expect(categoriesRepository.save).not.toHaveBeenCalled();
  });

  it('should fail when persistence fails', async () => {
    const categoriesRepository = {
      save: jest.fn().mockResolvedValue(
        Result.fail<void>({
          code: Errors.PRISMA_INSERT_ERROR,
          cls: 'test',
        }),
      ),
      findById: jest.fn(),
    } as unknown as CategoriesRepository;

    const useCase = new CreateCategoryUseCase(categoriesRepository);

    const result = await useCase.execute(baseParams);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
    expect(categoriesRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should persist and return the created category when validation passes', async () => {
    const categoriesRepository = {
      save: jest.fn().mockResolvedValue(Result.ok(undefined)),
      findById: jest.fn(),
    } as unknown as CategoriesRepository;

    const useCase = new CreateCategoryUseCase(categoriesRepository);

    const result = await useCase.execute(baseParams);

    expect(result.isSuccess).toBe(true);
    expect(result.value.name).toBe(baseParams.name);
    expect(result.value.type).toBe(baseParams.type);
    expect(result.value.subCategories).toHaveLength(1);
    expect(result.value.subCategories[0].name).toBe(DEFAULT_SUBCATEGORY_NAME);
    expect(categoriesRepository.save).toHaveBeenCalledTimes(1);
    expect(categoriesRepository.save).toHaveBeenCalledWith(result.value);
  });
});
