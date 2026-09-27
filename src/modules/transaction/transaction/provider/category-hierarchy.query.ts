import { Result } from '@/shared/base/result';
import { CategoryType } from '@/shared/enums/category-type';

export const CategoryHierarchyErrors = {
  CATEGORY_NOT_FOUND: 'REFERENCE_CATEGORY_NOT_FOUND',
  CATEGORY_WRONG_TYPE: 'REFERENCE_CATEGORY_WRONG_TYPE',
  SUBCATEGORY_NOT_FOUND: 'REFERENCE_SUBCATEGORY_NOT_FOUND',
  SUBCATEGORY_NOT_IN_CATEGORY: 'REFERENCE_SUBCATEGORY_NOT_IN_CATEGORY',
} as const;

export interface CategoryHierarchyQueryInput {
  categoryId: string;
  subCategoryId: string;
  /** Expected category type for the movement being registered or edited. */
  type: CategoryType;
}

/**
 * Cross-context check (ACL) that the category exists, matches the expected type and owns the
 * subcategory. Returns an empty success; otherwise fails with one of `CategoryHierarchyErrors`.
 */
export interface CategoryHierarchyQuery {
  execute(input: CategoryHierarchyQueryInput): Promise<Result<void>>;
}
