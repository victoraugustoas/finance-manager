import { BreakdownCategoriesOutDTO, CategoryBreakdownRowOutDTO } from '../dto';

/**
 * Pure composition for the categories breakdown: enforces BR3 (at most six rows; the overflow is
 * aggregated into `Others`) and BR2 (capped list sorted by descending total).
 */
export class BreakdownCategoriesComposerService {
  static readonly othersCategoryLabel = 'Others';

  applySixCategoryCap(sortedDescending: CategoryBreakdownRowOutDTO[]): BreakdownCategoriesOutDTO {
    if (sortedDescending.length <= 6) {
      return { categories: sortedDescending };
    }

    const label = BreakdownCategoriesComposerService.othersCategoryLabel;
    const topFive = sortedDescending.slice(0, 5);
    const othersRow: CategoryBreakdownRowOutDTO = {
      name: label,
      totalInCents: sortedDescending.slice(5).reduce((total, row) => total + row.totalInCents, 0),
    };

    const capped = [...topFive, othersRow];
    // Deterministic tie-breaking (stable ordering for the same input set): sort by amount
    // descending; same amount → Others after named categories; still tied → compare by name.
    capped.sort((left, right) => {
      const diff = right.totalInCents - left.totalInCents;
      if (diff !== 0) {
        return diff;
      }
      if (left.name === label && right.name !== label) {
        return 1;
      }
      if (right.name === label && left.name !== label) {
        return -1;
      }
      return left.name.localeCompare(right.name);
    });

    return { categories: capped };
  }
}
