import { Result } from '@/shared/base/result'
import { RepositoryErrors } from '@/shared/errors/shared-errors'
import {
  __AGGREGATE_CLASS_NAME__,
  __AGGREGATE_REPOSITORY_NAME__,
} from '../../../src/__AGGREGATE_NAME__'

export class __AGGREGATE_IN_MEMORY_REPOSITORY_NAME__
  implements __AGGREGATE_REPOSITORY_NAME__
{
  private readonly items = new Map<string, __AGGREGATE_CLASS_NAME__>()

  async create(entity: __AGGREGATE_CLASS_NAME__): Promise<Result<void>> {
    this.items.set(entity.id, entity)
    return Result.ok()
  }

  async update(entity: __AGGREGATE_CLASS_NAME__): Promise<Result<void>> {
    this.items.set(entity.id, entity)
    return Result.ok()
  }

  async findById(id: string): Promise<Result<__AGGREGATE_CLASS_NAME__>> {
    const entity = this.items.get(id)

    if (!entity) {
      return Result.fail(RepositoryErrors.ENTITY_NOT_FOUND)
    }

    return Result.ok(entity)
  }

  async delete(id: string): Promise<Result<void>> {
    this.items.delete(id)
    return Result.ok()
  }
}
