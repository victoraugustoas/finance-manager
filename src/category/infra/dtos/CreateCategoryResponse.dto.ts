import { Category, CategoryType } from '@/category/core/model/Category';
import { ApiProperty } from '@nestjs/swagger';
import { CreateSubCategoryResponseDto } from '@/category/infra/dtos/CreateSubCategoryResponse.dto';

export class CreateCategoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Groceries' })
  name!: string;

  @ApiProperty({ enum: CategoryType, example: CategoryType.EXPENSE })
  type!: CategoryType;

  @ApiProperty({ type: [CreateSubCategoryResponseDto] })
  subCategories!: CreateSubCategoryResponseDto[];

  static fromDomain(category: Category): CreateCategoryResponseDto {
    const dto = new CreateCategoryResponseDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.type = category.type;
    dto.subCategories = category.subCategories.map((sub) =>
      CreateSubCategoryResponseDto.fromDomain(sub),
    );
    return dto;
  }
}
