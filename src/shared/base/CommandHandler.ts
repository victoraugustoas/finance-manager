import { Result } from './Result';

export abstract class CommandHandler<Command, Return> {
  abstract handle(command: Command): Promise<Result<Return>>;
}
