import { Category, CategoryType, DEFAULT_SUBCATEGORY_NAME } from '@/category/core/model/Category';
import { Errors } from '@/shared/base/Errors';

describe('Category', () => {
  describe('create()', () => {
    it('should create a category with trimmed name and default "Others" subcategory', () => {
      const result = Category.create({ name: '  Grocery  ', type: CategoryType.EXPENSE });

      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('Grocery');
      expect(result.value.subCategories).toHaveLength(1);
      expect(result.value.subCategories[0].name).toBe(DEFAULT_SUBCATEGORY_NAME);
    });

    it('should fail with empty name', () => {
      const result = Category.create({ name: '   ', type: CategoryType.EXPENSE });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.CATEGORY_NAME_EMPTY);
    });

    it('should use given subcategories when loading from persistence', () => {
      const result = Category.create({
        id: 'cat-1',
        name: 'Education',
        type: CategoryType.EXPENSE,
        subCategories: [
          { id: 'sub-1', name: DEFAULT_SUBCATEGORY_NAME },
          { id: 'sub-2', name: 'Books' },
        ],
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.subCategories.map((s) => s.name)).toEqual([
        DEFAULT_SUBCATEGORY_NAME,
        'Books',
      ]);
    });

    it('should fail when a persisted subcategory name is invalid', () => {
      const result = Category.create({
        id: 'cat-1',
        name: 'Education',
        type: CategoryType.EXPENSE,
        subCategories: [{ id: 'sub-1', name: '   ' }],
      });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.SUBCATEGORY_NAME_EMPTY);
    });
  });

  describe('addSubCategory()', () => {
    it('should append a subcategory under the category', () => {
      const { value: category } = Category.create({
        name: 'Education',
        type: CategoryType.EXPENSE,
      });
      const added = category.addSubCategory('College');

      expect(added.isSuccess).toBe(true);
      expect(category.subCategories.map((s) => s.name)).toEqual([
        DEFAULT_SUBCATEGORY_NAME,
        'College',
      ]);
    });

    it('should fail when subcategory name is empty', () => {
      const { value: category } = Category.create({ name: 'X', type: CategoryType.INCOME });
      const added = category.addSubCategory('  ');

      expect(added.isFailure).toBe(true);
      expect(added.errors[0].code).toBe(Errors.SUBCATEGORY_NAME_EMPTY);
    });

    it('should fail when subcategory name duplicates an existing one (case insensitive)', () => {
      const { value: category } = Category.create({ name: 'X', type: CategoryType.EXPENSE });
      const second = category.addSubCategory(DEFAULT_SUBCATEGORY_NAME);

      expect(second.isFailure).toBe(true);
      expect(second.errors[0].code).toBe(Errors.SUBCATEGORY_DUPLICATE_NAME);
    });
  });
});
