import { TransactionErrors } from "@/transactions/core/model/Errors";
import { MoneyValueObjectErrors } from "../ValueObjects/Errors";
import { CategoryErrors } from "@/category/core/model/Errors";


const ValueObjectsErrors = {
  ...MoneyValueObjectErrors,
}

const ContextErrors = {
  ...CategoryErrors,
  ...TransactionErrors,
}

export const Errors = { ...ValueObjectsErrors, ...ContextErrors }
export type Errors = keyof typeof Errors;