import { Category, DEFAULT_SUBCATEGORY_NAME } from '@/category/core/model/Category';
import { CategoryType } from '@/shared/enums/CategoryType';
import { CreateCategoryUseCase } from '@/category/core/usecases/CreateCategory.usecase';
import { CreateSubCategoryUseCase } from '@/category/core/usecases/CreateSubCategory.usecase';
import { CreateCategoryDto } from '@/category/infra/dtos/CreateCategory.dto';
import { CreateSubCategoryDto } from '@/category/infra/dtos/CreateSubCategory.dto';
import { ListExpenseCategoriesUseCase } from '@/category/core/usecases/ListExpenseCategories.usecase';
import { ListIncomeCategoriesUseCase } from '@/category/core/usecases/ListIncomeCategories.usecase';
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
  let createCategoryExecuteMock: jest.Mock;
  let createSubCategoryExecuteMock: jest.Mock;
  let listIncomeExecuteMock: jest.Mock;
  let listExpenseExecuteMock: jest.Mock;

  beforeEach(() => {
    createCategoryExecuteMock = jest.fn();
    createSubCategoryExecuteMock = jest.fn();
    listIncomeExecuteMock = jest.fn();
    listExpenseExecuteMock = jest.fn();
    controller = new CategoriesController(
      { execute: createCategoryExecuteMock } as unknown as CreateCategoryUseCase,
      { execute: createSubCategoryExecuteMock } as unknown as CreateSubCategoryUseCase,
      { execute: listIncomeExecuteMock } as unknown as ListIncomeCategoriesUseCase,
      { execute: listExpenseExecuteMock } as unknown as ListExpenseCategoriesUseCase,
    );
  });

  describe('create()', () => {
    it('should call CreateCategoryUseCase.execute with dto fields', async () => {
      const dto: CreateCategoryDto = { name: 'Groceries', type: CategoryType.EXPENSE };
      const created = Category.new({
        name: dto.name,
        type: dto.type,
      });
      createCategoryExecuteMock.mockResolvedValue(Result.ok(created));

      await controller.create(dto);

      expect(createCategoryExecuteMock).toHaveBeenCalledTimes(1);
      expect(createCategoryExecuteMock).toHaveBeenCalledWith({
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
      createCategoryExecuteMock.mockResolvedValue(Result.ok(created));

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
      createCategoryExecuteMock.mockResolvedValue(
        Result.fail({ code: Errors.CATEGORY_NAME_EMPTY }),
      );

      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(String(loggerErrorSpy.mock.calls[0]?.[0])).toContain('Error during create category');

      loggerErrorSpy.mockRestore();
    });

    it('should log and throw InternalServerErrorException when persistence fails', async () => {
      const dto: CreateCategoryDto = { name: 'X', type: CategoryType.EXPENSE };
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      createCategoryExecuteMock.mockResolvedValue(
        Result.fail({ code: Errors.PRISMA_INSERT_ERROR }),
      );

      await expect(controller.create(dto)).rejects.toThrow(InternalServerErrorException);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);

      loggerErrorSpy.mockRestore();
    });
  });

  describe('createSubcategory()', () => {
    const categoryId = '33333333-3333-3333-3333-333333333333';

    it('should call CreateSubCategoryUseCase.execute with route param and dto name', async () => {
      const dto: CreateSubCategoryDto = { name: 'Coffee' };
      const category = Category.new({
        id: categoryId,
        name: 'Food',
        type: CategoryType.EXPENSE,
      });
      const added = category.addSubCategory('Coffee');
      createSubCategoryExecuteMock.mockResolvedValue(Result.ok(added.value));

      await controller.createSubcategory(categoryId, dto);

      expect(createSubCategoryExecuteMock).toHaveBeenCalledTimes(1);
      expect(createSubCategoryExecuteMock).toHaveBeenCalledWith({
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
      createSubCategoryExecuteMock.mockResolvedValue(Result.ok(added.value));

      const response = await controller.createSubcategory(categoryId, dto);

      expect(response.id).toBe(added.value.id);
      expect(response.name).toBe('Coffee');
    });

    it('should log and throw NotFoundException when category is missing', async () => {
      const dto: CreateSubCategoryDto = { name: 'Coffee' };
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      createSubCategoryExecuteMock.mockResolvedValue(
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
      createSubCategoryExecuteMock.mockResolvedValue(
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
      createSubCategoryExecuteMock.mockResolvedValue(
        Result.fail({ code: Errors.PRISMA_INSERT_ERROR }),
      );

      await expect(controller.createSubcategory(categoryId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );

      loggerErrorSpy.mockRestore();
    });
  });
});
