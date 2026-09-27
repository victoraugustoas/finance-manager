import { CategoryType } from '@/shared/enums/category-type';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { BreakdownCategoriesComposerService, FindBreakdownCategories } from '@/modules/reporting';
import { failingBreakdownCategories, stubBreakdownCategories } from '../mock/reporting-query.mock';

const input = {
  startDate: new Date('2026-01-01T00:00:00.000Z'),
  endDate: new Date('2026-01-31T23:59:59.999Z'),
  effectivated: false,
  type: CategoryType.EXPENSE,
};

describe('FindBreakdownCategories', () => {
  test('should normalize the period before querying', async () => {
    const query = stubBreakdownCategories([]);
    const useCase = new FindBreakdownCategories(query, new BreakdownCategoriesComposerService());

    await useCase.execute(input);

    expect(query.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        effectivated: false,
        type: CategoryType.EXPENSE,
        period: expect.objectContaining({ startDate: expect.any(Date) }),
      }),
    );
  });

  test('should apply the six-category cap', async () => {
    const rows = Array.from({ length: 8 }, (_unused, index) => ({
      name: `C${index}`,
      totalInCents: (8 - index) * 100,
    }));
    const useCase = new FindBreakdownCategories(
      stubBreakdownCategories(rows),
      new BreakdownCategoriesComposerService(),
    );

    const result = await useCase.execute(input);

    expect(result.isOk).toBe(true);
    expect(result.instance.categories).toHaveLength(6);
  });

  test('should fail when the period is inverted', async () => {
    const query = stubBreakdownCategories([]);
    const useCase = new FindBreakdownCategories(query, new BreakdownCategoriesComposerService());

    const result = await useCase.execute({
      ...input,
      startDate: new Date('2026-02-01T00:00:00.000Z'),
      endDate: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(result.errors).toContain('END_DATE_NOT_AFTER_START_DATE');
    expect(query.execute).not.toHaveBeenCalled();
  });

  test('should propagate query failures', async () => {
    const useCase = new FindBreakdownCategories(
      failingBreakdownCategories(RepositoryErrors.READ_FAILED),
      new BreakdownCategoriesComposerService(),
    );

    const result = await useCase.execute(input);

    expect(result.errors).toContain(RepositoryErrors.READ_FAILED);
  });
});
