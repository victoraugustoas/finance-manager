import { AggregateRoot } from '@/shared/base/aggregate-root';
import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/result';
import { SubCategory } from './sub-category';

export const DEFAULT_SUBCATEGORY_NAME = 'Others' as const;

interface CategoryProps {
  id?: string;
  name: string;
}

export class Category extends AggregateRoot<CategoryProps> {
  private readonly _subCategories: SubCategory[] = [];

  private constructor(props: CategoryProps) {
    super(props, props.id);
  }

  get name(): string {
    return this.props.name;
  }

  get subCategories(): ReadonlyArray<SubCategory> {
    return this._subCategories;
  }

  static create(props: CategoryProps): Result<Category> {
    const trimmed = props.name.trim();
    if (!trimmed) {
      return Result.fail({ code: Errors.CATEGORY_NAME_EMPTY });
    }
    const category = new Category({ ...props, name: trimmed });
    const defaultSub = SubCategory.new({ name: DEFAULT_SUBCATEGORY_NAME });
    category._subCategories.push(defaultSub);
    return Result.ok(category);
  }

  addSubCategory(name: string): Result<SubCategory> {
    const sub = SubCategory.create({ name });
    if (sub.isFailure) {
      return sub;
    }
    const duplicate = this._subCategories.some(
      (s) => s.name.toLowerCase() === sub.value.name.toLowerCase(),
    );
    if (duplicate) {
      return Result.fail({ code: Errors.SUBCATEGORY_DUPLICATE_NAME });
    }
    this._subCategories.push(sub.value);
    return Result.ok(sub.value);
  }
}
