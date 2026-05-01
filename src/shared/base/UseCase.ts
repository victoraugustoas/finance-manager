import { Result } from '@/shared/base/Result';

export abstract class UseCase<Params, Return> {
  abstract execute(params: Params): Promise<Result<Return>>;
}
