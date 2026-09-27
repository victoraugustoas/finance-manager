import { AccountReferenceErrors, RegisterTransfer, Transfer } from '@/modules/transaction';
import { InMemoryTransferRepository } from '../mock/in-memory-transfer.repository';
import { acceptingAccountReference, rejectingAccountReference } from '../mock/reference-query.mock';

const input = {
  name: 'Savings transfer',
  amount: 150,
  dueDate: new Date('2026-01-15T12:00:00.000Z'),
  entryDate: new Date('2026-01-10T12:00:00.000Z'),
  effectivated: false,
  accountIdOrigin: '11111111-1111-1111-1111-111111111111',
  accountIdDestination: '22222222-2222-2222-2222-222222222222',
};

describe('RegisterTransfer', () => {
  test('should persist the transfer in cents and check both accounts', async () => {
    const repository = new InMemoryTransferRepository();
    const accountReference = acceptingAccountReference();
    const useCase = new RegisterTransfer(repository, accountReference);

    const result = await useCase.execute(input);

    expect(result.isOk).toBe(true);
    expect(accountReference.execute).toHaveBeenCalledTimes(2);
    const [persisted] = [...repository.items.values()];
    expect(persisted.amount.amountInCents).toBe(15000);
  });

  test('should fail when an account does not exist', async () => {
    const repository = new InMemoryTransferRepository();
    const useCase = new RegisterTransfer(
      repository,
      rejectingAccountReference(AccountReferenceErrors.ACCOUNT_NOT_FOUND),
    );

    const result = await useCase.execute(input);

    expect(result.errors).toContain(AccountReferenceErrors.ACCOUNT_NOT_FOUND);
    expect(repository.items.size).toBe(0);
  });

  test('should fail on domain invariants without persisting', async () => {
    const repository = new InMemoryTransferRepository();
    const useCase = new RegisterTransfer(repository, acceptingAccountReference());

    const result = await useCase.execute({ ...input, amount: 0 });

    expect(result.errors).toContain(Transfer.AMOUNT_NOT_POSITIVE);
    expect(repository.items.size).toBe(0);
  });
});
