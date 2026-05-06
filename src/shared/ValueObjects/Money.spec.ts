import { Errors } from '../base/Errors';
import { Money } from './Money';

describe('Money', () => {
  describe('create()', () => {
    it('should create with a valid decimal amount', () => {
      const result = Money.create(25.23);

      expect(result.isSuccess).toBe(true);
      expect(result.value.amountInCents).toBe(2523);
      expect(result.value.amount).toBe(25.23);
    });

    it('should round correctly when more than two decimal places', () => {
      const result = Money.create(25.235);

      expect(result.isSuccess).toBe(true);
      expect(result.value.amountInCents).toBe(2524);
    });

    it('should fail with Infinity', () => {
      const result = Money.create(Infinity);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.MONEY_NOT_FINITE);
    });

    it('should fail with NaN', () => {
      const result = Money.create(NaN);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.MONEY_NOT_FINITE);
    });
  });

  describe('fromCents()', () => {
    it('should create from integer cents', () => {
      const result = Money.fromCents(2523);

      expect(result.isSuccess).toBe(true);
      expect(result.value.amountInCents).toBe(2523);
      expect(result.value.amount).toBe(25.23);
    });

    it('should fail with a non-integer value', () => {
      const result = Money.fromCents(25.23);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.MONEY_CENTS_NOT_INTEGER);
    });
  });

  describe('add()', () => {
    it('should add two amounts correctly', () => {
      const a = Money.create(10.0).value;
      const b = Money.create(5.5).value;

      const result = a.add(b);

      expect(result.amountInCents).toBe(1550);
      expect(result.amount).toBe(15.5);
    });

    it('should accumulate repeated additions without precision loss', () => {
      const a = Money.create(0.1).value;
      const b = Money.create(0.2).value;

      const result = a.add(b);

      expect(result.amountInCents).toBe(30);
      expect(result.amount).toBe(0.3);
    });
  });

  describe('subtract()', () => {
    it('should subtract two amounts correctly', () => {
      const a = Money.create(20.0).value;
      const b = Money.create(5.5).value;

      const result = a.subtract(b);

      expect(result.isSuccess).toBe(true);
      expect(result.value.amountInCents).toBe(1450);
      expect(result.value.amount).toBe(14.5);
    });

    it('should return zero when subtracting equal amounts', () => {
      const a = Money.create(10.0).value;
      const b = Money.create(10.0).value;

      const result = a.subtract(b);

      expect(result.isSuccess).toBe(true);
      expect(result.value.amountInCents).toBe(0);
    });

    it('should return a negative amount when subtracting a larger amount', () => {
      const a = Money.create(5.0).value;
      const b = Money.create(10.0).value;

      const result = a.subtract(b);

      expect(result.isSuccess).toBe(true);
      expect(result.value.amountInCents).toBe(-500);
    });
  });

  describe('isGreaterThan()', () => {
    it('should return true when greater than', () => {
      const a = Money.create(10.0).value;
      const b = Money.create(5.0).value;

      expect(a.isGreaterThan(b)).toBe(true);
    });

    it('should return false when less than', () => {
      const a = Money.create(5.0).value;
      const b = Money.create(10.0).value;

      expect(a.isGreaterThan(b)).toBe(false);
    });

    it('should return false when equal', () => {
      const a = Money.create(10.0).value;
      const b = Money.create(10.0).value;

      expect(a.isGreaterThan(b)).toBe(false);
    });
  });

  describe('isLessThan()', () => {
    it('should return true when less than', () => {
      const a = Money.create(5.0).value;
      const b = Money.create(10.0).value;

      expect(a.isLessThan(b)).toBe(true);
    });

    it('should return false when greater than', () => {
      const a = Money.create(10.0).value;
      const b = Money.create(5.0).value;

      expect(a.isLessThan(b)).toBe(false);
    });

    it('should return false when equal', () => {
      const a = Money.create(10.0).value;
      const b = Money.create(10.0).value;

      expect(a.isLessThan(b)).toBe(false);
    });
  });

  describe('equals()', () => {
    it('should return true for equal amounts', () => {
      const a = Money.create(25.23).value;
      const b = Money.create(25.23).value;

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different amounts', () => {
      const a = Money.create(25.23).value;
      const b = Money.create(10.0).value;

      expect(a.equals(b)).toBe(false);
    });
  });
});
