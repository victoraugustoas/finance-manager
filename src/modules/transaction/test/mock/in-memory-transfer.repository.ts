import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { Transfer, TransferRepository } from '@/modules/transaction';

export class InMemoryTransferRepository implements TransferRepository {
  readonly items = new Map<string, Transfer>();

  async create(entity: Transfer): Promise<Result<void>> {
    this.items.set(entity.id, entity);
    return Result.ok();
  }

  async update(entity: Transfer): Promise<Result<void>> {
    this.items.set(entity.id, entity);
    return Result.ok();
  }

  async findById(id: string): Promise<Result<Transfer>> {
    const entity = this.items.get(id);
    if (!entity) {
      return Result.fail(RepositoryErrors.ENTITY_NOT_FOUND);
    }

    return Result.ok(entity);
  }

  async delete(id: string): Promise<Result<void>> {
    this.items.delete(id);
    return Result.ok();
  }
}
