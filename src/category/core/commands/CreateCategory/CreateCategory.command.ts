import { CategoryProps } from '@/category/core/model/Category';

export type CreateCategoryCommand = Omit<CategoryProps, 'id'>;
