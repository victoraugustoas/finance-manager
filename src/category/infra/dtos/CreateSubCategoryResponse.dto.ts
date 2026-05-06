import { SubCategory } from '@/category/core/model/SubCategory';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubCategoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Coffee' })
  name!: string;

  static fromDomain(subCategory: SubCategory): CreateSubCategoryResponseDto {
    const dto = new CreateSubCategoryResponseDto();
    dto.id = subCategory.id;
    dto.name = subCategory.name;
    return dto;
  }
}
