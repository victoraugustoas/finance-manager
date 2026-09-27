import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { CategoryType } from '@/shared/enums/category-type';
import { Category, CategoryOutDTO, SubCategory } from '@/modules/category';

export class CreateCategoryHttpDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @ApiProperty({ example: 'Groceries' })
  name!: string;

  @IsEnum(CategoryType)
  @ApiProperty({ enum: CategoryType, example: CategoryType.EXPENSE })
  type!: CategoryType;
}

export class CreateSubCategoryHttpDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @ApiProperty({ example: 'Coffee' })
  name!: string;
}

export class SubCategoryResponseHttpDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Coffee' })
  name!: string;

  static fromDomain(subCategory: SubCategory): SubCategoryResponseHttpDto {
    const dto = new SubCategoryResponseHttpDto();
    dto.id = subCategory.id;
    dto.name = subCategory.name;
    return dto;
  }
}

export class CategoryResponseHttpDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Groceries' })
  name!: string;

  @ApiProperty({ enum: CategoryType, example: CategoryType.EXPENSE })
  type!: CategoryType;

  @ApiProperty({ type: [SubCategoryResponseHttpDto] })
  subCategories!: SubCategoryResponseHttpDto[];

  static fromDomain(category: Category): CategoryResponseHttpDto {
    const dto = new CategoryResponseHttpDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.type = category.type;
    dto.subCategories = category.subCategories.map((subCategory) =>
      SubCategoryResponseHttpDto.fromDomain(subCategory),
    );
    return dto;
  }
}

export class ListCategoriesResponseHttpDto {
  @ApiProperty({ type: [CategoryResponseHttpDto] })
  categories!: CategoryResponseHttpDto[];

  static fromQuery(categories: CategoryOutDTO[]): ListCategoriesResponseHttpDto {
    const dto = new ListCategoriesResponseHttpDto();
    dto.categories = categories.map((category) => {
      const item = new CategoryResponseHttpDto();
      item.id = category.id;
      item.name = category.name;
      item.type = category.type;
      item.subCategories = category.subCategories.map((subCategory) => {
        const subDto = new SubCategoryResponseHttpDto();
        subDto.id = subCategory.id;
        subDto.name = subCategory.name;
        return subDto;
      });
      return item;
    });
    return dto;
  }
}
