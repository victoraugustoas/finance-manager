import { Result } from '@/shared/base/result';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

const BAD_REQUEST_CODES = new Set([
  'MONEY_CENTS_NOT_INTEGER',
  'MONEY_NOT_FINITE',
  'CATEGORY_NAME_EMPTY',
  'SUBCATEGORY_NAME_EMPTY',
  'SUBCATEGORY_DUPLICATE_NAME',
  'AMOUNT_NOT_ZERO_OR_NEGATIVE',
  'EFFECTIVATED_DATE_NOT_BE_NULL',
  'TRANSACTION_DUE_DATE_NOT_AFTER_ENTRY_DATE',
  'TRANSACTION_EFFECTIVATED_DATE_NOT_AFTER_ENTRY_DATE',
  'END_DATE_NOT_AFTER_START_DATE',
  'REFERENCE_CATEGORY_WRONG_TYPE',
  'REFERENCE_SUBCATEGORY_NOT_IN_CATEGORY',
]);

const NOT_FOUND_CODES = new Set([
  'CATEGORY_NOT_FOUND',
  'REFERENCE_ACCOUNT_NOT_FOUND',
  'REFERENCE_CATEGORY_NOT_FOUND',
  'REFERENCE_SUBCATEGORY_NOT_FOUND',
  'ENTITY_NOT_FOUND',
]);

const INTERNAL_CODES = new Set(['PRISMA_INSERT_ERROR', 'PRISMA_QUERY_ERROR']);

export class MapResultErrorToHttpException {
  static throwException(error: Result<unknown>): void {
    if (error.isOk) {
      return;
    }

    const [primary] = error.errors;
    if (!primary) {
      return;
    }

    if (INTERNAL_CODES.has(primary)) {
      throw new InternalServerErrorException();
    }
    if (NOT_FOUND_CODES.has(primary)) {
      throw new NotFoundException();
    }
    if (BAD_REQUEST_CODES.has(primary)) {
      throw new BadRequestException();
    }
  }
}
