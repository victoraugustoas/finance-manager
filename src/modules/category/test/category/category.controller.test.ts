import { Logger, NotFoundException } from '@nestjs/common';
import { Result } from '@/shared/base/result';
import { CategoryType } from '@/shared/enums/category-type';
import {
  Category,
  CategoryOutDTO,
  CreateCategory,
  CreateSubCategory,
  ListCategoriesQuery,
} from '@/modules/category';
import { CategoryController } from '../../infra/category/category.controller';

describe('CategoryController', () => {
  let controller: CategoryController;
  let createCategory: jest.Mock;
  let createSubCategory: jest.Mock;
  let listCategories: jest.Mock;

  beforeEach(() => {
    createCategory = jest.fn();
    createSubCategory = jest.fn();
    listCategories = jest.fn();
    controller = new CategoryController(
      { execute: createCategory } as unknown as CreateCategory,
      { execute: createSubCategory } as unknown as CreateSubCategory,
      { execute: listCategories } as unknown as ListCategoriesQuery,
    );
  });

  test('should list income categories wrapped in the response envelope', async () => {
    const categories: CategoryOutDTO[] = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Salary',
        type: CategoryType.INCOME,
        subCategories: [{ id: '22222222-2222-2222-2222-222222222222', name: 'Monthly' }],
      },
    ];
    listCategories.mockResolvedValue(Result.ok(categories));

    const response = await controller.listIncome();

    expect(listCategories).toHaveBeenCalledWith({ type: CategoryType.INCOME });
    expect(response).toEqual({ categories });
  });

  test('should list expense categories', async () => {
    listCategories.mockResolvedValue(Result.ok([]));

    const response = await controller.listExpense();

    expect(listCategories).toHaveBeenCalledWith({ type: CategoryType.EXPENSE });
    expect(response).toEqual({ categories: [] });
  });

  test('should create a category and map it to the response', async () => {
    const category = Category.create({ name: 'Food', type: CategoryType.EXPENSE });
    createCategory.mockResolvedValue(Result.ok(category));

    const response = await controller.create({ name: 'Food', type: CategoryType.EXPENSE });

    expect(createCategory).toHaveBeenCalledWith({ name: 'Food', type: CategoryType.EXPENSE });
    expect(response.id).toBe(category.id);
    expect(response.subCategories).toHaveLength(1);
  });

  test('should translate a missing category into 404', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    createSubCategory.mockResolvedValue(Result.fail(Category.NOT_FOUND));

    await expect(
      controller.createSubcategory('11111111-1111-1111-1111-111111111111', { name: 'Coffee' }),
    ).rejects.toThrow(NotFoundException);
  });
});
