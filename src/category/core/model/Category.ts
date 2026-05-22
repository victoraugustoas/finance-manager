import { AggregateRoot } from '@/shared/base/AggregateRoot';
import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { SubCategory } from './SubCategory';
import { CategoryType } from '@/shared/enums/CategoryType';

export const DEFAULT_SUBCATEGORY_NAME = 'Others' as const;

export interface CategoryProps {
  id?: string;
  name: string;
  type: CategoryType;
  subCategories?: Array<{ id?: string; name: string }>;
}

export class Category extends AggregateRoot<Omit<CategoryProps, 'subCategories'>> {
  private readonly _subCategories: SubCategory[] = [];

  private constructor(props: Omit<CategoryProps, 'subCategories'>) {
    super(props, props.id);
  }

  get name(): string {
    return this.props.name;
  }

  get type(): CategoryType {
    return this.props.type;
  }

  get subCategories(): ReadonlyArray<SubCategory> {
    return this._subCategories;
  }

  static new(props: CategoryProps): Category {
    const subCategories = props.subCategories?.map((sub) => SubCategory.new(sub));
    const category = new Category(props);
    category._subCategories.push(...(subCategories ?? []));
    return category;
  }

  static create(props: CategoryProps): Result<Category> {
    const trimmed = props.name.trim();
    if (!trimmed) {
      return Result.fail({ code: Errors.CATEGORY_NAME_EMPTY });
    }
    const { subCategories, id, type } = props;
    const category = new Category({ id, type, name: trimmed });
    if (subCategories !== undefined) {
      for (const raw of subCategories) {
        const sub = SubCategory.create({ id: raw.id, name: raw.name });
        if (sub.isFailure) {
          return Result.fail(sub.errors);
        }
        category._subCategories.push(sub.value);
      }
    } else {
      const defaultSub = SubCategory.new({ name: DEFAULT_SUBCATEGORY_NAME });
      category._subCategories.push(defaultSub);
    }
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
