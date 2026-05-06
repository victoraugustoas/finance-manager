import { CreateCategoryUseCase } from '@/category/core/usecases/CreateCategory.usecase';
import { CreateSubCategoryUseCase } from '@/category/core/usecases/CreateSubCategory.usecase';
import { CreateCategoryDto } from '@/category/infra/dtos/CreateCategory.dto';
import { CreateSubCategoryDto } from '@/category/infra/dtos/CreateSubCategory.dto';
import { MapResultErrorToHttpException } from '@/shared/infra/MapResultErrorToHttpException';
import { Body, Controller, HttpCode, HttpStatus, Logger, Param, Post } from '@nestjs/common';

@Controller('categories')
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly createSubCategoryUseCase: CreateSubCategoryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCategoryDto) {
    const result = await this.createCategoryUseCase.execute({
      name: dto.name,
      type: dto.type,
    });
    if (result.isFailure) {
      this.logger.error(`Error during create category: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
  }

  @Post(':categoryId/subcategories')
  @HttpCode(HttpStatus.CREATED)
  async createSubcategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: CreateSubCategoryDto,
  ) {
    const result = await this.createSubCategoryUseCase.execute({
      categoryId,
      name: dto.name,
    });
    if (result.isFailure) {
      this.logger.error(`Error during create subcategory: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
  }
}
