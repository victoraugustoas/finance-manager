import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { CategoryType } from '@/shared/enums/category-type';
import { MapResultErrorToHttpException } from '@/shared/infra/map-result-error-to-http-exception';
import { CreateCategory, CreateSubCategory, ListCategoriesQuery } from '@/modules/category';
import {
  CategoryResponseHttpDto,
  CreateCategoryHttpDto,
  CreateSubCategoryHttpDto,
  ListCategoriesResponseHttpDto,
  SubCategoryResponseHttpDto,
} from './dto/category.http.dto';
import { PrismaListCategoriesQuery } from './provider/prisma-list-categories.query';

@Controller('categories')
export class CategoryController {
  private readonly logger = new Logger(CategoryController.name);

  constructor(
    private readonly createCategory: CreateCategory,
    private readonly createSubCategory: CreateSubCategory,
    @Inject(PrismaListCategoriesQuery) private readonly listCategories: ListCategoriesQuery,
  ) {}

  @Get('income')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'All income categories have been successfully listed.',
    type: ListCategoriesResponseHttpDto,
  })
  async listIncome(): Promise<ListCategoriesResponseHttpDto> {
    return this.list(CategoryType.INCOME, 'list income categories');
  }

  @Get('expense')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'All expense categories have been successfully listed.',
    type: ListCategoriesResponseHttpDto,
  })
  async listExpense(): Promise<ListCategoriesResponseHttpDto> {
    return this.list(CategoryType.EXPENSE, 'list expense categories');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateCategoryHttpDto })
  @ApiCreatedResponse({ type: CategoryResponseHttpDto })
  async create(@Body() dto: CreateCategoryHttpDto): Promise<CategoryResponseHttpDto> {
    const result = await this.createCategory.execute({ name: dto.name, type: dto.type });
    if (result.isFailure) {
      this.logger.error(`Error during create category: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }

    return CategoryResponseHttpDto.fromDomain(result.instance);
  }

  @Post(':categoryId/subcategories')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'categoryId', format: 'uuid' })
  @ApiBody({ type: CreateSubCategoryHttpDto })
  @ApiCreatedResponse({ type: SubCategoryResponseHttpDto })
  async createSubcategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: CreateSubCategoryHttpDto,
  ): Promise<SubCategoryResponseHttpDto> {
    const result = await this.createSubCategory.execute({ categoryId, name: dto.name });
    if (result.isFailure) {
      this.logger.error(`Error during create subcategory: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }

    return SubCategoryResponseHttpDto.fromDomain(result.instance);
  }

  private async list(
    type: CategoryType,
    operation: string,
  ): Promise<ListCategoriesResponseHttpDto> {
    const result = await this.listCategories.execute({ type });
    if (result.isFailure) {
      this.logger.error(`Error during ${operation}: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }

    return ListCategoriesResponseHttpDto.fromQuery(result.instance);
  }
}
