import { Module } from '@nestjs/common';
import { PrismaService } from '@/shared/infra/PrismaService';
import { BreakdownCategoriesReader } from '@/reporting/core/ports/readers/BreakdownCategoriesReader';
import { PrismaBreakdownCategoriesReader } from '@/reporting/infra/database/readers/PrismaBreakdownCategoriesReader';
import { BreakdownCategoriesHandler } from '@/reporting/core/queries/BreakdownCategories/BreakdownCategories.handler';
import { ReportingController } from '@/reporting/infra/controllers/Reporting.controller';
import { ListAccountsHandler } from '@/reporting/core/queries/ListAccounts/ListAccounts.handler';
import { ListAccountsReader } from '@/reporting/core/ports/readers/ListAccountsReader';
import { PrismaListAccountsReader } from '@/reporting/infra/database/readers/PrismaListAccountsReader';
import { ListTransactionsReader } from '@/reporting/core/ports/readers/ListTransactionsReader';
import { PrismaListTransactionsReader } from '@/reporting/infra/database/readers/PrismaListTransactionsReader';
import { StatementReader } from '@/reporting/core/ports/readers/StatementReader';
import { PrismaStatementReader } from '@/reporting/infra/database/readers/PrismaStatementReader';
import { StatementHandler } from '@/reporting/core/queries/Statement/Statement.handler';

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
      provide: ListAccountsReader,
      useFactory: (prisma: PrismaService) => new PrismaListAccountsReader(prisma),
      inject: [PrismaService],
    },
    {
      provide: ListTransactionsReader,
      useFactory: (prisma: PrismaService) => new PrismaListTransactionsReader(prisma),
      inject: [PrismaService],
    },
    {
      provide: StatementReader,
      useFactory: (prisma: PrismaService) => new PrismaStatementReader(prisma),
      inject: [PrismaService],
    },
    {
      provide: BreakdownCategoriesHandler,
      useFactory: (reader: BreakdownCategoriesReader) => new BreakdownCategoriesHandler(reader),
      inject: [BreakdownCategoriesReader],
    },
    {
      provide: ListAccountsHandler,
      useFactory: (
        accountsReader: ListAccountsReader,
        transactionsReader: ListTransactionsReader,
      ) => new ListAccountsHandler(accountsReader, transactionsReader),
      inject: [ListAccountsReader, ListTransactionsReader],
    },
    {
      provide: StatementHandler,
      useFactory: (reader: StatementReader) => new StatementHandler(reader),
      inject: [StatementReader],
    },
  ],
})
export class ReportingModule {}
