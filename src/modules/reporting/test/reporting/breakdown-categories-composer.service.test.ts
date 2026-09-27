import { BreakdownCategoriesComposerService } from '@/modules/reporting';

const row = (name: string, totalInCents: number) => ({ name, totalInCents });

describe('BreakdownCategoriesComposerService', () => {
  const composer = new BreakdownCategoriesComposerService();

  test('should keep up to six categories untouched', () => {
    const rows = [
      row('A', 600),
      row('B', 500),
      row('C', 400),
      row('D', 300),
      row('E', 200),
      row('F', 100),
    ];

    expect(composer.applySixCategoryCap(rows).categories).toEqual(rows);
  });

  test('should aggregate everything past the top five into Others', () => {
    const rows = [
      row('A', 1000),
      row('B', 900),
      row('C', 800),
      row('D', 700),
      row('E', 600),
      row('F', 500),
      row('G', 400),
    ];

    const { categories } = composer.applySixCategoryCap(rows);

    expect(categories).toHaveLength(6);
    expect(categories.map((category) => category.name)).toEqual([
      'A',
      'B',
      'Others',
      'C',
      'D',
      'E',
    ]);
    expect(categories.find((category) => category.name === 'Others')?.totalInCents).toBe(900);
  });

  test('should place Others after named categories on a tie', () => {
    const rows = [
      row('A', 1000),
      row('B', 900),
      row('C', 800),
      row('D', 700),
      row('E', 600),
      row('F', 300),
      row('G', 300),
    ];

    const names = composer.applySixCategoryCap(rows).categories.map((category) => category.name);

    expect(names).toEqual(['A', 'B', 'C', 'D', 'E', 'Others']);
  });
});
