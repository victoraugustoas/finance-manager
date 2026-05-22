import { Account } from '@/accounts/core/model/Account';
import { ApiProperty } from '@nestjs/swagger';

export class ListAccountsItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Nubank' })
  name!: string;

  @ApiProperty({ example: 100.5, description: 'Current balance as a decimal amount' })
  balance!: number;

  @ApiProperty({ example: 100.5, description: 'Opening balance as a decimal amount' })
  openingBalance!: number;

  @ApiProperty({ example: 201, description: 'Current balance plus opening balance' })
  actualBalance!: number;
}

export class ListAccountsResponseDto {
  @ApiProperty({ type: [ListAccountsItemResponseDto] })
  accounts!: ListAccountsItemResponseDto[];

  static fromDomain(accounts: Account[]): ListAccountsResponseDto {
    const dto = new ListAccountsResponseDto();
    dto.accounts = accounts.map((account) => {
      const item = new ListAccountsItemResponseDto();
      item.id = account.id;
      item.name = account.name;
      item.balance = account.balance.amount;
      item.openingBalance = account.openingBalance.amount;
      item.actualBalance = account.actualBalance.amount;
      return item;
    });
    return dto;
  }
}
