import { Result } from '@/shared/base/result';
import { UseCase } from '@/shared/base/UseCase';
import { Money } from '@/shared/ValueObjects/money.vo';
import { RegisterTransferInDTO } from '../dto';
import { Transfer } from '../model';
import { AccountReferenceQuery, TransferRepository } from '../provider';

export class RegisterTransfer implements UseCase<RegisterTransferInDTO, void> {
  constructor(
    private readonly transferRepository: TransferRepository,
    private readonly accountReference: AccountReferenceQuery,
  ) {}

  async execute(input: RegisterTransferInDTO): Promise<Result<void>> {
    const amount = Money.tryCreate(input.amount);
    if (amount.isFailure) {
      return amount.withFail;
    }

    const transfer = Transfer.register({
      name: input.name,
      amount: amount.instance.amountInCents,
      notes: input.notes,
      dueDate: input.dueDate,
      entryDate: input.entryDate,
      effectivated: input.effectivated,
      effectivatedDate: input.effectivatedDate,
      accountIdOrigin: input.accountIdOrigin,
      accountIdDestination: input.accountIdDestination,
    });

    const references = Result.combine([
      ...(await Promise.all([
        this.accountReference.execute({ accountId: input.accountIdOrigin }),
        this.accountReference.execute({ accountId: input.accountIdDestination }),
      ])),
      transfer,
    ]);
    if (references.isFailure) {
      return references.withFail;
    }

    const persisted = await this.transferRepository.create(transfer.instance);
    if (persisted.isFailure) {
      return persisted.withFail;
    }

    return Result.ok();
  }
}
