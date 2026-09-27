import { Module } from '@nestjs/common';
import { PrismaService } from '@/shared/infra/prisma.service';
import { EventsModule } from '@/shared/events/events.module';
import { AccountModule } from '@/modules/account/infra/account.module';
import { CategoryModule } from '@/modules/category/infra/category.module';
import { ReportingModule } from '@/modules/reporting/infra/reporting.module';
import { TransactionModule } from '@/modules/transaction/infra/transaction.module';

@Module({
  imports: [EventsModule, AccountModule, CategoryModule, TransactionModule, ReportingModule],
  providers: [PrismaService],
})
export class EntryPointModule {}
