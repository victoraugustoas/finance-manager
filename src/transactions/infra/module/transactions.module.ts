import { Module } from '@nestjs/common';
import { PrismaService } from '@/shared/infra/PrismaService';
import { RegisterExpenseUseCase } from '@/transactions/core/usecases/RegisterExpense.usecase';
import { RegisterIncomeUseCase } from '@/transactions/core/usecases/RegisterIncome.usecase';
import { RegisterTransferUseCase } from '@/transactions/core/usecases/RegisterTransfer.usecase';
import { EditTransactionUseCase } from '@/transactions/core/usecases/EditTransaction.usecase';
import { ListIncomeUseCase } from '@/transactions/core/usecases/ListIncome.usecase';
import { ListExpenseUseCase } from '@/transactions/core/usecases/ListExpense.usecase';
import { ListTransfersUseCase } from '@/transactions/core/usecases/ListTransfers.usecase';
import { TransactionAccountQuery } from '../../core/provider/TransactionAccount.query';
import { TransactionCategoryHierarchyQuery } from '../../core/provider/TransactionCategoryHierarchy.query';
import { ListIncomeQuery } from '@/transactions/core/provider/ListIncome.query';
import { ListExpenseQuery } from '@/transactions/core/provider/ListExpense.query';
import { ListTransfersQuery } from '@/transactions/core/provider/ListTransfers.query';
import { TransactionsRepository } from '@/transactions/core/provider/Transactions.repository';
import { PrismaTransactionAccountAcl } from '@/transactions/infra/acl/account/PrismaTransactionAccountAcl';
import { PrismaTransactionCategoryHierarchyAcl } from '@/transactions/infra/acl/category/PrismaTransactionCategoryHierarchyAcl';
import { PrismaListIncomeQuery } from '@/transactions/infra/db/PrismaListIncome.query';
import { PrismaListExpenseQuery } from '@/transactions/infra/db/PrismaListExpense.query';
import { PrismaListTransfersQuery } from '@/transactions/infra/db/PrismaListTransfers.query';
import { PrismaTransactionsRepository } from '@/transactions/infra/db/PrismaTransactions.repository';
import { TransactionsController } from '@/transactions/infra/controllers/Transactions.controller';

@Module({
  imports: [],
  controllers: [TransactionsController],
  providers: [
    PrismaService,
    {
      provide: TransactionsRepository,
      useFactory: (prisma: PrismaService) => new PrismaTransactionsRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: TransactionAccountQuery,
      useFactory: (prisma: PrismaService) => new PrismaTransactionAccountAcl(prisma),
      inject: [PrismaService],
    },
    {
      provide: TransactionCategoryHierarchyQuery,
      useFactory: (prisma: PrismaService) => new PrismaTransactionCategoryHierarchyAcl(prisma),
      inject: [PrismaService],
    },
    {
      provide: ListIncomeQuery,
      useFactory: (prisma: PrismaService) => new PrismaListIncomeQuery(prisma),
      inject: [PrismaService],
    },
    {
      provide: ListExpenseQuery,
      useFactory: (prisma: PrismaService) => new PrismaListExpenseQuery(prisma),
      inject: [PrismaService],
    },
    {
      provide: ListTransfersQuery,
      useFactory: (prisma: PrismaService) => new PrismaListTransfersQuery(prisma),
      inject: [PrismaService],
    },
    {
      provide: RegisterExpenseUseCase,
      useFactory: (
        transactionsRepository: TransactionsRepository,
        accounts: TransactionAccountQuery,
        categoryHierarchy: TransactionCategoryHierarchyQuery,
      ) => new RegisterExpenseUseCase(transactionsRepository, accounts, categoryHierarchy),
      inject: [TransactionsRepository, TransactionAccountQuery, TransactionCategoryHierarchyQuery],
    },
    {
      provide: RegisterIncomeUseCase,
      useFactory: (
        transactionsRepository: TransactionsRepository,
        accounts: TransactionAccountQuery,
        categoryHierarchy: TransactionCategoryHierarchyQuery,
      ) => new RegisterIncomeUseCase(transactionsRepository, accounts, categoryHierarchy),
      inject: [TransactionsRepository, TransactionAccountQuery, TransactionCategoryHierarchyQuery],
    },
    {
      provide: RegisterTransferUseCase,
      useFactory: (
        transactionsRepository: TransactionsRepository,
        accounts: TransactionAccountQuery,
      ) => new RegisterTransferUseCase(transactionsRepository, accounts),
      inject: [TransactionsRepository, TransactionAccountQuery],
    },
    {
      provide: EditTransactionUseCase,
      useFactory: (
        transactionsRepository: TransactionsRepository,
        accounts: TransactionAccountQuery,
        categoryHierarchy: TransactionCategoryHierarchyQuery,
      ) => new EditTransactionUseCase(transactionsRepository, accounts, categoryHierarchy),
      inject: [TransactionsRepository, TransactionAccountQuery, TransactionCategoryHierarchyQuery],
    },
    {
      provide: ListIncomeUseCase,
      useFactory: (listIncomeQuery: ListIncomeQuery) => new ListIncomeUseCase(listIncomeQuery),
      inject: [ListIncomeQuery],
    },
    {
      provide: ListExpenseUseCase,
      useFactory: (listExpenseQuery: ListExpenseQuery) => new ListExpenseUseCase(listExpenseQuery),
      inject: [ListExpenseQuery],
    },
    {
      provide: ListTransfersUseCase,
      useFactory: (listTransfersQuery: ListTransfersQuery) =>
        new ListTransfersUseCase(listTransfersQuery),
      inject: [ListTransfersQuery],
    },
  ],
})
export class TransactionsModule {}
