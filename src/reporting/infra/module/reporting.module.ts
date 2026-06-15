import { Module } from '@nestjs/common';
import { PrismaService } from '@/shared/infra/PrismaService';
import { BreakdownCategoriesReader } from '@/reporting/core/ports/readers/BreakdownCategoriesReader';
import { PrismaBreakdownCategoriesReader } from '@/reporting/infra/database/readers/PrismaBreakdownCategoriesReader';
import { BreakdownCategoriesHandler } from '@/reporting/core/queries/BreakdownCategories/BreakdownCategories.handler';
import { ReportingController } from '@/reporting/infra/controllers/Reporting.controller';

@Module({
  imports: [],
  controllers: [ReportingController],
  providers: [
    PrismaService,
    {
      provide: BreakdownCategoriesReader,
      useFactory: (prisma: PrismaService) => new PrismaBreakdownCategoriesReader(prisma),
      inject: [PrismaService],
    },
    {
      provide: BreakdownCategoriesHandler,
      useFactory: (reader: BreakdownCategoriesReader) => new BreakdownCategoriesHandler(reader),
      inject: [BreakdownCategoriesReader],
    },
  ],
})
export class ReportingModule {}
