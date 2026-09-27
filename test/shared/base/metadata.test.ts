import { Metadata, MetadataProps } from '@/shared/base/metadata';

test('should create Metadata with correct values', () => {
  const props: MetadataProps = {
    module: 'auth',
    object: 'user',
    attribute: 'email',
    value: 'johndoe@company.com',
    id: '123',
  };

  const metadata = new Metadata(props);

  expect(metadata.module).toBe('auth');
  expect(metadata.object).toBe('user');
  expect(metadata.attribute).toBe('email');
  expect(metadata.value).toBe('johndoe@company.com');
  expect(metadata.id).toBe('123');
});

test('should return undefined for missing properties', () => {
  const metadata = new Metadata({});

  expect(metadata.module).toBeUndefined();
  expect(metadata.object).toBeUndefined();
  expect(metadata.attribute).toBeUndefined();
  expect(metadata.value).toBeUndefined();
  expect(metadata.id).toBeUndefined();
});

test('should create new Metadata with updated module', () => {
  const metadata = new Metadata({ module: 'Original' });
  const updatedMetadata = metadata.withModule('Updated');

  expect(updatedMetadata.module).toBe('Updated');
  expect(metadata.module).toBe('Original');
});

test('should create new Metadata with updated object', () => {
  const metadata = new Metadata({ object: 'Original' });
  const updatedMetadata = metadata.withObject('Updated');

  expect(updatedMetadata.object).toBe('Updated');
  expect(metadata.object).toBe('Original');
});

test('should create new Metadata with updated attribute', () => {
  const metadata = new Metadata({ attribute: 'Original' });
  const updatedMetadata = metadata.withAttribute('Updated');

  expect(updatedMetadata.attribute).toBe('Updated');
  expect(metadata.attribute).toBe('Original');
});

test('should create new Metadata with updated value', () => {
  const metadata = new Metadata({ value: 100 });
  const updatedMetadata = metadata.withValue(200);

  expect(updatedMetadata.value).toBe(200);
  expect(metadata.value).toBe(100);
});

test('should create new Metadata with updated id', () => {
  const metadata = new Metadata({ id: '123' });
  const updatedMetadata = metadata.withId('456');

  expect(updatedMetadata.id).toBe('456');
  expect(metadata.id).toBe('123');
});

test('should chain fluent updates into a new Metadata instance', () => {
  const original = new Metadata({
    module: 'Mod1',
    object: 'Obj1',
    attribute: 'Attr1',
    value: 10,
    id: '001',
  });

  const updated = original
    .withModule('Mod2')
    .withObject('Obj2')
    .withAttribute('Attr2')
    .withValue(20)
    .withId('002');

  expect(original.module).toBe('Mod1');
  expect(original.object).toBe('Obj1');
  expect(original.attribute).toBe('Attr1');
  expect(original.value).toBe(10);
  expect(original.id).toBe('001');

  expect(updated.module).toBe('Mod2');
  expect(updated.object).toBe('Obj2');
  expect(updated.attribute).toBe('Attr2');
  expect(updated.value).toBe(20);
  expect(updated.id).toBe('002');
});

test('should create scoped Metadata with to()', () => {
  const userMeta = new Metadata({ module: 'auth', object: 'user' });
  const nameMeta = userMeta.to('name');
  const emailMeta = userMeta.to('email', 'invalid@example.com');

  expect(nameMeta.module).toBe('auth');
  expect(nameMeta.object).toBe('user');
  expect(nameMeta.attribute).toBe('name');
  expect(nameMeta.value).toBeUndefined();

  expect(emailMeta.module).toBe('auth');
  expect(emailMeta.object).toBe('user');
  expect(emailMeta.attribute).toBe('email');
  expect(emailMeta.value).toBe('invalid@example.com');
});
