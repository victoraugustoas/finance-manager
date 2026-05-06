import { CategoryType } from '@/category/core/model/Category';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @ApiProperty({ example: 'Groceries' })
  name!: string;

  @IsEnum(CategoryType)
  @ApiProperty({ enum: CategoryType, example: CategoryType.EXPENSE })
  type!: CategoryType;
}
