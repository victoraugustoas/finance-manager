import { Controller, Get, Logger, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { MapResultErrorToHttpException } from '@/shared/infra/map-result-error-to-http-exception';
import {
  FindAccountsWithBalance,
  FindBreakdownCategories,
  FindStatement,
} from '@/modules/reporting';
import {
  BreakdownCategoriesQueryHttpDto,
  BreakdownCategoriesResponseHttpDto,
  ListAccountsQueryHttpDto,
  ListAccountsResponseHttpDto,
  StatementQueryHttpDto,
  StatementResponseHttpDto,
} from './dto/reporting.http.dto';

@Controller('reporting')
export class ReportingController {
  private readonly logger = new Logger(ReportingController.name);

  constructor(
    private readonly findAccountsWithBalance: FindAccountsWithBalance,
    private readonly findBreakdownCategories: FindBreakdownCategories,
    private readonly findStatement: FindStatement,
  ) {}

  @Get('accounts')
  @ApiOkResponse({
    description: 'All accounts have been successfully listed with balances.',
    type: ListAccountsResponseHttpDto,
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async listAccounts(
    @Query() query: ListAccountsQueryHttpDto,
  ): Promise<ListAccountsResponseHttpDto> {
    const result = await this.findAccountsWithBalance.execute({
      endDate: new Date(query.endDate),
    });
    if (result.isFailure) {
      this.logger.error(`Error during list accounts: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }

    return ListAccountsResponseHttpDto.fromQuery(result.instance);
  }

  @Get('categories/breakdown')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOkResponse({ type: BreakdownCategoriesResponseHttpDto })
  async breakdownCategories(
    @Query() query: BreakdownCategoriesQueryHttpDto,
  ): Promise<BreakdownCategoriesResponseHttpDto> {
    const result = await this.findBreakdownCategories.execute({
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
      effectivated: query.effectivated,
      categoriesId: query.categoriesId,
      type: query.type,
    });
    if (result.isFailure) {
      this.logger.error(`Error during breakdown categories: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }

    return BreakdownCategoriesResponseHttpDto.fromQuery(result.instance);
  }

  @Get('statement')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOkResponse({ type: StatementResponseHttpDto })
  async statement(@Query() query: StatementQueryHttpDto): Promise<StatementResponseHttpDto> {
    const result = await this.findStatement.execute({
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
      accountId: query.accountId,
    });
    if (result.isFailure) {
      this.logger.error(`Error during statement: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }

    return StatementResponseHttpDto.fromQuery(result.instance);
  }
}
