import { Module } from '@nestjs/common';
import { PrismaService } from '@/shared/infra/prisma.service';
import { CreateAccount } from '@/modules/account';
import { AccountController } from './account/account.controller';
import { PrismaAccountRepository } from './account/provider/prisma-account.repository';

@Module({
  controllers: [AccountController],
  providers: [
    PrismaService,
    {
      provide: PrismaAccountRepository,
      useFactory: (prisma: PrismaService) => new PrismaAccountRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: CreateAccount,
      useFactory: (repository: PrismaAccountRepository) => new CreateAccount(repository),
      inject: [PrismaAccountRepository],
    },
  ],
})
export class AccountModule {}
