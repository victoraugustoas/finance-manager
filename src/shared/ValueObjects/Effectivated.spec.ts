import { Errors } from '@/shared/base/Errors';
import { Effectivated } from './Effectivated';

const date = new Date('2026-01-15T12:00:00.000Z');

describe('Effectivated', () => {
  describe('create()', () => {
    describe('when effectivated is false', () => {
      it('should succeed without a date', () => {
        const result = Effectivated.create({ effectivated: false });

        expect(result.isSuccess).toBe(true);
        expect(result.value.effectivated).toBe(false);
        expect(result.value.effectivatedDate).toBeUndefined();
      });

      it('should succeed even when a date is provided', () => {
        const result = Effectivated.create({ effectivated: false, effectivatedDate: date });

        expect(result.isSuccess).toBe(true);
        expect(result.value.effectivated).toBe(false);
        expect(result.value.effectivatedDate).toBe(date);
      });
    });

    describe('when effectivated is true', () => {
      it('should succeed when a date is provided', () => {
        const result = Effectivated.create({ effectivated: true, effectivatedDate: date });

        expect(result.isSuccess).toBe(true);
        expect(result.value.effectivated).toBe(true);
        expect(result.value.effectivatedDate).toBe(date);
      });

      it('should fail when no date is provided', () => {
        const result = Effectivated.create({ effectivated: true });

        expect(result.isFailure).toBe(true);
        expect(result.errors[0].code).toBe(Errors.EFFECTIVATED_DATE_NOT_BE_NULL);
      });
    });
  });

  describe('new()', () => {
    it('should create without validation even when effectivated is true and date is missing', () => {
      const instance = Effectivated.new({ effectivated: true });

      expect(instance.effectivated).toBe(true);
      expect(instance.effectivatedDate).toBeUndefined();
    });
  });

  describe('equals()', () => {
    it('should return true for two non-effectivated instances without date', () => {
      const a = Effectivated.create({ effectivated: false }).value;
      const b = Effectivated.create({ effectivated: false }).value;

      expect(a.equals(b)).toBe(true);
    });

    it('should return true for two effectivated instances with the same date', () => {
      const a = Effectivated.create({ effectivated: true, effectivatedDate: date }).value;
      const b = Effectivated.create({ effectivated: true, effectivatedDate: date }).value;

      expect(a.equals(b)).toBe(true);
    });

    it('should return false when effectivated differs', () => {
      const a = Effectivated.create({ effectivated: false }).value;
      const b = Effectivated.create({ effectivated: true, effectivatedDate: date }).value;

      expect(a.equals(b)).toBe(false);
    });

    it('should return false when dates differ', () => {
      const a = Effectivated.create({
        effectivated: true,
        effectivatedDate: new Date('2026-01-10T00:00:00.000Z'),
      }).value;
      const b = Effectivated.create({ effectivated: true, effectivatedDate: date }).value;

      expect(a.equals(b)).toBe(false);
    });
  });
});
