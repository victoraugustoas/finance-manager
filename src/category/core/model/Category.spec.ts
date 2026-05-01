import { Category, DEFAULT_SUBCATEGORY_NAME } from '@/category/core/model/Category';
import { Errors } from '@/shared/base/Errors';

describe('Category', () => {
  describe('create()', () => {
    it('should create a category with trimmed name and default "Outros" subcategory', () => {
      const result = Category.create({ name: '  Supermercado  ' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('Supermercado');
      expect(result.value.subCategories).toHaveLength(1);
      expect(result.value.subCategories[0].name).toBe(DEFAULT_SUBCATEGORY_NAME);
    });

    it('should fail with empty name', () => {
      const result = Category.create({ name: '   ' });

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(Errors.CATEGORY_NAME_EMPTY);
    });
  });

  describe('addSubCategory()', () => {
    it('should append a subcategory under the category', () => {
      const { value: category } = Category.create({ name: 'Educação' });
      const added = category.addSubCategory('Faculdade');

      expect(added.isSuccess).toBe(true);
      expect(category.subCategories.map((s) => s.name)).toEqual([
        DEFAULT_SUBCATEGORY_NAME,
        'Faculdade',
      ]);
    });

    it('should fail when subcategory name is empty', () => {
      const { value: category } = Category.create({ name: 'X' });
      const added = category.addSubCategory('  ');

      expect(added.isFailure).toBe(true);
      expect(added.error.code).toBe(Errors.SUBCATEGORY_NAME_EMPTY);
    });

    it('should fail when subcategory name duplicates an existing one (case insensitive)', () => {
      const { value: category } = Category.create({ name: 'X' });
      const second = category.addSubCategory(DEFAULT_SUBCATEGORY_NAME);

      expect(second.isFailure).toBe(true);
      expect(second.error.code).toBe(Errors.SUBCATEGORY_DUPLICATE_NAME);
    });
  });
});
