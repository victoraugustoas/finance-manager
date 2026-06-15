import { Result } from './Result';

export abstract class QueryHandler<Query, Return> {
  abstract handle(query: Query): Promise<Result<Return>>;
}
