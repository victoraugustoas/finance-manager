import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { saveWithOutbox } from '@/shared/events/infra/save-with-outbox';
import { PrismaService } from '@/shared/infra/prisma.service';
import { Transfer, TransferRepository } from '@/modules/transaction';

export class PrismaTransferRepository implements TransferRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: Transfer): Promise<Result<void>> {
    return this.upsert(entity);
  }

  async update(entity: Transfer): Promise<Result<void>> {
    return this.upsert(entity);
  }

  async findById(id: string): Promise<Result<Transfer>> {
    try {
      const row = await this.prisma.transfer.findUnique({ where: { id } });
      if (!row) {
        return Result.fail(RepositoryErrors.ENTITY_NOT_FOUND);
      }

      return Transfer.tryCreate({
        id: row.id,
        name: row.name,
        amount: row.amount,
        notes: row.notes ?? undefined,
        dueDate: row.dueDate,
        entryDate: row.entryDate,
        effectivatedDate: row.effectivatedDate ?? undefined,
        effectivated: row.effectivated,
        accountIdOrigin: row.accountIdOrigin,
        accountIdDestination: row.accountIdDestination,
      });
    } catch {
      return Result.fail(RepositoryErrors.READ_FAILED);
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await this.prisma.transfer.delete({ where: { id } });
      return Result.ok();
    } catch {
      return Result.fail(RepositoryErrors.WRITE_FAILED);
    }
  }

  private async upsert(entity: Transfer): Promise<Result<void>> {
    const data = {
      name: entity.name,
      amount: entity.amount.amountInCents,
      notes: entity.props.notes ?? null,
      dueDate: entity.props.dueDate,
      entryDate: entity.props.entryDate,
      effectivatedDate: entity.props.effectivatedDate ?? null,
      effectivated: entity.props.effectivated,
      accountIdOrigin: entity.accountIdOrigin,
      accountIdDestination: entity.accountIdDestination,
    };

    try {
      await saveWithOutbox(this.prisma, entity.peekEvents(), async (tx) => {
        await tx.transfer.upsert({
          where: { id: entity.id },
          create: { id: entity.id, ...data },
          update: data,
        });
      });
      entity.clearEvents();
      return Result.ok();
    } catch {
      return Result.fail(RepositoryErrors.WRITE_FAILED);
    }
  }
}
