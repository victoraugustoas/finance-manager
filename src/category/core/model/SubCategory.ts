import { Entity } from '@/shared/base/Entity';
import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';

interface SubCategoryProps {
  id?: string;
  name: string;
}

export class SubCategory extends Entity<SubCategoryProps> {
  private constructor(props: SubCategoryProps) {
    super(props, props.id);
  }

  get name(): string {
    return this.props.name;
  }

  static create(props: SubCategoryProps): Result<SubCategory> {
    const trimmed = props.name.trim();
    if (!trimmed) {
      return Result.fail({ code: Errors.SUBCATEGORY_NAME_EMPTY });
    }
    return Result.ok(new SubCategory({ ...props, name: trimmed }));
  }

  static new(props: SubCategoryProps): SubCategory {
    return new SubCategory(props);
  }
}
