import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { Account, AccountRepository } from '@/modules/account';

export class InMemoryAccountRepository implements AccountRepository {
  private readonly items = new Map<string, Account>();

  async create(entity: Account): Promise<Result<void>> {
    this.items.set(entity.id, entity);
    return Result.ok();
  }

  async update(entity: Account): Promise<Result<void>> {
    this.items.set(entity.id, entity);
    return Result.ok();
  }

  async findById(id: string): Promise<Result<Account>> {
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
