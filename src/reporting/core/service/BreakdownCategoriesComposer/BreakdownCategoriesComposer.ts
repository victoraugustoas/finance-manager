import { BreakdownCategoriesDTO } from '@/reporting/core/dto/BreakdownCategories.dto';
import { Money } from '@/shared/ValueObjects';

export type CategoryBreakdownRow = {
  name: string;
  total: Money;
};

/**
 * Domain service for C1 breakdown: enforces BR3 (at most six categories; overflow aggregated,
 * then the capped list incl. aggregated row sorted by descending value — BR2).
 */
export class BreakdownCategoriesComposer {
  static readonly othersCategoryLabel = 'Others';

  applySixCategoryCap(sortedDescending: CategoryBreakdownRow[]): BreakdownCategoriesDTO {
    if (sortedDescending.length <= 6) {
      return { categories: sortedDescending };
    }
    const topFive = sortedDescending.slice(0, 5);
    const othersTotal = sortedDescending
      .slice(5)
      .reduce((acc, row) => acc.add(row.total), Money.new(0));

    const othersRow: CategoryBreakdownRow = {
      name: BreakdownCategoriesComposer.othersCategoryLabel,
      total: othersTotal,
    };

    const label = BreakdownCategoriesComposer.othersCategoryLabel;
    const capped = [...topFive, othersRow];
    // Deterministic tie-breaking (stable ordering for the same input set): sort by amount
    // descending; same amount → Others after named categories; still tied → compare by name.
    capped.sort((a, b) => {
      const diff = b.total.amountInCents - a.total.amountInCents;
      if (diff !== 0) {
        return diff;
      }
      if (a.name === label && b.name !== label) {
        return 1;
      }
      if (b.name === label && a.name !== label) {
        return -1;
      }
      return a.name.localeCompare(b.name);
    });

    return { categories: capped };
  }
}
