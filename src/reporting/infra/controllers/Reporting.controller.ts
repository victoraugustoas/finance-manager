import { BreakdownCategoriesHandler } from '@/reporting/core/queries/BreakdownCategories/BreakdownCategories.handler';
import { BreakdownCategoriesQueryDto } from '@/reporting/infra/dtos/BreakdownCategoriesQuery.dto';
import { BreakdownCategoriesResponseDto } from '@/reporting/infra/dtos/BreakdownCategoriesResponse.dto';
import { MapResultErrorToHttpException } from '@/shared/infra/MapResultErrorToHttpException';
import { Controller, Get, Logger, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';

@Controller('reporting')
export class ReportingController {
  private readonly logger = new Logger(ReportingController.name);

  constructor(private readonly breakdownCategoriesQueryHandler: BreakdownCategoriesHandler) {}

  @Get('categories/breakdown')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOkResponse({ type: BreakdownCategoriesResponseDto })
  async breakdownCategories(
    @Query() query: BreakdownCategoriesQueryDto,
  ): Promise<BreakdownCategoriesResponseDto> {
    const result = await this.breakdownCategoriesQueryHandler.handle({
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

    return BreakdownCategoriesResponseDto.fromDomain(result.value);
  }
}
