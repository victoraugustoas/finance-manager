import { TransactionErrors } from '@/transactions/core/model/Errors';
import { MoneyValueObjectErrors } from '../ValueObjects/Errors';
import { CategoryErrors } from '@/category/core/model/Errors';
import { ReportingErrors } from '@/reporting/core/model/Errors';

const ValueObjectsErrors = {
  ...MoneyValueObjectErrors,
};

const ContextErrors = {
  ...CategoryErrors,
  ...TransactionErrors,
  ...ReportingErrors,
};

export const Errors = { ...ValueObjectsErrors, ...ContextErrors };
export type Errors = keyof typeof Errors;
