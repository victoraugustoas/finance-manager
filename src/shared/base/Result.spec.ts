import { Errors } from './Errors';
import { Result } from './Result';

const errA = { code: Errors.MONEY_NOT_FINITE };
const errB = { code: Errors.MONEY_CENTS_NOT_INTEGER };

describe('Result', () => {
  describe('combine()', () => {
    it('should succeed when all results succeed', () => {
      const result = Result.combine([Result.ok(), Result.ok(), Result.ok()]);

      expect(result.isSuccess).toBe(true);
    });

    it('should succeed for an empty array', () => {
      expect(Result.combine([]).isSuccess).toBe(true);
    });

    it('should fail on the first failed result', () => {
      const result = Result.combine([Result.ok(), Result.fail(errA), Result.fail(errB)]);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(errA.code);
    });

    it('should return only the first error when multiple results fail', () => {
      const result = Result.combine([Result.fail(errA), Result.fail(errB)]);

      expect(result.isFailure).toBe(true);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(errA.code);
    });
  });
});
