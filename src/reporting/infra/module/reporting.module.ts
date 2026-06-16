import { Module, Provider } from '@nestjs/common';
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
import { StatementHandler } from '@/reporting/core/queries/Statement/Statement.handler';
import { AccountBalanceCalculatorService } from '@/reporting/core/service/AccountBalanceCalculator/AccountBalanceCalculator.service';

const services: Provider[] = [
  {
    provide: AccountBalanceCalculatorService,
    useFactory: (
      listAccountsReader: ListAccountsReader,
      listTransactionsReader: ListTransactionsReader,
    ) => new AccountBalanceCalculatorService(listAccountsReader, listTransactionsReader),
    inject: [ListAccountsReader, ListTransactionsReader],
  },
];

const readers: Provider[] = [
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
];

const handlers: Provider[] = [
  {
    provide: BreakdownCategoriesHandler,
    useFactory: (reader: BreakdownCategoriesReader) => new BreakdownCategoriesHandler(reader),
    inject: [BreakdownCategoriesReader],
  },
  {
    provide: ListAccountsHandler,
    useFactory: (accountsReader: ListAccountsReader, transactionsReader: ListTransactionsReader) =>
      new ListAccountsHandler(
        accountsReader,
        new AccountBalanceCalculatorService(accountsReader, transactionsReader),
      ),
    inject: [ListAccountsReader, ListTransactionsReader],
  },
  {
    provide: StatementHandler,
    useFactory: (
      listTransactionsReader: ListTransactionsReader,
      listAccountsReader: ListAccountsReader,
      accountBalanceCalculator: AccountBalanceCalculatorService,
    ) => new StatementHandler(listTransactionsReader, listAccountsReader, accountBalanceCalculator),
    inject: [ListTransactionsReader, ListAccountsReader, AccountBalanceCalculatorService],
  },
];

@Module({
  imports: [],
  controllers: [ReportingController],
  providers: [PrismaService, ...services, ...readers, ...handlers],
})
export class ReportingModule {}
