import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class ListAccountsQueryDto {
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-01-31T23:59:59.999Z',
    description:
      'Balance calculation end date. When omitted, all effectivated transactions are used.',
  })
  endDate?: string;
}
