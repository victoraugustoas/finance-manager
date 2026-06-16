import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { CreateAccountHandler } from '@/accounts/core/commands/CreateAccount/CreateAccount.handler';
import { CreateAccountDto } from '@/accounts/infra/dtos/CreateAccount.dto';
import { CreateAccountResponseDto } from '@/accounts/infra/dtos/CreateAccountResponse.dto';
import { MapResultErrorToHttpException } from '@/shared/infra/MapResultErrorToHttpException';
import { ApiCreatedResponse } from '@nestjs/swagger';

@Controller('accounts')
export class AccountsController {
  private readonly logger = new Logger(AccountsController.name);

  constructor(private readonly createAccountCommandHandler: CreateAccountHandler) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'The account has been successfully created.',
    type: CreateAccountResponseDto,
  })
  async create(@Body() dto: CreateAccountDto): Promise<CreateAccountResponseDto> {
    const result = await this.createAccountCommandHandler.handle({
      name: dto.name,
      openingBalance: dto.openingBalance,
    });
    if (result.isFailure) {
      this.logger.error(`Error during create account: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
    return CreateAccountResponseDto.fromDomain(result.value);
  }
}
