import { BreakdownCategoriesDTO } from '@/reporting/core/dto/BreakdownCategories.dto';

/**
 * HTTP response item: monetary amounts as decimal values (same convention as command DTOs).
 */
export interface BreakdownCategoriesCategoryResponseDto {
  name: string;
  total: number;
}

export class BreakdownCategoriesResponseDto {
  categories!: BreakdownCategoriesCategoryResponseDto[];

  static fromDomain(domain: BreakdownCategoriesDTO): BreakdownCategoriesCategoryResponseDto[] {
    return domain.categories.map(
      (row): BreakdownCategoriesCategoryResponseDto => ({
        name: row.name,
        total: row.total.amount,
      }),
    );
  }
}
