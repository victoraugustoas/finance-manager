import { Category, DEFAULT_SUBCATEGORY_NAME } from '@/category/core/model/Category';
import { CategoryType } from '@/shared/enums/CategoryType';
import { CreateCategoryHandler } from '@/category/core/commands/CreateCategory/CreateCategory.handler';
import { CreateSubCategoryHandler } from '@/category/core/commands/CreateSubCategory/CreateSubCategory.handler';
import { CreateCategoryDto } from '@/category/infra/dtos/CreateCategory.dto';
import { CreateSubCategoryDto } from '@/category/infra/dtos/CreateSubCategory.dto';
import { ListExpenseCategoriesHandler } from '@/category/core/queries/ListExpenseCategories/ListExpenseCategories.handler';
import { ListIncomeCategoriesHandler } from '@/category/core/queries/ListIncomeCategories/ListIncomeCategories.handler';
import { CategoriesController } from '@/category/infra/controllers/Categories.controller';
import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let createCategoryHandleMock: jest.Mock;
  let createSubCategoryHandleMock: jest.Mock;
  let listIncomeHandleMock: jest.Mock;
  let listExpenseHandleMock: jest.Mock;

  beforeEach(() => {
    createCategoryHandleMock = jest.fn();
    createSubCategoryHandleMock = jest.fn();
    listIncomeHandleMock = jest.fn();
    listExpenseHandleMock = jest.fn();
    controller = new CategoriesController(
      { handle: createCategoryHandleMock } as unknown as CreateCategoryHandler,
      { handle: createSubCategoryHandleMock } as unknown as CreateSubCategoryHandler,
      { handle: listIncomeHandleMock } as unknown as ListIncomeCategoriesHandler,
      { handle: listExpenseHandleMock } as unknown as ListExpenseCategoriesHandler,
    );
  });

  describe('create()', () => {
    it('should call CreateCategoryHandler.handle with dto fields', async () => {
      const dto: CreateCategoryDto = { name: 'Groceries', type: CategoryType.EXPENSE };
      const created = Category.new({
        name: dto.name,
        type: dto.type,
      });
      createCategoryHandleMock.mockResolvedValue(Result.ok(created));

      await controller.create(dto);

      expect(createCategoryHandleMock).toHaveBeenCalledTimes(1);
      expect(createCategoryHandleMock).toHaveBeenCalledWith({
        name: 'Groceries',
        type: CategoryType.EXPENSE,
      });
    });

    it('should return CreateCategoryResponseDto mapped from the created category', async () => {
      const dto: CreateCategoryDto = { name: 'Income', type: CategoryType.INCOME };
      const created = Category.new({
        name: dto.name,
        type: dto.type,
      });
      const defaultSub = created.addSubCategory(DEFAULT_SUBCATEGORY_NAME);
      if (defaultSub.isFailure) {
        throw new Error('Expected addSubCategory to succeed in test setup');
      }
      createCategoryHandleMock.mockResolvedValue(Result.ok(created));

      const response = await controller.create(dto);

      expect(response.id).toBe(created.id);
      expect(response.name).toBe('Income');
      expect(response.type).toBe(CategoryType.INCOME);
      expect(response.subCategories).toHaveLength(1);
      expect(response.subCategories[0].name).toBe(DEFAULT_SUBCATEGORY_NAME);
    });

    it('should log and throw BadRequestException when domain validation fails', async () => {
      const dto: CreateCategoryDto = { name: 'X', type: CategoryType.EXPENSE };
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      createCategoryHandleMock.mockResolvedValue(Result.fail({ code: Errors.CATEGORY_NAME_EMPTY }));

      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(String(loggerErrorSpy.mock.calls[0]?.[0])).toContain('Error during create category');

      loggerErrorSpy.mockRestore();
    });

    it('should log and throw InternalServerErrorException when persistence fails', async () => {
      const dto: CreateCategoryDto = { name: 'X', type: CategoryType.EXPENSE };
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      createCategoryHandleMock.mockResolvedValue(Result.fail({ code: Errors.PRISMA_INSERT_ERROR }));

      await expect(controller.create(dto)).rejects.toThrow(InternalServerErrorException);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);

      loggerErrorSpy.mockRestore();
    });
  });

  describe('createSubcategory()', () => {
    const categoryId = '33333333-3333-3333-3333-333333333333';

    it('should call CreateSubCategoryHandler.handle with route param and dto name', async () => {
      const dto: CreateSubCategoryDto = { name: 'Coffee' };
      const category = Category.new({
        id: categoryId,
        name: 'Food',
        type: CategoryType.EXPENSE,
      });
      const added = category.addSubCategory('Coffee');
      createSubCategoryHandleMock.mockResolvedValue(Result.ok(added.value));

      await controller.createSubcategory(categoryId, dto);

      expect(createSubCategoryHandleMock).toHaveBeenCalledTimes(1);
      expect(createSubCategoryHandleMock).toHaveBeenCalledWith({
        categoryId,
        name: 'Coffee',
      });
    });

    it('should return CreateSubCategoryResponseDto mapped from the created subcategory', async () => {
      const dto: CreateSubCategoryDto = { name: 'Coffee' };
      const category = Category.new({
        id: categoryId,
        name: 'Food',
        type: CategoryType.EXPENSE,
      });
      const added = category.addSubCategory('Coffee');
      createSubCategoryHandleMock.mockResolvedValue(Result.ok(added.value));

      const response = await controller.createSubcategory(categoryId, dto);

      expect(response.id).toBe(added.value.id);
      expect(response.name).toBe('Coffee');
    });

    it('should log and throw NotFoundException when category is missing', async () => {
      const dto: CreateSubCategoryDto = { name: 'Coffee' };
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      createSubCategoryHandleMock.mockResolvedValue(
        Result.fail({ code: Errors.CATEGORY_NOT_FOUND }),
      );

      await expect(controller.createSubcategory(categoryId, dto)).rejects.toThrow(
        NotFoundException,
      );

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(String(loggerErrorSpy.mock.calls[0]?.[0])).toContain(
        'Error during create subcategory',
      );

      loggerErrorSpy.mockRestore();
    });

    it('should throw BadRequestException when subcategory validation fails', async () => {
      const dto: CreateSubCategoryDto = { name: 'Coffee' };
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      createSubCategoryHandleMock.mockResolvedValue(
        Result.fail({ code: Errors.SUBCATEGORY_DUPLICATE_NAME }),
      );

      await expect(controller.createSubcategory(categoryId, dto)).rejects.toThrow(
        BadRequestException,
      );

      loggerErrorSpy.mockRestore();
    });

    it('should throw InternalServerErrorException when persistence fails', async () => {
      const dto: CreateSubCategoryDto = { name: 'Coffee' };
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      createSubCategoryHandleMock.mockResolvedValue(
        Result.fail({ code: Errors.PRISMA_INSERT_ERROR }),
      );

      await expect(controller.createSubcategory(categoryId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );

      loggerErrorSpy.mockRestore();
    });
  });
});
