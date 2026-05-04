import { Module } from '@nestjs/common';
import { PrismaService } from '@/shared/infra/PrismaService';
import { BreakdownCategoriesQuery } from '@/reporting/core/provider/BreakdownCategories.query';
import { PrismaBreakdownCategoriesQuery } from '@/reporting/infra/db/PrismaBreakdownCategories.query';
import { BreakdownCategoriesUseCase } from '@/reporting/core/usecases/BreakdownCategories.usecase';
import { ReportingController } from '@/reporting/infra/controllers/Reporting.controller';

@Module({
  imports: [],
  controllers: [ReportingController],
  providers: [
    PrismaService,
    {
      provide: BreakdownCategoriesQuery,
      useFactory: (prisma: PrismaService) => new PrismaBreakdownCategoriesQuery(prisma),
      inject: [PrismaService],
    },
    {
      provide: BreakdownCategoriesUseCase,
      useFactory: (query: BreakdownCategoriesQuery) => new BreakdownCategoriesUseCase(query),
      inject: [BreakdownCategoriesQuery],
    },
  ],
})
export class ReportingModule {}
