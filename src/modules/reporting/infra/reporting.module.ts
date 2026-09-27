import { Module, Provider } from '@nestjs/common';
import { PrismaService } from '@/shared/infra/prisma.service';
import {
  AccountBalanceCalculatorService,
  BreakdownCategoriesComposerService,
  FindAccountsWithBalance,
  FindBreakdownCategories,
  FindStatement,
} from '@/modules/reporting';
import { ReportingController } from './reporting/reporting.controller';
import { PrismaBreakdownCategoriesQuery } from './reporting/provider/prisma-breakdown-categories.query';
import { PrismaListAccountsQuery } from './reporting/provider/prisma-list-accounts.query';
import { PrismaListMovementsQuery } from './reporting/provider/prisma-list-movements.query';

const queries: Provider[] = [
  PrismaBreakdownCategoriesQuery,
  PrismaListAccountsQuery,
  PrismaListMovementsQuery,
].map((Adapter) => ({
  provide: Adapter,
  useFactory: (prisma: PrismaService) => new Adapter(prisma),
  inject: [PrismaService],
}));

const services: Provider[] = [AccountBalanceCalculatorService, BreakdownCategoriesComposerService];

const useCases: Provider[] = [
  {
    provide: FindAccountsWithBalance,
    useFactory: (
      listAccounts: PrismaListAccountsQuery,
      listMovements: PrismaListMovementsQuery,
      balanceCalculator: AccountBalanceCalculatorService,
    ) => new FindAccountsWithBalance(listAccounts, listMovements, balanceCalculator),
    inject: [PrismaListAccountsQuery, PrismaListMovementsQuery, AccountBalanceCalculatorService],
  },
  {
    provide: FindBreakdownCategories,
    useFactory: (
      breakdownCategories: PrismaBreakdownCategoriesQuery,
      composer: BreakdownCategoriesComposerService,
    ) => new FindBreakdownCategories(breakdownCategories, composer),
    inject: [PrismaBreakdownCategoriesQuery, BreakdownCategoriesComposerService],
  },
  {
    provide: FindStatement,
    useFactory: (
      listAccounts: PrismaListAccountsQuery,
      listMovements: PrismaListMovementsQuery,
      balanceCalculator: AccountBalanceCalculatorService,
    ) => new FindStatement(listAccounts, listMovements, balanceCalculator),
    inject: [PrismaListAccountsQuery, PrismaListMovementsQuery, AccountBalanceCalculatorService],
  },
];

@Module({
  controllers: [ReportingController],
  providers: [PrismaService, ...queries, ...services, ...useCases],
})
export class ReportingModule {}
