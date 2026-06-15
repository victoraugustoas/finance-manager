import { Module } from '@nestjs/common';
import { PrismaService } from '@/shared/infra/PrismaService';
import { RegisterExpenseHandler } from '@/transactions/core/commands/RegisterExpense/RegisterExpense.handler';
import { RegisterIncomeHandler } from '@/transactions/core/commands/RegisterIncome/RegisterIncome.handler';
import { RegisterTransferHandler } from '@/transactions/core/commands/RegisterTransfer/RegisterTransfer.handler';
import { EditTransactionHandler } from '@/transactions/core/commands/EditTransaction/EditTransaction.handler';
import { ListIncomeHandler } from '@/transactions/core/queries/ListIncome/ListIncome.handler';
import { ListExpenseHandler } from '@/transactions/core/queries/ListExpense/ListExpense.handler';
import { ListTransfersHandler } from '@/transactions/core/queries/ListTransfers/ListTransfers.handler';
import { TransactionAccountReader } from '../../core/ports/acl/TransactionAccount.reader';
import { TransactionCategoryHierarchyReader } from '../../core/ports/acl/TransactionCategoryHierarchy.reader';
import { ListIncomeReader } from '@/transactions/core/ports/readers/ListIncomeReader';
import { ListExpenseReader } from '@/transactions/core/ports/readers/ListExpenseReader';
import { ListTransfersReader } from '@/transactions/core/ports/readers/ListTransfersReader';
import { TransactionsRepository } from '@/transactions/core/ports/repositories/Transactions.repository';
import { PrismaTransactionAccountReader } from '@/transactions/infra/database/readers/PrismaTransactionAccountReader';
import { PrismaTransactionCategoryHierarchyReader } from '@/transactions/infra/database/readers/PrismaTransactionCategoryHierarchyReader';
import { PrismaListIncomeReader } from '@/transactions/infra/database/readers/PrismaListIncomeReader';
import { PrismaListExpenseReader } from '@/transactions/infra/database/readers/PrismaListExpenseReader';
import { PrismaListTransfersReader } from '@/transactions/infra/database/readers/PrismaListTransfersReader';
import { PrismaTransactionsRepository } from '@/transactions/infra/database/repositories/PrismaTransactions.repository';
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
      provide: TransactionAccountReader,
      useFactory: (prisma: PrismaService) => new PrismaTransactionAccountReader(prisma),
      inject: [PrismaService],
    },
    {
      provide: TransactionCategoryHierarchyReader,
      useFactory: (prisma: PrismaService) => new PrismaTransactionCategoryHierarchyReader(prisma),
      inject: [PrismaService],
    },
    {
      provide: ListIncomeReader,
      useFactory: (prisma: PrismaService) => new PrismaListIncomeReader(prisma),
      inject: [PrismaService],
    },
    {
      provide: ListExpenseReader,
      useFactory: (prisma: PrismaService) => new PrismaListExpenseReader(prisma),
      inject: [PrismaService],
    },
    {
      provide: ListTransfersReader,
      useFactory: (prisma: PrismaService) => new PrismaListTransfersReader(prisma),
      inject: [PrismaService],
    },
    {
      provide: RegisterExpenseHandler,
      useFactory: (
        transactionsRepository: TransactionsRepository,
        accounts: TransactionAccountReader,
        categoryHierarchy: TransactionCategoryHierarchyReader,
      ) => new RegisterExpenseHandler(transactionsRepository, accounts, categoryHierarchy),
      inject: [
        TransactionsRepository,
        TransactionAccountReader,
        TransactionCategoryHierarchyReader,
      ],
    },
    {
      provide: RegisterIncomeHandler,
      useFactory: (
        transactionsRepository: TransactionsRepository,
        accounts: TransactionAccountReader,
        categoryHierarchy: TransactionCategoryHierarchyReader,
      ) => new RegisterIncomeHandler(transactionsRepository, accounts, categoryHierarchy),
      inject: [
        TransactionsRepository,
        TransactionAccountReader,
        TransactionCategoryHierarchyReader,
      ],
    },
    {
      provide: RegisterTransferHandler,
      useFactory: (
        transactionsRepository: TransactionsRepository,
        accounts: TransactionAccountReader,
      ) => new RegisterTransferHandler(transactionsRepository, accounts),
      inject: [TransactionsRepository, TransactionAccountReader],
    },
    {
      provide: EditTransactionHandler,
      useFactory: (
        transactionsRepository: TransactionsRepository,
        accounts: TransactionAccountReader,
        categoryHierarchy: TransactionCategoryHierarchyReader,
      ) => new EditTransactionHandler(transactionsRepository, accounts, categoryHierarchy),
      inject: [
        TransactionsRepository,
        TransactionAccountReader,
        TransactionCategoryHierarchyReader,
      ],
    },
    {
      provide: ListIncomeHandler,
      useFactory: (listIncomeQuery: ListIncomeReader) => new ListIncomeHandler(listIncomeQuery),
      inject: [ListIncomeReader],
    },
    {
      provide: ListExpenseHandler,
      useFactory: (listExpenseQuery: ListExpenseReader) => new ListExpenseHandler(listExpenseQuery),
      inject: [ListExpenseReader],
    },
    {
      provide: ListTransfersHandler,
      useFactory: (listTransfersQuery: ListTransfersReader) =>
        new ListTransfersHandler(listTransfersQuery),
      inject: [ListTransfersReader],
    },
  ],
})
export class TransactionsModule {}
