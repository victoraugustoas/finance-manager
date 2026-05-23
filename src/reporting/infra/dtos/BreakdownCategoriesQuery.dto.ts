import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CategoryType } from '@/shared/enums/CategoryType';

export class BreakdownCategoriesQueryDto {
  @IsDateString()
  @ApiProperty({ type: String, format: 'date-time', example: '2026-01-01T00:00:00.000Z' })
  startDate!: string;

  @IsDateString()
  @ApiProperty({ type: String, format: 'date-time', example: '2026-01-31T23:59:59.999Z' })
  endDate!: string;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @ApiProperty({ example: false })
  effectivated!: boolean;

  /** Comma-separated UUIDs, e.g. `id1,id2` */
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === '') return undefined;
    const raw = Array.isArray(value) ? value : String(value).split(',');
    return raw.map((s: string) => s.trim()).filter(Boolean);
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Optional filter: comma-separated category IDs (`id1,id2`)',
    example: ['a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002'],
  })
  categoriesId?: string[];

  @IsEnum(CategoryType)
  @ApiProperty({ enum: CategoryType, example: CategoryType.EXPENSE })
  type!: CategoryType;
}
