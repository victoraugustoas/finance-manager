import { CreateCategoryHandler } from '@/category/core/commands/CreateCategory/CreateCategory.handler';
import { CreateSubCategoryHandler } from '@/category/core/commands/CreateSubCategory/CreateSubCategory.handler';
import { ListExpenseCategoriesHandler } from '@/category/core/queries/ListExpenseCategories/ListExpenseCategories.handler';
import { ListIncomeCategoriesHandler } from '@/category/core/queries/ListIncomeCategories/ListIncomeCategories.handler';
import { CreateCategoryDto } from '@/category/infra/dtos/CreateCategory.dto';
import { CreateCategoryResponseDto } from '@/category/infra/dtos/CreateCategoryResponse.dto';
import { CreateSubCategoryDto } from '@/category/infra/dtos/CreateSubCategory.dto';
import { CreateSubCategoryResponseDto } from '@/category/infra/dtos/CreateSubCategoryResponse.dto';
import { ListCategoriesResponseDto } from '@/category/infra/dtos/ListCategoriesResponse.dto';
import { MapResultErrorToHttpException } from '@/shared/infra/MapResultErrorToHttpException';
import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiParam } from '@nestjs/swagger';

@Controller('categories')
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(
    private readonly createCategoryCommandHandler: CreateCategoryHandler,
    private readonly createSubCategoryCommandHandler: CreateSubCategoryHandler,
    private readonly listIncomeCategoriesQueryHandler: ListIncomeCategoriesHandler,
    private readonly listExpenseCategoriesQueryHandler: ListExpenseCategoriesHandler,
  ) {}

  @Get('income')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'All income categories have been successfully listed.',
    type: ListCategoriesResponseDto,
  })
  async listIncome(): Promise<ListCategoriesResponseDto> {
    const result = await this.listIncomeCategoriesQueryHandler.handle();
    if (result.isFailure) {
      this.logger.error(`Error during list income categories: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
    return ListCategoriesResponseDto.fromDomain(result.value);
  }

  @Get('expense')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'All expense categories have been successfully listed.',
    type: ListCategoriesResponseDto,
  })
  async listExpense(): Promise<ListCategoriesResponseDto> {
    const result = await this.listExpenseCategoriesQueryHandler.handle();
    if (result.isFailure) {
      this.logger.error(`Error during list expense categories: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
    return ListCategoriesResponseDto.fromDomain(result.value);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateCategoryDto })
  @ApiCreatedResponse({ type: CreateCategoryResponseDto })
  async create(@Body() dto: CreateCategoryDto): Promise<CreateCategoryResponseDto> {
    const result = await this.createCategoryCommandHandler.handle({
      name: dto.name,
      type: dto.type,
    });
    if (result.isFailure) {
      this.logger.error(`Error during create category: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
    return CreateCategoryResponseDto.fromDomain(result.value);
  }

  @Post(':categoryId/subcategories')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'categoryId', format: 'uuid' })
  @ApiBody({ type: CreateSubCategoryDto })
  @ApiCreatedResponse({ type: CreateSubCategoryResponseDto })
  async createSubcategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: CreateSubCategoryDto,
  ): Promise<CreateSubCategoryResponseDto> {
    const result = await this.createSubCategoryCommandHandler.handle({
      categoryId,
      name: dto.name,
    });
    if (result.isFailure) {
      this.logger.error(`Error during create subcategory: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
    return CreateSubCategoryResponseDto.fromDomain(result.value);
  }
}
