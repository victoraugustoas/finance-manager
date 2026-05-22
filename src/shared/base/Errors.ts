import { TransactionErrors } from '@/transactions/core/model/Errors';
import { ValueObjectErrors } from '../ValueObjects/Errors';
import { CategoryErrors } from '@/category/core/model/Errors';

enum GeneralErrors {
  PRISMA_INSERT_ERROR = 'PRISMA_INSERT_ERROR',
  PRISMA_QUERY_ERROR = 'PRISMA_QUERY_ERROR',
}

const ValueObjectsErrors = {
  ...ValueObjectErrors,
};

const ContextErrors = {
  ...CategoryErrors,
  ...TransactionErrors,
};

export const Errors = { ...GeneralErrors, ...ValueObjectsErrors, ...ContextErrors };
export type Errors = keyof typeof Errors;
