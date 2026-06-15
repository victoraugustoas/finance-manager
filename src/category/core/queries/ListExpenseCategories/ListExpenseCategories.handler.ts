import { CategoryType } from '@/shared/enums/CategoryType';
import { CategoriesRepository } from '@/category/core/ports/repositories/Categories.repository';
import { QueryHandler, Result } from '@/shared/base';

import { ListExpenseCategoriesQuery } from './ListExpenseCategories.query';
import { ListExpenseCategoriesResult } from './ListExpenseCategories.result';

export class ListExpenseCategoriesHandler implements QueryHandler<
  ListExpenseCategoriesQuery | undefined,
  ListExpenseCategoriesResult[]
> {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async handle(
    _query: ListExpenseCategoriesQuery = {},
  ): Promise<Result<ListExpenseCategoriesResult[]>> {
    const categories = await this.categoriesRepository.findAllByType(CategoryType.EXPENSE);
    if (categories.isFailure) return categories.asFail();

    return Result.ok(categories.value);
  }
}
