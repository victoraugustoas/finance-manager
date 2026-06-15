import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { TransactionAccountReader } from '@/transactions/core/ports/acl/TransactionAccount.reader';
import { TransactionsRepository } from '@/transactions/core/ports/repositories/Transactions.repository';
import { RegisterTransferHandler } from './RegisterTransfer.handler';

describe('RegisterTransferHandler', () => {
  const entryDate = new Date('2026-01-10T12:00:00.000Z');
  const dueDate = new Date('2026-01-15T12:00:00.000Z');

  const baseParams = {
    name: 'Transfer to savings',
    amount: 500,
    dueDate,
    entryDate,
    effectivated: false,
    accountIdOrigin: 'acc-origin',
    accountIdDestination: 'acc-destination',
  };

  const makeTransactionAccountReader = () =>
    ({
      existsById: jest.fn().mockResolvedValue(Result.ok(undefined)),
    }) as unknown as TransactionAccountReader;

  const makeRepo = () =>
    ({
      saveTransfer: jest.fn().mockResolvedValue(Result.ok(undefined)),
    }) as unknown as TransactionsRepository;

  it('should save the transfer and return success when all validations pass', async () => {
    const repo = makeRepo();
    const useCase = new RegisterTransferHandler(repo, makeTransactionAccountReader());

    const result = await useCase.handle(baseParams);

    expect(result.isSuccess).toBe(true);
    expect(repo.saveTransfer).toHaveBeenCalledTimes(1);
  });

  it('should call existsById for both origin and destination account ids', async () => {
    const accounts = makeTransactionAccountReader();
    const useCase = new RegisterTransferHandler(makeRepo(), accounts);

    await useCase.handle(baseParams);

    expect(accounts.existsById).toHaveBeenCalledWith('acc-origin');
    expect(accounts.existsById).toHaveBeenCalledWith('acc-destination');
  });

  it('should fail and not save when amount is zero', async () => {
    const repo = { saveTransfer: jest.fn() } as unknown as TransactionsRepository;
    const useCase = new RegisterTransferHandler(repo, makeTransactionAccountReader());

    const result = await useCase.handle({ ...baseParams, amount: 0 });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
    expect(repo.saveTransfer).not.toHaveBeenCalled();
  });

  it('should fail and not save when amount is negative', async () => {
    const repo = { saveTransfer: jest.fn() } as unknown as TransactionsRepository;
    const useCase = new RegisterTransferHandler(repo, makeTransactionAccountReader());

    const result = await useCase.handle({ ...baseParams, amount: -100 });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
    expect(repo.saveTransfer).not.toHaveBeenCalled();
  });

  it('should fail and not save when dueDate is before entryDate', async () => {
    const repo = { saveTransfer: jest.fn() } as unknown as TransactionsRepository;
    const useCase = new RegisterTransferHandler(repo, makeTransactionAccountReader());

    const result = await useCase.handle({
      ...baseParams,
      entryDate: new Date('2026-01-10T12:00:00.000Z'),
      dueDate: new Date('2026-01-05T12:00:00.000Z'),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.TRANSACTION_DUE_DATE_NOT_AFTER_ENTRY_DATE);
    expect(repo.saveTransfer).not.toHaveBeenCalled();
  });

  it('should fail and not save when effectivated is true but effectivatedDate is missing', async () => {
    const repo = { saveTransfer: jest.fn() } as unknown as TransactionsRepository;
    const useCase = new RegisterTransferHandler(repo, makeTransactionAccountReader());

    const result = await useCase.handle({
      ...baseParams,
      effectivated: true,
      effectivatedDate: undefined,
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.EFFECTIVATED_DATE_NOT_BE_NULL);
    expect(repo.saveTransfer).not.toHaveBeenCalled();
  });

  it('should fail and not save when effectivatedDate is before entryDate', async () => {
    const repo = { saveTransfer: jest.fn() } as unknown as TransactionsRepository;
    const useCase = new RegisterTransferHandler(repo, makeTransactionAccountReader());

    const result = await useCase.handle({
      ...baseParams,
      effectivated: true,
      effectivatedDate: new Date('2026-01-05T12:00:00.000Z'),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.TRANSACTION_EFFECTIVATED_DATE_NOT_AFTER_ENTRY_DATE);
    expect(repo.saveTransfer).not.toHaveBeenCalled();
  });

  it('should fail and not save when accountIdOrigin is empty', async () => {
    const repo = { saveTransfer: jest.fn() } as unknown as TransactionsRepository;
    const useCase = new RegisterTransferHandler(repo, makeTransactionAccountReader());

    const result = await useCase.handle({ ...baseParams, accountIdOrigin: '' });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.TRANSFER_ACCOUNT_ORIGIN_REQUIRED);
    expect(repo.saveTransfer).not.toHaveBeenCalled();
  });

  it('should fail and not save when accountIdDestination is empty', async () => {
    const repo = { saveTransfer: jest.fn() } as unknown as TransactionsRepository;
    const useCase = new RegisterTransferHandler(repo, makeTransactionAccountReader());

    const result = await useCase.handle({ ...baseParams, accountIdDestination: '' });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.TRANSFER_ACCOUNT_DESTINATION_REQUIRED);
    expect(repo.saveTransfer).not.toHaveBeenCalled();
  });

  it('should fail and not save when origin account does not exist', async () => {
    const repo = { saveTransfer: jest.fn() } as unknown as TransactionsRepository;
    const accounts = {
      existsById: jest
        .fn()
        .mockResolvedValueOnce(
          Result.fail({ code: Errors.REFERENCE_ACCOUNT_NOT_FOUND, cls: 'test' }),
        )
        .mockResolvedValueOnce(Result.ok(undefined)),
    } as unknown as TransactionAccountReader;
    const useCase = new RegisterTransferHandler(repo, accounts);

    const result = await useCase.handle(baseParams);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.REFERENCE_ACCOUNT_NOT_FOUND);
    expect(repo.saveTransfer).not.toHaveBeenCalled();
  });

  it('should fail and not save when destination account does not exist', async () => {
    const repo = { saveTransfer: jest.fn() } as unknown as TransactionsRepository;
    const accounts = {
      existsById: jest
        .fn()
        .mockResolvedValueOnce(Result.ok(undefined))
        .mockResolvedValueOnce(
          Result.fail({ code: Errors.REFERENCE_ACCOUNT_NOT_FOUND, cls: 'test' }),
        ),
    } as unknown as TransactionAccountReader;
    const useCase = new RegisterTransferHandler(repo, accounts);

    const result = await useCase.handle(baseParams);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.REFERENCE_ACCOUNT_NOT_FOUND);
    expect(repo.saveTransfer).not.toHaveBeenCalled();
  });

  it('should propagate save failure', async () => {
    const repo = {
      saveTransfer: jest
        .fn()
        .mockResolvedValue(Result.fail({ code: Errors.PRISMA_INSERT_ERROR, cls: 'test' })),
    } as unknown as TransactionsRepository;
    const useCase = new RegisterTransferHandler(repo, makeTransactionAccountReader());

    const result = await useCase.handle(baseParams);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
  });
});
