import { Result } from '@/shared/base';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

export class MapResultErrorToHttpException {
  static throwException(error: Result<any>): void {
    if (error.isSuccess) {
      return;
    }

    if (error.errors.length === 0) {
      return;
    }
    const [primary] = error.errors;

    switch (primary.code) {
      case 'PRISMA_INSERT_ERROR':
      case 'PRISMA_QUERY_ERROR':
        throw new InternalServerErrorException();
      case 'MONEY_CENTS_NOT_INTEGER':
      case 'MONEY_NOT_FINITE':
      case 'CATEGORY_NAME_EMPTY':
      case 'SUBCATEGORY_NAME_EMPTY':
      case 'SUBCATEGORY_DUPLICATE_NAME':
      case 'AMOUNT_NOT_ZERO_OR_NEGATIVE':
      case 'EFFECTIVATED_DATE_NOT_BE_NULL':
      case 'TRANSACTION_DUE_DATE_NOT_AFTER_ENTRY_DATE':
      case 'TRANSACTION_EFFECTIVATED_DATE_NOT_AFTER_ENTRY_DATE':
      case 'END_DATE_NOT_AFTER_START_DATE':
      case 'REFERENCE_CATEGORY_WRONG_TYPE':
      case 'REFERENCE_SUBCATEGORY_NOT_IN_CATEGORY':
        throw new BadRequestException();
      case 'CATEGORY_NOT_FOUND':
      case 'REFERENCE_CATEGORY_NOT_FOUND':
      case 'REFERENCE_SUBCATEGORY_NOT_FOUND':
        throw new NotFoundException();
    }
  }
}
