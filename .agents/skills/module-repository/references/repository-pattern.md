# Repository Pattern (Genérico)

## Paths

- Kernel usado pelo contrato:
  - `src/shared/base/result.ts` (`Result`)
  - `src/shared/errors/shared-errors.ts` (`RepositoryErrors`)
- Não há `CrudRepository`, `CreateRepository` nem `FindByIdRepository` em `src/shared`. O contrato do agregado declara os métodos de persistência e retorna `Result`.
- Contratos de dominio em `src/modules/*`:
  - `src/modules/auth/user/provider/user.repository.ts`
  - `src/modules/product/product/provider/product.repository.ts`
  - `src/modules/branch/branch/provider/branch.repository.ts`
- Implementações de infraestrutura, espelhando `provider/` do agregado:
  - `src/modules/auth/infra/user/provider/prisma-user.repository.ts`
  - `src/modules/product/infra/product/provider/prisma-product.repository.ts`
  - `src/modules/branch/infra/branch/provider/prisma-branch.repository.ts`
- Mocks/in-memory para testes:
  - `src/modules/<domain>/test/mock/in-memory-<entity>.repository.ts`

## Papel do Repository

- Encapsular persistência de entidades de domínio.
- Expor operações orientadas ao agregado (CRUD + métodos específicos quando necessário).
- Não conter regra de caso de uso.

## Repository vs Query (CQRS)

- Repository:
  - usado em comando/escrita.
  - pode buscar entidade para preservar invariantes antes de update/delete.
- Query:
  - usada para leitura/projeção DTO.
  - contrato separado em `<aggregate>/provider/*.query.ts`.
  - implementação separada em `infra/<aggregate>/provider/prisma-*.query.ts`, ao lado do repositório Prisma.

## Estrutura esperada

1. Definir interface de repositório no `dominio`.
2. Declarar os métodos de persistência no contrato do agregado, retornando `Promise<Result<...>>`.
3. Adicionar métodos específicos de domínio apenas quando necessários.
4. Implementar o adapter Prisma em `src/modules/<module>/infra/<aggregate>/provider/prisma-<aggregate>.repository.ts`, no mesmo lugar relativo do contrato (`<aggregate>/provider/`). O mock in-memory fica só em `test/`.
5. Incluir mapeadores:

- `toDomain(payload)` para criar entidade.
- `fromDomain(entity)` para persistência.

## Checklist de implementação

- [ ] Contrato está em `dominio` e tipa `Promise<Result<...>>`.
- [ ] Implementação não vaza tipo de ORM para o dominio.
- [ ] Erro de not found mapeado para erro de domínio.
- [ ] Operações compostas usam transação quando necessário.
- [ ] Métodos customizados têm nome orientado ao domínio (`findByEmail`, `updateRoles`, etc.).
- [ ] Mocks de teste seguem contrato real.

## Estratégia de testes

- Testar sucesso/falha dos métodos principais.
- Testar not found.
- Testar métodos específicos de domínio.
- Em mocks/in-memory, garantir comportamento consistente com contrato.

## Armadilhas comuns

- Retornar DTO em método de repository (quebra fronteira com query).
- Acoplar use case ao ORM em vez da interface.
- Não normalizar dados ao mapear domínio.
- Esquecer transação em operações que alteram múltiplas tabelas.
