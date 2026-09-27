# Proposal

## Why

O commit `ebb6057b` substituiu as skills legadas `create-*` (CQRS/DDD sob `src/{context}`) pelas skills `module-*` do padrão Genérico (`modules/<module>`, `packages/shared`, `apps/backend`). O código ainda segue a arquitetura antiga, então novas contribuições e a base existente divergem das especificações que os agentes devem seguir.

## What Changes

- Alinhar o código ao padrão das skills `module-aggregate`, `module-entity`, `module-value-object`, `module-repository`, `module-use-case`, `module-dto`, `module-query-cqrs` e `module-domain-service`.
- Introduzir layout-alvo: domínio em `modules/<module>/`, kernel compartilhado em `packages/shared/`, infraestrutura NestJS/Prisma/HTTP em `apps/backend/`.
- Migrar contextos existentes (`accounts`, `category`, `transactions`, `reporting`; `notifications` quando existir código) para módulos/agregados com pastas `model`, `provider`, `use-case`, `dto` e testes em `modules/<module>/test/**`.
- Substituir `CommandHandler`/`QueryHandler` por `UseCase` (escrita) e contratos `*Query` (leitura), com DTOs e `Result` conforme as skills.
- Adotar nomenclatura das skills (`kebab-case` + sufixos `*.entity.ts`, `*.repository.ts`, `*.use-case.ts`, `*.query.ts`, `*.vo.ts`, `*.service.ts`) em vez do PascalCase legado do `AGENTS.md`.
- Atualizar documentação de projeto (`AGENTS.md`, README) para referenciar as skills `module-*` e remover referências às skills `create-*` removidas.
- **Não** alterar comportamento HTTP observável, schema Prisma/persistência nem regras de negócio, salvo se uma skill exigir contrato estrutural interno (API pública permanece estável).

## Capabilities

### New Capabilities

- `module-structure`: layout-alvo do monorepo (`modules/`, `packages/shared/`, `apps/backend/`), organização por agregado, nomenclatura e fronteiras de teste.
- `module-write-side`: padrões de escrita — Entity, Value Object, Repository, Use Case, Domain Service e tratamento com `Result`.
- `module-read-side`: padrões de leitura CQRS — Query, DTO de projeção, chamada direta pelo controller e exceções de use case de leitura.

### Modified Capabilities

Nenhuma. O projeto ainda não possui specs de domínio vigentes em `openspec/specs/`.

## Impact

- Código sob `src/accounts`, `src/category`, `src/transactions`, `src/reporting`, `src/shared`, `src/entrypoint` e `src/main.ts` (migração estrutural).
- Controllers HTTP: rotas, verbos e contratos de request/response públicos permanecem estáveis; wiring interno muda para use cases/queries.
- Prisma: schema e migrations permanecem; adapters passam a viver sob `apps/backend` implementando contratos em `modules/*/provider`.
- Workspace pnpm: novos pacotes `packages/shared` e `modules/*`; app Nest em `apps/backend`.
- Documentação: `AGENTS.md` e README alinhados às skills `module-*`.
- Skills em `.agents/skills/module-*` não são alteradas nem removidas.
