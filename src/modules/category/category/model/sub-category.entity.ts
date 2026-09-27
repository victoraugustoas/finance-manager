import { Entity, EntityProps } from '@/shared/base/entity';
import { Result } from '@/shared/base/result';

export interface SubCategoryProps extends EntityProps {
  name: string;
}

export class SubCategory extends Entity<SubCategory, SubCategoryProps> {
  static readonly NAME_EMPTY = 'SUBCATEGORY_NAME_EMPTY';

  private constructor(props: SubCategoryProps) {
    super(props);
  }

  get name(): string {
    return this.props.name;
  }

  static create(props: SubCategoryProps): SubCategory {
    const result = SubCategory.tryCreate(props);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  static tryCreate(props: SubCategoryProps): Result<SubCategory> {
    const name = props.name?.trim();
    if (!name) {
      return Result.fail(SubCategory.NAME_EMPTY);
    }

    return Result.ok(new SubCategory({ ...props, name }));
  }
}
