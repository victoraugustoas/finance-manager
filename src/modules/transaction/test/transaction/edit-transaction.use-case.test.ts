import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { TransactionType } from '@/shared/enums/transaction-type';
import { EditTransaction, Expense, Transaction } from '@/modules/transaction';
import { InMemoryTransactionRepository } from '../mock/in-memory-transaction.repository';
import {
  acceptingAccountReference,
  acceptingCategoryHierarchy,
} from '../mock/reference-query.mock';

const expenseProps = {
  name: 'Groceries',
  amount: 4990,
  categoryId: '11111111-1111-1111-1111-111111111111',
  subCategoryId: '22222222-2222-2222-2222-222222222222',
  accountId: '33333333-3333-3333-3333-333333333333',
  dueDate: new Date('2026-01-15T12:00:00.000Z'),
  entryDate: new Date('2026-01-10T12:00:00.000Z'),
  effectivated: false,
};

const editInput = {
  type: TransactionType.EXPENSE,
  name: 'Supermarket',
  amount: 99.9,
  dueDate: expenseProps.dueDate,
  entryDate: expenseProps.entryDate,
  effectivated: false,
  accountId: expenseProps.accountId,
  categoryId: expenseProps.categoryId,
  subCategoryId: expenseProps.subCategoryId,
};

describe('EditTransaction', () => {
  const makeUseCase = (repository: InMemoryTransactionRepository) =>
    new EditTransaction(repository, acceptingAccountReference(), acceptingCategoryHierarchy());

  test('should persist the edited expense', async () => {
    const repository = new InMemoryTransactionRepository();
    const expense = Expense.create(expenseProps);
    await repository.create(expense);

    const result = await makeUseCase(repository).execute({ ...editInput, id: expense.id });

    expect(result.isOk).toBe(true);
    const persisted = await repository.findExpenseById(expense.id);
    expect(persisted.instance.name).toBe('Supermarket');
    expect(persisted.instance.amount.amountInCents).toBe(9990);
  });

  test('should fail when the transaction does not exist', async () => {
    const repository = new InMemoryTransactionRepository();

    const result = await makeUseCase(repository).execute({
      ...editInput,
      id: '44444444-4444-4444-4444-444444444444',
    });

    expect(result.errors).toContain(RepositoryErrors.ENTITY_NOT_FOUND);
  });

  test('should reject an edit that breaks an invariant', async () => {
    const repository = new InMemoryTransactionRepository();
    const expense = Expense.create(expenseProps);
    await repository.create(expense);

    const result = await makeUseCase(repository).execute({
      ...editInput,
      id: expense.id,
      dueDate: new Date('2026-01-01T12:00:00.000Z'),
    });

    expect(result.errors).toContain(Transaction.DUE_DATE_BEFORE_ENTRY_DATE);
  });

  test('should not find an expense when asked for an income', async () => {
    const repository = new InMemoryTransactionRepository();
    const expense = Expense.create(expenseProps);
    await repository.create(expense);

    const result = await makeUseCase(repository).execute({
      ...editInput,
      id: expense.id,
      type: TransactionType.INCOME,
    });

    expect(result.errors).toContain(RepositoryErrors.ENTITY_NOT_FOUND);
  });
});
