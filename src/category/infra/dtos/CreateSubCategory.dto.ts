import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSubCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @ApiProperty({ example: 'Coffee' })
  name!: string;
}
