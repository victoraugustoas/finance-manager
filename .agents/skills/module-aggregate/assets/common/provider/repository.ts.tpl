import { Result } from '@/shared/base/result'
import { __AGGREGATE_CLASS_NAME__ } from '../model'

export interface __AGGREGATE_REPOSITORY_NAME__ {
  create(entity: __AGGREGATE_CLASS_NAME__): Promise<Result<void>>
  update(entity: __AGGREGATE_CLASS_NAME__): Promise<Result<void>>
  findById(id: string): Promise<Result<__AGGREGATE_CLASS_NAME__>>
  delete(id: string): Promise<Result<void>>
}
