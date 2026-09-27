import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiCreatedResponse } from '@nestjs/swagger';
import { MapResultErrorToHttpException } from '@/shared/infra/map-result-error-to-http-exception';
import { CreateAccount } from '@/modules/account';
import { CreateAccountHttpDto, CreateAccountResponseHttpDto } from './dto/create-account.http.dto';

@Controller('accounts')
export class AccountController {
  private readonly logger = new Logger(AccountController.name);

  constructor(private readonly createAccount: CreateAccount) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'The account has been successfully created.',
    type: CreateAccountResponseHttpDto,
  })
  async create(@Body() dto: CreateAccountHttpDto): Promise<CreateAccountResponseHttpDto> {
    const result = await this.createAccount.execute({
      name: dto.name,
      openingBalance: dto.openingBalance,
    });
    if (result.isFailure) {
      this.logger.error(`Error during create account: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }

    return CreateAccountResponseHttpDto.fromDomain(result.instance);
  }
}
