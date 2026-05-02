import { CategoryType } from '@/category/core/model/Category';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsEnum(CategoryType)
  type!: CategoryType;
}
