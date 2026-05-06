import { Category, CategoryType, DEFAULT_SUBCATEGORY_NAME } from '@/category/core/model/Category';
import { CategoriesRepository } from '@/category/core/provider/categories.repository';
import { CreateSubCategoryUseCase } from '@/category/core/usecases/CreateSubCategory.usecase';
import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';

describe('CreateSubCategoryUseCase', () => {
  const categoryId = 'cat-1';

  it('should fail when category does not exist without persisting', async () => {
    const categoriesRepository = {
      findById: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    } as unknown as CategoriesRepository;

    const useCase = new CreateSubCategoryUseCase(categoriesRepository);

    const result = await useCase.execute({
      categoryId,
      name: 'College',
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.CATEGORY_NOT_FOUND);
    expect(categoriesRepository.findById).toHaveBeenCalledWith(categoryId);
    expect(categoriesRepository.save).not.toHaveBeenCalled();
  });

  it('should fail when subcategory name is empty without persisting', async () => {
    const { value: category } = Category.create({
      id: categoryId,
      name: 'Education',
      type: CategoryType.EXPENSE,
    });

    const categoriesRepository = {
      findById: jest.fn().mockResolvedValue(category),
      save: jest.fn(),
    } as unknown as CategoriesRepository;

    const useCase = new CreateSubCategoryUseCase(categoriesRepository);

    const result = await useCase.execute({
      categoryId,
      name: '   ',
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.SUBCATEGORY_NAME_EMPTY);
    expect(categoriesRepository.save).not.toHaveBeenCalled();
  });

  it('should fail when subcategory name duplicates an existing one without persisting', async () => {
    const { value: category } = Category.create({
      id: categoryId,
      name: 'Education',
      type: CategoryType.EXPENSE,
    });

    const categoriesRepository = {
      findById: jest.fn().mockResolvedValue(category),
      save: jest.fn(),
    } as unknown as CategoriesRepository;

    const useCase = new CreateSubCategoryUseCase(categoriesRepository);

    const result = await useCase.execute({
      categoryId,
      name: DEFAULT_SUBCATEGORY_NAME.toLowerCase(),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.SUBCATEGORY_DUPLICATE_NAME);
    expect(categoriesRepository.save).not.toHaveBeenCalled();
  });

  it('should fail when persistence fails after adding the subcategory', async () => {
    const { value: category } = Category.create({
      id: categoryId,
      name: 'Education',
      type: CategoryType.EXPENSE,
    });

    const categoriesRepository = {
      findById: jest.fn().mockResolvedValue(category),
      save: jest.fn().mockResolvedValue(
        Result.fail<void>({
          code: Errors.PRISMA_INSERT_ERROR,
          cls: 'test',
        }),
      ),
    } as unknown as CategoriesRepository;

    const useCase = new CreateSubCategoryUseCase(categoriesRepository);

    const result = await useCase.execute({
      categoryId,
      name: 'College',
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
    expect(categoriesRepository.save).toHaveBeenCalledTimes(1);
    expect(categoriesRepository.save).toHaveBeenCalledWith(category);
  });

  it('should persist and return the new subcategory when validation passes', async () => {
    const { value: category } = Category.create({
      id: categoryId,
      name: 'Education',
      type: CategoryType.EXPENSE,
    });

    const categoriesRepository = {
      findById: jest.fn().mockResolvedValue(category),
      save: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as CategoriesRepository;

    const useCase = new CreateSubCategoryUseCase(categoriesRepository);

    const result = await useCase.execute({
      categoryId,
      name: 'College',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.name).toBe('College');
    expect(category.subCategories.map((s) => s.name)).toEqual([
      DEFAULT_SUBCATEGORY_NAME,
      'College',
    ]);
    expect(categoriesRepository.save).toHaveBeenCalledTimes(1);
    expect(categoriesRepository.save).toHaveBeenCalledWith(category);
  });
});
