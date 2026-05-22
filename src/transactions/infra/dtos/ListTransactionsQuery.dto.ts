import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class ListTransactionsQueryDto {
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-01-01T00:00:00.000Z',
    description: 'Period start. When omitted with endDate, the current month is used.',
  })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-01-31T23:59:59.999Z',
    description: 'Period end. When omitted with startDate, the current month is used.',
  })
  endDate?: string;
}
