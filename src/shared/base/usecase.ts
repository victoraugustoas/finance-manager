import {Result} from "@/shared/base/result";

export abstract class UseCase<Params, Return> {
  abstract execute(params: Params): Promise<Result<Return>>;
}
