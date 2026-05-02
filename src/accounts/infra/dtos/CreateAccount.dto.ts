import { IsNumber, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsNumber()
  openingBalance!: number;
}
