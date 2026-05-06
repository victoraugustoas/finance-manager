import { ApiProperty } from '@nestjs/swagger';
import { Account } from '@/accounts/core/model/Account';

export class CreateAccountResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Nubank' })
  name!: string;

  @ApiProperty({ example: 100.5, description: 'Opening balance as a decimal amount' })
  openingBalance!: number;

  static fromDomain(account: Account): CreateAccountResponseDto {
    const dto = new CreateAccountResponseDto();
    dto.id = account.id;
    dto.name = account.name;
    dto.openingBalance = account.openingBalance.amount;
    return dto;
  }
}
