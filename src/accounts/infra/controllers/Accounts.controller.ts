import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateAccountUseCase } from '@/accounts/core/usecases/CreateAccount.usecase';
import { ListAccountsUseCase } from '@/accounts/core/usecases/ListAccounts.usecase';
import { EstimatedBalanceUseCase } from '@/accounts/core/usecases/EstimatedBalance.usecase';
import { CreateAccountDto } from '@/accounts/infra/dtos/CreateAccount.dto';
import { CreateAccountResponseDto } from '@/accounts/infra/dtos/CreateAccountResponse.dto';
import { ListAccountsResponseDto } from '@/accounts/infra/dtos/ListAccountsResponse.dto';
import { EstimatedBalanceResponseDto } from '@/accounts/infra/dtos/EstimatedBalanceResponse.dto';
import { ListTransactionsQueryDto } from '@/transactions/infra/dtos/ListTransactionsQuery.dto';
import { MapResultErrorToHttpException } from '@/shared/infra/MapResultErrorToHttpException';
import { ApiCreatedResponse, ApiOkResponse, ApiParam } from '@nestjs/swagger';

@Controller('accounts')
export class AccountsController {
  private readonly logger = new Logger(AccountsController.name);

  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly listAccountsUseCase: ListAccountsUseCase,
    private readonly estimatedBalanceUseCase: EstimatedBalanceUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'All accounts have been successfully listed.',
    type: ListAccountsResponseDto,
  })
  async list(): Promise<ListAccountsResponseDto> {
    const result = await this.listAccountsUseCase.execute();
    if (result.isFailure) {
      this.logger.error(`Error during list accounts: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
    return ListAccountsResponseDto.fromDomain(result.value);
  }

  @Get(':id/estimated-balance')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({
    description: 'Estimated balance for the account over the given period.',
    type: EstimatedBalanceResponseDto,
  })
  async estimatedBalance(
    @Param('id') id: string,
    @Query() query: ListTransactionsQueryDto,
  ): Promise<EstimatedBalanceResponseDto> {
    const result = await this.estimatedBalanceUseCase.execute({
      accountId: id,
      startDate: query.startDate !== undefined ? new Date(query.startDate) : undefined,
      endDate: query.endDate !== undefined ? new Date(query.endDate) : undefined,
    });

    if (result.isFailure) {
      this.logger.error(`Error during estimated balance: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }

    return EstimatedBalanceResponseDto.fromDomain(result.value.estimatedBalance);
  }

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
