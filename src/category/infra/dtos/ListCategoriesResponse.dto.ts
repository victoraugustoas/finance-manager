import { Category } from '@/category/core/model/Category';
import { CategoryType } from '@/shared/enums/CategoryType';
import { ApiProperty } from '@nestjs/swagger';

export class ListCategoriesSubCategoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Coffee' })
  name!: string;
}

export class ListCategoriesItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Food' })
  name!: string;

  @ApiProperty({ enum: CategoryType, example: CategoryType.EXPENSE })
  type!: CategoryType;

  @ApiProperty({ type: [ListCategoriesSubCategoryResponseDto] })
  subCategories!: ListCategoriesSubCategoryResponseDto[];
}

export class ListCategoriesResponseDto {
  @ApiProperty({ type: [ListCategoriesItemResponseDto] })
  categories!: ListCategoriesItemResponseDto[];

  static fromDomain(categories: Category[]): ListCategoriesResponseDto {
    const dto = new ListCategoriesResponseDto();
    dto.categories = categories.map((category) => {
      const item = new ListCategoriesItemResponseDto();
      item.id = category.id;
      item.name = category.name;
      item.type = category.type;
      item.subCategories = category.subCategories.map((sub) => {
        const subDto = new ListCategoriesSubCategoryResponseDto();
        subDto.id = sub.id;
        subDto.name = sub.name;
        return subDto;
      });
      return item;
    });
    return dto;
  }
}
