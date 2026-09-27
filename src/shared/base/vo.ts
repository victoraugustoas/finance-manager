import type { MetadataProps } from './metadata';
import { Metadata } from './metadata';

export interface ValueObjectConfig {
  meta?: MetadataProps;
  optional?: boolean;
}

export type OptionalConfig<
  Config extends ValueObjectConfig = ValueObjectConfig,
> = Config & {
  optional: true;
};

export function resolveVoConfig(
  metaOrConfig?: Metadata | ValueObjectConfig,
): ValueObjectConfig | undefined {
  if (!metaOrConfig) return undefined;
  if (metaOrConfig instanceof Metadata) return { meta: metaOrConfig.props };
  return metaOrConfig;
}

export function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'number') return Number.isNaN(value);
  return false;
}

export abstract class ValueObject<T, Config extends ValueObjectConfig> {
  constructor(readonly value: T, readonly config?: Config) {}

  equals(vo: ValueObject<T, Config>): boolean {
    return this.value === vo.value;
  }

  notEquals(vo: ValueObject<T, Config>): boolean {
    return !this.equals(vo);
  }
}
