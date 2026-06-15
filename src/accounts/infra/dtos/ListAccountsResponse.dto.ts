import { ListAccountsResult } from '@/accounts/core/queries/ListAccounts/ListAccounts.result';
import { ApiProperty } from '@nestjs/swagger';

export class ListAccountsItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Nubank' })
  name!: string;

  @ApiProperty({ example: 100.5, description: 'Opening balance as a decimal amount' })
  openingBalance!: number;

  @ApiProperty({ example: 201, description: 'Calculated account balance as a decimal amount' })
  balance!: number;
}

export class ListAccountsResponseDto {
  @ApiProperty({ type: [ListAccountsItemResponseDto] })
  accounts!: ListAccountsItemResponseDto[];

  static fromDomain(accounts: ListAccountsResult[]): ListAccountsResponseDto {
    const dto = new ListAccountsResponseDto();
    dto.accounts = accounts.map(({ account, balance }) => {
      const item = new ListAccountsItemResponseDto();
      item.id = account.id;
      item.name = account.name;
      item.openingBalance = account.openingBalance.amount;
      item.balance = balance.amount;
      return item;
    });
    return dto;
  }
}
