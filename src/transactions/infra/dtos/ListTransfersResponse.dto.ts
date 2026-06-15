import { ListTransfersResult } from '@/transactions/core/queries/ListTransfers/ListTransfers.result';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ListTransfersItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Savings transfer' })
  name!: string;

  @ApiProperty({ example: 150, description: 'Amount as a decimal value' })
  amount!: number;

  @ApiPropertyOptional({ maxLength: 2000 })
  notes?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dueDate!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  entryDate!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  effectivatedDate?: string;

  @ApiProperty({ example: false })
  effectivated!: boolean;

  @ApiProperty({ format: 'uuid' })
  accountIdOrigin!: string;

  @ApiProperty({ example: 'Checking' })
  accountOriginName!: string;

  @ApiProperty({ format: 'uuid' })
  accountIdDestination!: string;

  @ApiProperty({ example: 'Savings' })
  accountDestinationName!: string;
}

export class ListTransfersResponseDto {
  @ApiProperty({ type: [ListTransfersItemResponseDto] })
  transfers!: ListTransfersItemResponseDto[];

  static fromDomain(transfers: ListTransfersResult[]): ListTransfersResponseDto {
    const dto = new ListTransfersResponseDto();
    dto.transfers = transfers.map((transfer) => {
      const item = new ListTransfersItemResponseDto();
      item.id = transfer.id;
      item.name = transfer.name;
      item.amount = transfer.amount;
      item.notes = transfer.notes;
      item.dueDate = transfer.dueDate.toISOString();
      item.entryDate = transfer.entryDate.toISOString();
      item.effectivatedDate = transfer.effectivatedDate?.toISOString();
      item.effectivated = transfer.effectivated;
      item.accountIdOrigin = transfer.accountIdOrigin;
      item.accountOriginName = transfer.accountOriginName;
      item.accountIdDestination = transfer.accountIdDestination;
      item.accountDestinationName = transfer.accountDestinationName;
      return item;
    });
    return dto;
  }
}
