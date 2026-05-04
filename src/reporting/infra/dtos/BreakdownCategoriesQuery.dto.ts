import { IsArray, IsBoolean, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class BreakdownCategoriesQueryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
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
  categoriesId?: string[];
}
