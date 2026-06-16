import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class StatementQueryDto {
  @IsDateString()
  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-01-01T00:00:00.000Z',
  })
  startDate!: string;

  @IsDateString()
  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-01-31T23:59:59.999Z',
  })
  endDate!: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ format: 'uuid' })
  accountId?: string;
}
