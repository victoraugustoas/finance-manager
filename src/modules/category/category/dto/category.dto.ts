import { CategoryType } from '@/shared/enums/category-type';

/** Input of the create-category write operation. */
export interface CreateCategoryInDTO {
  name: string;
  type: CategoryType;
}

/** Input of the create-subcategory write operation. */
export interface CreateSubCategoryInDTO {
  categoryId: string;
  name: string;
}

export interface SubCategoryOutDTO {
  id: string;
  name: string;
}

/** Projection of a category with its subcategories for API consumers. */
export interface CategoryOutDTO {
  id: string;
  name: string;
  type: CategoryType;
  subCategories: SubCategoryOutDTO[];
}
