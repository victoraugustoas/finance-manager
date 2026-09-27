import { CategoryType } from '@/shared/enums/category-type';
import { Category, DEFAULT_SUBCATEGORY_NAME, SubCategory } from '@/modules/category';

describe('Category', () => {
  test('should seed the default subcategory when none is provided', () => {
    const result = Category.tryCreate({ name: 'Food', type: CategoryType.EXPENSE });

    expect(result.isOk).toBe(true);
    expect(result.instance.subCategories).toHaveLength(1);
    expect(result.instance.subCategories[0].name).toBe(DEFAULT_SUBCATEGORY_NAME);
  });

  test('should trim the name and keep the provided subcategories', () => {
    const result = Category.tryCreate({
      name: '  Food  ',
      type: CategoryType.EXPENSE,
      subCategories: [{ name: 'Groceries' }, { name: 'Restaurants' }],
    });

    expect(result.instance.name).toBe('Food');
    expect(result.instance.subCategories.map((sub) => sub.name)).toEqual([
      'Groceries',
      'Restaurants',
    ]);
  });

  test('should fail when the name is empty', () => {
    const result = Category.tryCreate({ name: '   ', type: CategoryType.INCOME });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(Category.NAME_EMPTY);
  });

  test('should fail when a subcategory name is empty', () => {
    const result = Category.tryCreate({
      name: 'Food',
      type: CategoryType.EXPENSE,
      subCategories: [{ name: '' }],
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(SubCategory.NAME_EMPTY);
  });

  describe('addSubCategory()', () => {
    test('should append a new subcategory', () => {
      const category = Category.create({
        name: 'Food',
        type: CategoryType.EXPENSE,
        subCategories: [{ name: 'Groceries' }],
      });

      const added = category.addSubCategory('Coffee');

      expect(added.isOk).toBe(true);
      expect(category.subCategories.map((sub) => sub.name)).toEqual(['Groceries', 'Coffee']);
    });

    test('should reject a duplicated name regardless of casing', () => {
      const category = Category.create({
        name: 'Food',
        type: CategoryType.EXPENSE,
        subCategories: [{ name: 'Coffee' }],
      });

      const added = category.addSubCategory('coffee');

      expect(added.isFailure).toBe(true);
      expect(added.errors).toContain(Category.SUBCATEGORY_DUPLICATE_NAME);
      expect(category.subCategories).toHaveLength(1);
    });
  });
});
