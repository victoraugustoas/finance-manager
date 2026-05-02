import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { MapResultErrorToHttpException } from './MapResultErrorToHttpException';

describe('MapResultErrorToHttpException', () => {
  describe('throwException()', () => {
    it('should not throw when the result is successful', () => {
      const result = Result.ok(undefined);

      expect(() => MapResultErrorToHttpException.throwException(result)).not.toThrow();
    });

    it('should throw InternalServerErrorException for PRISMA_INSERT_ERROR', () => {
      const result = Result.fail({ code: Errors.PRISMA_INSERT_ERROR });

      expect(() => MapResultErrorToHttpException.throwException(result)).toThrow(
        InternalServerErrorException,
      );
    });

    it.each([
      Errors.MONEY_CENTS_NOT_INTEGER,
      Errors.MONEY_NOT_FINITE,
      Errors.CATEGORY_NAME_EMPTY,
      Errors.SUBCATEGORY_NAME_EMPTY,
      Errors.SUBCATEGORY_DUPLICATE_NAME,
      Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE,
      Errors.EFFECTIVATED_DATE_NOT_BE_NULL,
      Errors.TRANSACTION_DUE_DATE_NOT_AFTER_ENTRY_DATE,
      Errors.TRANSACTION_EFFECTIVATED_DATE_NOT_AFTER_ENTRY_DATE,
      Errors.END_DATE_NOT_AFTER_START_DATE,
    ] as const)('should throw BadRequestException for %s', (code) => {
      const result = Result.fail({ code });

      expect(() => MapResultErrorToHttpException.throwException(result)).toThrow(
        BadRequestException,
      );
    });

    it('should not throw when the error code is not mapped', () => {
      const result = Result.fail({ code: 'UNMAPPED_ERROR_CODE' as Errors });

      expect(() => MapResultErrorToHttpException.throwException(result)).not.toThrow();
    });
  });
});
