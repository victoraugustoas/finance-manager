import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { CategoryType } from '@/shared/enums/category-type';
import { Category, CategoryRepository, CreateCategory } from '@/modules/category';
import { InMemoryCategoryRepository } from '../mock/in-memory-category.repository';

describe('CreateCategory', () => {
  test('should persist the category with the default subcategory', async () => {
    const repository = new InMemoryCategoryRepository();
    const useCase = new CreateCategory(repository);

    const result = await useCase.execute({ name: 'Food', type: CategoryType.EXPENSE });

    expect(result.isOk).toBe(true);
    expect(result.instance.subCategories).toHaveLength(1);

    const saved = await repository.findById(result.instance.id);

    expect(saved.isOk).toBe(true);
  });

  test('should fail without persisting when the name is empty', async () => {
    const repository = { create: jest.fn() } as unknown as CategoryRepository;
    const useCase = new CreateCategory(repository);

    const result = await useCase.execute({ name: ' ', type: CategoryType.EXPENSE });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(Category.NAME_EMPTY);
    expect(repository.create).not.toHaveBeenCalled();
  });

  test('should propagate persistence failures', async () => {
    const repository = {
      create: jest.fn().mockResolvedValue(Result.fail<void>(RepositoryErrors.WRITE_FAILED)),
    } as unknown as CategoryRepository;
    const useCase = new CreateCategory(repository);

    const result = await useCase.execute({ name: 'Food', type: CategoryType.INCOME });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(RepositoryErrors.WRITE_FAILED);
  });
});
