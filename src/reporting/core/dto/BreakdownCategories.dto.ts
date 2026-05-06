import { Money } from '@/shared/ValueObjects';

export interface BreakdownCategoriesDTO {
  categories: Array<{
    name: string;
    total: Money;
  }>;
}
