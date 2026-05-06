import { IsNumber, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @ApiProperty({ example: 'Nubank' })
  name!: string;

  @IsNumber()
  @ApiProperty({ minimum: 0 })
  openingBalance!: number;
}
