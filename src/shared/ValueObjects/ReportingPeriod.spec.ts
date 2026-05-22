import { ReportingPeriod } from '@/shared/ValueObjects/ReportingPeriod';
import { Errors } from '@/shared/base/Errors';

describe('ReportingPeriod', () => {
  describe('create()', () => {
    it('should succeed when end is strictly after start', () => {
      const startDate = new Date(2024, 5, 1);
      const endDate = new Date(2024, 5, 30);
      const result = ReportingPeriod.create({ startDate, endDate });

      expect(result.isSuccess).toBe(true);
      const other = ReportingPeriod.create({
        startDate: new Date(2024, 5, 1),
        endDate: new Date(2024, 5, 30),
      });
      expect(result.value.equals(other.value)).toBe(true);
    });

    it('should succeed when start and end are the same instant', () => {
      const startDate = new Date(2024, 3, 15, 12, 0, 0);
      const result = ReportingPeriod.create({ startDate, endDate: startDate });

      expect(result.isSuccess).toBe(true);
    });

    it('should succeed when start and end fall on the same calendar day', () => {
      const startDate = new Date(2024, 8, 10, 8, 0, 0);
      const endDate = new Date(2024, 8, 10, 22, 0, 0);
      const result = ReportingPeriod.create({ startDate, endDate });

      expect(result.isSuccess).toBe(true);
    });

    it('should succeed when end is earlier than start on the clock but still the same calendar day', () => {
      const startDate = new Date(2024, 8, 10, 22, 0, 0);
      const endDate = new Date(2024, 8, 10, 8, 0, 0);
      const result = ReportingPeriod.create({ startDate, endDate });

      expect(result.isSuccess).toBe(true);
    });

    it('should fail when end is before start on a different calendar day', () => {
      const startDate = new Date(2024, 2, 10);
      const endDate = new Date(2024, 2, 9);
      const result = ReportingPeriod.create({ startDate, endDate });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.END_DATE_NOT_AFTER_START_DATE);
    });
  });
});
