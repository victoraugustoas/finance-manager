---
name: module-repository
description: 'Criar, revisar ou orientar contratos e implementações de repositório de módulo no padrão Genérico. Usar quando o pedido envolver arquivos `*.repository.ts`, operações de persistência de entidades (create/update/findById/findAll/delete), adaptação de infraestrutura (ex.: Prisma) para contratos de módulo, tratamento de erros com `Result`, mapeamentos `toDomain/fromDomain` ou a skill `module-repository`.'
---

# Module Repository

## Overview

Aplicar o padrão de repositório para escrita e leitura de entidades de domínio com contratos no `dominio` e implementação desacoplada em infraestrutura.

## Estrutura espelhada

A infraestrutura repete o agregado e a pasta `provider/` do domínio:

```text
src/modules/<module>/<aggregate>/provider/<aggregate>.repository.ts
src/modules/<module>/infra/<aggregate>/provider/prisma-<aggregate>.repository.ts
```

`model/`, `use-case/` e `service/` ficam só no agregado. O módulo Nest do contexto fica em `src/modules/<module>/infra/<module>.module.ts` e liga a interface do repositório à classe Prisma.

## Guidelines

- Definir contrato em `src/modules/<module>/<aggregate>/provider/*.repository.ts`.
- Reutilizar `Result` de `@/shared/base/result` e `RepositoryErrors` de `@/shared/errors/shared-errors`. O kernel em `src/shared` não expõe base CRUD.
- Implementar o adapter em `src/modules/<module>/infra/<aggregate>/provider/`, espelhando a pasta `provider/` do agregado. Um contrato vira um arquivo: `prisma-<aggregate>.repository.ts` implementa `<aggregate>.repository.ts` e retorna `Result`.
- Não concentrar o repositório num `<aggregate>.prisma.ts` na raiz do módulo.
- Mapear domínio explicitamente:
  - `toDomain`: payload do banco -> entidade.
  - `fromDomain`: entidade -> payload de persistência.
- Tratar falhas com `Result.fail(...)` e não vazar exceção no fluxo normal.
- Manter separação CQRS:
  - Repository para comando/escrita e leitura orientada a entidade.
  - Query para leitura/projeção DTO.

## Workflow

1. Confirmar agregados/entidades cobertos pelo repositório.
2. Definir/ajustar contrato no dominio com métodos mínimos necessários.
3. Implementar adapter de infraestrutura respeitando o contrato.
4. Implementar mapeamento `toDomain`/`fromDomain`.
5. Garantir consistência transacional para operações compostas.
6. Criar/ajustar mocks in-memory para testes de use case.

## References

Consultar `references/repository-pattern.md` para contratos, exemplos de implementação e checklist.
