import { BreakdownCategoriesComposer } from '@/reporting/core/service/BreakdownCategoriesComposer';
import { Money } from '@/shared/ValueObjects';

describe('BreakdownCategoriesComposer', () => {
  const composer = new BreakdownCategoriesComposer();

  it('should return all rows when there are at most six categories', () => {
    const rows = [
      { name: 'A', total: Money.new(100) },
      { name: 'B', total: Money.new(80) },
    ];
    const out = composer.applySixCategoryCap(rows);
    expect(out.categories.map((c) => ({ name: c.name, total: c.total.amount }))).toEqual([
      { name: 'A', total: 100 },
      { name: 'B', total: 80 },
    ]);
  });

  it('should cap then sort including the aggregated others row by descending value', () => {
    const rows = [
      { name: 'a', total: Money.new(100) },
      { name: 'b', total: Money.new(90) },
      { name: 'c', total: Money.new(80) },
      { name: 'd', total: Money.new(70) },
      { name: 'e', total: Money.new(60) },
      { name: 'f', total: Money.new(50) },
      { name: 'g', total: Money.new(40) },
    ];
    const result = composer.applySixCategoryCap(rows);
    expect(result.categories).toHaveLength(6);

    expect(result.categories.map((c) => ({ name: c.name, total: c.total.amount }))).toEqual([
      { name: 'a', total: 100 },
      { name: 'b', total: 90 },
      { name: BreakdownCategoriesComposer.othersCategoryLabel, total: 90 },
      { name: 'c', total: 80 },
      { name: 'd', total: 70 },
      { name: 'e', total: 60 },
    ]);
  });
});
