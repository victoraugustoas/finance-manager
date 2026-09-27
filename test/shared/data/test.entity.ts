import { Entity, EntityProps } from '@/shared/base/entity';
import { Result } from '@/shared/base/result';

export interface TestEntityProps extends EntityProps {
  number: number;
  obj?: any;
  when?: Date | null;
}

export class TestEntity extends Entity<TestEntity, TestEntityProps> {
  constructor(props: TestEntityProps) {
    super(props);
  }

  get number() {
    return this.props.number;
  }
  get obj() {
    return this.props.obj;
  }
  get when() {
    return this.props.when;
  }

  static tryCreate(props: TestEntityProps): Result<TestEntity> {
    if (props.number < 0) {
      return Result.fail('NUMBER_INVALID');
    }
    return Result.ok(new TestEntity({ ...props }));
  }

  static create(props: TestEntityProps): TestEntity {
    const result = this.tryCreate(props);
    result.validator.throwsIfFailed();
    return result.instance;
  }
}
