import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, MaxLength, MinLength } from 'class-validator';
import { Account } from '@/modules/account';

export class CreateAccountHttpDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @ApiProperty({ example: 'Nubank' })
  name!: string;

  @IsNumber()
  @ApiProperty({ minimum: 0 })
  openingBalance!: number;
}

export class CreateAccountResponseHttpDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Nubank' })
  name!: string;

  @ApiProperty({ example: 100.5, description: 'Opening balance as a decimal amount' })
  openingBalance!: number;

  static fromDomain(account: Account): CreateAccountResponseHttpDto {
    const dto = new CreateAccountResponseHttpDto();
    dto.id = account.id;
    dto.name = account.name;
    dto.openingBalance = account.openingBalance.amount;
    return dto;
  }
}
