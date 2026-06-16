import { BreakdownCategoriesDTO } from '@/reporting/core/dto/BreakdownCategories.dto';
import { BreakdownCategoriesComposer } from '@/reporting/core/service/BreakdownCategoriesComposer/BreakdownCategoriesComposer';
import { ApiProperty } from '@nestjs/swagger';

/** Row in the breakdown: monetary total as a decimal (same convention as command DTOs). */
export class BreakdownCategoriesCategoryRowDto {
  @ApiProperty({ example: 'Food' })
  name!: string;

  @ApiProperty({ example: 125.5, description: 'Total as a decimal amount' })
  total!: number;
}

export class BreakdownCategoriesResponseDto {
  @ApiProperty({
    type: [BreakdownCategoriesCategoryRowDto],
    description:
      'At most six rows. When there are more than six categories upstream, totals beyond the top five are aggregated into one row (`Others`). Example below: six rows — five named categories plus `Others` grouping the remainder — sorted by descending total.',
    example: [
      { name: 'Housing', total: 3200 },
      { name: 'Food', total: 890.5 },
      { name: BreakdownCategoriesComposer.othersCategoryLabel, total: 412.75 },
      { name: 'Transport', total: 340 },
      { name: 'Health', total: 210 },
      { name: 'Leisure', total: 180 },
    ],
  })
  categories!: BreakdownCategoriesCategoryRowDto[];

  static fromDomain(domain: BreakdownCategoriesDTO): BreakdownCategoriesResponseDto {
    const dto = new BreakdownCategoriesResponseDto();
    dto.categories = domain.categories.map((row) => {
      const item = new BreakdownCategoriesCategoryRowDto();
      item.name = row.name;
      item.total = row.total.amount;
      return item;
    });
    return dto;
  }
}
