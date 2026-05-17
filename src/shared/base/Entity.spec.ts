import { Entity } from './Entity';

class SomeEntity extends Entity<{ name: string; value: number }> {
  constructor(props: { name: string; value: number }, id?: string) {
    super(props, id);
  }
}

describe('Entity', () => {
  describe('id', () => {
    it('should use the provided id', () => {
      const entity = new SomeEntity({ name: 'X', value: 1 }, 'fixed-id');

      expect(entity.id).toBe('fixed-id');
    });

    it('should generate a UUID when no id is provided', () => {
      const entity = new SomeEntity({ name: 'X', value: 1 });

      expect(entity.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should generate different ids for two instances without explicit id', () => {
      const a = new SomeEntity({ name: 'X', value: 1 });
      const b = new SomeEntity({ name: 'X', value: 1 });

      expect(a.id).not.toBe(b.id);
    });
  });

  describe('equals()', () => {
    it('should return true when both entities share the same id', () => {
      const a = new SomeEntity({ name: 'A', value: 1 }, 'same-id');
      const b = new SomeEntity({ name: 'B', value: 2 }, 'same-id');

      expect(a.equals(b)).toBe(true);
    });

    it('should return false when entities have different ids', () => {
      const a = new SomeEntity({ name: 'X', value: 1 }, 'id-1');
      const b = new SomeEntity({ name: 'X', value: 1 }, 'id-2');

      expect(a.equals(b)).toBe(false);
    });
  });

  describe('copyWith()', () => {
    it('should override the given props on the copy', () => {
      const original = new SomeEntity({ name: 'Original', value: 10 }, 'entity-id');

      const copy = original.copyWith({ name: 'Updated' });

      expect(copy.props.name).toBe('Updated');
    });

    it('should preserve props not included in the overrides', () => {
      const original = new SomeEntity({ name: 'Original', value: 10 }, 'entity-id');

      const copy = original.copyWith({ name: 'Updated' });

      expect(copy.props.value).toBe(10);
    });

    it('should preserve the same id', () => {
      const original = new SomeEntity({ name: 'Original', value: 10 }, 'entity-id');

      const copy = original.copyWith({ value: 99 });

      expect(copy.id).toBe('entity-id');
    });

    it('should return an instance of the same class', () => {
      const original = new SomeEntity({ name: 'Original', value: 10 }, 'entity-id');

      const copy = original.copyWith({});

      expect(copy).toBeInstanceOf(SomeEntity);
    });

    it('should not mutate the original props', () => {
      const original = new SomeEntity({ name: 'Original', value: 10 }, 'entity-id');

      original.copyWith({ name: 'Different', value: 99 });

      expect(original.props.name).toBe('Original');
      expect(original.props.value).toBe(10);
    });
  });
});
