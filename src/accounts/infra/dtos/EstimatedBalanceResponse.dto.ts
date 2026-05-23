import { ApiProperty } from '@nestjs/swagger';
import { Money } from '@/shared/ValueObjects';

export class EstimatedBalanceResponseDto {
  @ApiProperty({ example: 1234.56, description: 'Estimated balance as a decimal amount' })
  estimatedBalance!: number;

  static fromDomain(balance: Money): EstimatedBalanceResponseDto {
    const dto = new EstimatedBalanceResponseDto();
    dto.estimatedBalance = balance.amount;
    return dto;
  }
}
