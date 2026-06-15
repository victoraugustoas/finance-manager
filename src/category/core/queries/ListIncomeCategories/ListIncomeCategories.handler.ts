import { CategoryType } from '@/shared/enums/CategoryType';
import { CategoriesRepository } from '@/category/core/ports/repositories/Categories.repository';
import { QueryHandler, Result } from '@/shared/base';

import { ListIncomeCategoriesQuery } from './ListIncomeCategories.query';
import { ListIncomeCategoriesResult } from './ListIncomeCategories.result';

export class ListIncomeCategoriesHandler implements QueryHandler<
  ListIncomeCategoriesQuery | undefined,
  ListIncomeCategoriesResult[]
> {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async handle(
    _query: ListIncomeCategoriesQuery = {},
  ): Promise<Result<ListIncomeCategoriesResult[]>> {
    const categories = await this.categoriesRepository.findAllByType(CategoryType.INCOME);
    if (categories.isFailure) return categories.asFail();

    return Result.ok(categories.value);
  }
}
