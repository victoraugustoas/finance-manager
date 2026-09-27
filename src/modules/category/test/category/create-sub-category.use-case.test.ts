import { CategoryType } from '@/shared/enums/category-type';
import { Category, CreateSubCategory } from '@/modules/category';
import { InMemoryCategoryRepository } from '../mock/in-memory-category.repository';

describe('CreateSubCategory', () => {
  const makeCategory = () =>
    Category.create({
      name: 'Food',
      type: CategoryType.EXPENSE,
      subCategories: [{ name: 'Groceries' }],
    });

  test('should add the subcategory to an existing category', async () => {
    const repository = new InMemoryCategoryRepository();
    const category = makeCategory();
    await repository.create(category);
    const useCase = new CreateSubCategory(repository);

    const result = await useCase.execute({ categoryId: category.id, name: 'Coffee' });

    expect(result.isOk).toBe(true);
    expect(result.instance.name).toBe('Coffee');

    const saved = await repository.findById(category.id);

    expect(saved.instance.subCategories.map((sub) => sub.name)).toEqual(['Groceries', 'Coffee']);
  });

  test('should fail with CATEGORY_NOT_FOUND when the category does not exist', async () => {
    const repository = new InMemoryCategoryRepository();
    const useCase = new CreateSubCategory(repository);

    const result = await useCase.execute({
      categoryId: '11111111-1111-1111-1111-111111111111',
      name: 'Coffee',
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(Category.NOT_FOUND);
  });

  test('should reject duplicated subcategory names', async () => {
    const repository = new InMemoryCategoryRepository();
    const category = makeCategory();
    await repository.create(category);
    const useCase = new CreateSubCategory(repository);

    const result = await useCase.execute({ categoryId: category.id, name: 'groceries' });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(Category.SUBCATEGORY_DUPLICATE_NAME);
  });
});
