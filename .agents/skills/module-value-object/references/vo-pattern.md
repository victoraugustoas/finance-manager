# VO Pattern (Genérico)

## Paths

- VOs globais (shared):
  - `src/shared/ValueObjects/*.vo.ts` (exemplo: `src/shared/ValueObjects/id.vo.ts`)
  - `test/shared/ValueObjects/*.vo.test.ts`
- VOs de módulo (domínio):
  - `src/modules/<domain>/<feature>/model/<name>.vo.ts`
  - `src/modules/<domain>/test/<feature>/<name>.vo.test.ts`
- Base VO: `src/shared/base/vo.ts` (`import { ValueObject, ValueObjectConfig } from '@/shared/base/vo'`)
- Result: `src/shared/base/result.ts` (`import { Result } from '@/shared/base/result'`)

## Core Principles

- Imutabilidade: valor definido no construtor e sem setters.
- Invariantes: validar no `tryCreate` e retornar `Result.fail` quando violado.
- Normalizacao: aplicar `trim`, `toLowerCase`, formatações ou defaults quando fizer sentido.
- Erros: usar constantes estaticas com codigo legivel (ex.: `INVALID_EMAIL`).
- API consistente: `create` -> chama `tryCreate`, `throwsIfFailed`, retorna `instance`.

## Skeleton

```ts
import { Result } from '@/shared/base/result';
import { ValueObject, ValueObjectConfig } from '@/shared/base/vo';

export class ExampleVo extends ValueObject<string, ValueObjectConfig> {
  private static readonly INVALID_EXAMPLE = 'INVALID_EXAMPLE';
  private constructor(value: string, config?: ValueObjectConfig) {
    super(value, config);
  }

  public static create(value: string, config?: ValueObjectConfig): ExampleVo {
    const result = ExampleVo.tryCreate(value, config);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  public static tryCreate(value: string, config?: ValueObjectConfig): Result<ExampleVo> {
    try {
      const normalized = value.trim();
      if (!normalized) {
        throw new Error(ExampleVo.INVALID_EXAMPLE);
      }
      return Result.ok(new ExampleVo(normalized, config));
    } catch (error: any) {
      return Result.fail(error.message);
    }
  }
}
```

## Reference VOs

- `src/shared/ValueObjects/id.vo.ts` para geracao default (uuid), validacao e `tryCreate`.
- `test/shared/ValueObjects/id.vo.test.ts` e `test/shared/base/vo.test.ts` para o padrao de teste do kernel.

## Test Pattern

- Validar sucesso e falha (`isOk`, `isFailure`, `errors`).
- Verificar normalizacao do valor armazenado.
- Testar `create` lancando erro quando invalido.
- Cobrir getters derivados quando existirem.
