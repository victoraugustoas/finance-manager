import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class ListAccountsQueryDto {
  @IsDateString()
  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-01-31T23:59:59.999Z',
    description: 'Balance calculation end date.',
  })
  endDate!: string;
}
