import { Errors } from './Errors';
import { Check } from './Check';

const err = { code: Errors.MONEY_NOT_FINITE };

describe('Check', () => {
  describe('gt()', () => {
    it('should succeed when value is greater than min', () => {
      expect(Check.gt(5, 0, err).isSuccess).toBe(true);
    });

    it('should fail when value equals min', () => {
      const result = Check.gt(0, 0, err);
      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(err.code);
    });

    it('should fail when value is less than min', () => {
      expect(Check.gt(-1, 0, err).isFailure).toBe(true);
    });
  });

  describe('gte()', () => {
    it('should succeed when value equals min', () => {
      expect(Check.gte(0, 0, err).isSuccess).toBe(true);
    });

    it('should succeed when value is greater than min', () => {
      expect(Check.gte(1, 0, err).isSuccess).toBe(true);
    });

    it('should fail when value is less than min', () => {
      expect(Check.gte(-1, 0, err).isFailure).toBe(true);
    });
  });

  describe('lt()', () => {
    it('should succeed when value is less than max', () => {
      expect(Check.lt(5, 10, err).isSuccess).toBe(true);
    });

    it('should fail when value equals max', () => {
      expect(Check.lt(10, 10, err).isFailure).toBe(true);
    });

    it('should fail when value is greater than max', () => {
      expect(Check.lt(11, 10, err).isFailure).toBe(true);
    });
  });

  describe('lte()', () => {
    it('should succeed when value equals max', () => {
      expect(Check.lte(10, 10, err).isSuccess).toBe(true);
    });

    it('should succeed when value is less than max', () => {
      expect(Check.lte(9, 10, err).isSuccess).toBe(true);
    });

    it('should fail when value is greater than max', () => {
      expect(Check.lte(11, 10, err).isFailure).toBe(true);
    });
  });

  describe('notEmpty()', () => {
    it('should succeed for a non-empty string', () => {
      expect(Check.notEmpty('hello', err).isSuccess).toBe(true);
    });

    it('should fail for an empty string', () => {
      expect(Check.notEmpty('', err).isFailure).toBe(true);
    });

    it('should fail for a whitespace-only string', () => {
      expect(Check.notEmpty('   ', err).isFailure).toBe(true);
    });
  });

  describe('notNull()', () => {
    it('should succeed for a defined value', () => {
      expect(Check.notNull('value', err).isSuccess).toBe(true);
    });

    it('should succeed for zero', () => {
      expect(Check.notNull(0, err).isSuccess).toBe(true);
    });

    it('should fail for null', () => {
      expect(Check.notNull(null, err).isFailure).toBe(true);
    });

    it('should fail for undefined', () => {
      expect(Check.notNull(undefined, err).isFailure).toBe(true);
    });
  });

  describe('isTrue()', () => {
    it('should succeed when condition is true', () => {
      expect(Check.isTrue(true, err).isSuccess).toBe(true);
    });

    it('should fail when condition is false', () => {
      const result = Check.isTrue(false, err);
      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(err.code);
    });
  });
});
