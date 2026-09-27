import { validate as isUuid } from 'uuid';
import { Id } from '@/shared/ValueObjects/id.vo';
import { SharedErrors } from '@/shared/errors/shared-errors';

describe('Id', () => {
  test('should create with valid provided id', () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000';
    const result = Id.tryCreate(validId, { meta: { attribute: 'id' } });

    expect(result.isOk).toBe(true);
    expect(result.instance.value).toBe(validId);
  });

  test('should have a failed result if provided value not valid', () => {
    const invalidId = 'not-a-uuid';
    const result = Id.tryCreate(invalidId, { meta: { attribute: 'id' } });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toBeDefined();
    expect(result.errors[0]).toBe(SharedErrors.ID_INVALID);
  });

  test('should create a new id if no value is provided', () => {
    const result = Id.tryCreate(undefined);

    expect(result.isOk).toBe(true);
    expect(isUuid(result.instance.value)).toBe(true);
  });

  test('should generate uuid with createUUID', () => {
    const id = Id.createUUID();
    expect(id).toHaveLength(36);
  });

  test('should throw when constructing with invalid id', () => {
    expect(() => Id.create('123')).toThrow();
  });

  test('should construct from existing valid id', () => {
    const value = Id.createUUID();
    const id = Id.create(value);
    expect(id.value).toHaveLength(36);
  });

  test('should compare equal ids', () => {
    const id1 = Id.create();
    const id2 = Id.create(id1.value);
    expect(id1.equals(id2)).toBe(true);
    expect(id1.notEquals(id2)).toBe(false);
  });

  test('should compare different ids', () => {
    const id1 = Id.create();
    const id2 = Id.create();
    expect(id1.equals(id2)).toBe(false);
    expect(id1.notEquals(id2)).toBe(true);
  });

  test('should fail when required id is empty', () => {
    const result = Id.required('');

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(SharedErrors.ID_INVALID);
  });

  test('should return result when required id is valid', () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000';
    const result = Id.required(validId, { meta: { attribute: 'id' } });

    expect(result.isOk).toBe(true);
    expect(result.instance.value).toBe(validId);
  });

  test('should fail when required id is invalid', () => {
    const result = Id.required('invalid-id');

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(SharedErrors.ID_INVALID);
  });
});
