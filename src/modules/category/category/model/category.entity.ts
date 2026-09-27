import { Entity, EntityProps } from '@/shared/base/entity';
import { Result } from '@/shared/base/result';
import { CategoryType } from '@/shared/enums/category-type';
import { SubCategory, SubCategoryProps } from './sub-category.entity';

export const DEFAULT_SUBCATEGORY_NAME = 'Others' as const;

export interface CategoryProps extends EntityProps {
  name: string;
  type: CategoryType;
  /** Omitting the list on creation seeds the default subcategory. */
  subCategories?: SubCategoryProps[];
}

export class Category extends Entity<Category, CategoryProps> {
  static readonly NAME_EMPTY = 'CATEGORY_NAME_EMPTY';
  static readonly NOT_FOUND = 'CATEGORY_NOT_FOUND';
  static readonly SUBCATEGORY_DUPLICATE_NAME = 'SUBCATEGORY_DUPLICATE_NAME';

  private constructor(props: CategoryProps) {
    super(props);
  }

  get name(): string {
    return this.props.name;
  }

  get type(): CategoryType {
    return this.props.type;
  }

  get subCategories(): ReadonlyArray<SubCategory> {
    return (this.props.subCategories ?? []).map((props) => SubCategory.create(props));
  }

  static create(props: CategoryProps): Category {
    const result = Category.tryCreate(props);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  static tryCreate(props: CategoryProps): Result<Category> {
    const name = props.name?.trim();
    if (!name) {
      return Result.fail(Category.NAME_EMPTY);
    }

    const rawSubCategories = props.subCategories ?? [{ name: DEFAULT_SUBCATEGORY_NAME }];
    const subCategories = Result.combine(
      rawSubCategories.map((subCategory) => SubCategory.tryCreate(subCategory)),
    );
    if (subCategories.isFailure) {
      return subCategories.withFail;
    }

    return Result.ok(
      new Category({
        ...props,
        name,
        subCategories: subCategories.instance.map((subCategory) => ({ ...subCategory.props })),
      }),
    );
  }

  /** Adds a subcategory in place, rejecting names already used by the category. */
  addSubCategory(name: string): Result<SubCategory> {
    const subCategory = SubCategory.tryCreate({ name });
    if (subCategory.isFailure) {
      return subCategory.withFail;
    }

    const duplicate = this.subCategories.some(
      (current) => current.name.toLowerCase() === subCategory.instance.name.toLowerCase(),
    );
    if (duplicate) {
      return Result.fail(Category.SUBCATEGORY_DUPLICATE_NAME);
    }

    this.props.subCategories = [
      ...(this.props.subCategories ?? []),
      { ...subCategory.instance.props },
    ];

    return Result.ok(subCategory.instance);
  }
}
