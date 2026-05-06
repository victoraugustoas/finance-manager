import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { CreateAccountUseCase } from '@/accounts/core/usecases/CreateAccount.usecase';
import { CreateAccountDto } from '@/accounts/infra/dtos/CreateAccount.dto';
import { CreateAccountResponseDto } from '@/accounts/infra/dtos/CreateAccountResponse.dto';
import { MapResultErrorToHttpException } from '@/shared/infra/MapResultErrorToHttpException';
import { ApiCreatedResponse } from '@nestjs/swagger';

@Controller('accounts')
export class AccountsController {
  private readonly logger = new Logger(AccountsController.name);

  constructor(private readonly createAccountUseCase: CreateAccountUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'The account has been successfully created.',
    type: CreateAccountResponseDto,
  })
  async create(@Body() dto: CreateAccountDto): Promise<CreateAccountResponseDto> {
    const result = await this.createAccountUseCase.execute({
      name: dto.name,
      openingBalance: dto.openingBalance,
      balance: 0,
    });
    if (result.isFailure) {
      this.logger.error(`Error during create account: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
    return CreateAccountResponseDto.fromDomain(result.value);
  }
}
