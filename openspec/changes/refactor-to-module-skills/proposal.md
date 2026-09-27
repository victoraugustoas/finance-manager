# Proposal

## Why

O commit `ebb6057b` substituiu as skills legadas `create-*` pelas skills `module-*`. Em seguida, o commit `1a04a95b` importou o kernel Genérico (kebab-case sob `src/shared`, testes em `test/shared`) e alinhou as skills ao alias `@/shared`. Hoje coexistem esse kernel e as implementações legadas do finance-manager (shared PascalCase + contextos em `src/{accounts,category,transactions,reporting}`), o que impede seguir as skills sem uma fonte de verdade única.

## What Changes

- **Decisão keep/delete (planejada; não aplicada nesta sessão):** manter o que o commit `1a04a95b` adicionou e apagar o restante das implementações legadas (detalhe em `design.md` D4).
- Alinhar o código às skills `module-aggregate`, `module-entity`, `module-value-object`, `module-repository`, `module-use-case`, `module-dto`, `module-query-cqrs` e `module-domain-service`.
- Kernel compartilhado canônico: arquivos Genérico em `src/shared/**` (import via `@/shared`, `@/*` → `src/*`), conforme o commit `1a04a95b` e as skills atualizadas — **não** `packages/shared` nem o kernel PascalCase legado.
- Introduzir layout de domínio em `modules/<module>/` e, para Nest/Prisma/HTTP, alvo `apps/backend/` (adapters/controllers), recriando os bounded contexts a partir das skills sobre o kernel mantido.
- Adotar nomenclatura das skills (`kebab-case` + sufixos `*.entity.ts`, `*.repository.ts`, `*.use-case.ts`, `*.query.ts`, `*.vo.ts`, `*.service.ts`).
- Atualizar `AGENTS.md` e README para as skills `module-*` e a decisão de kernel.
- Meta final: restaurar equivalência HTTP e schema Prisma; **BREAKING** intermediário esperado após a remoção das implementações legadas até os módulos serem recriados.

## Capabilities

### New Capabilities

- `module-structure`: layout-alvo (`modules/`, kernel em `src/shared` via `@/shared`, `apps/backend/`), organização por agregado, nomenclatura e fronteiras de teste.
- `module-write-side`: padrões de escrita — Entity, Value Object, Repository, Use Case, Domain Service e `Result` sobre o kernel Genérico mantido.
- `module-read-side`: padrões de leitura CQRS — Query, DTO de projeção, chamada direta pelo controller e exceções de use case de leitura.

### Modified Capabilities

Nenhuma. O projeto ainda não possui specs de domínio vigentes em `openspec/specs/`.

## Impact

- **Manter (commit `1a04a95b`):** kernel Genérico em `src/shared` (`base/*.ts` kebab-case, `ValueObjects/id.vo.ts`, `errors/*`), testes em `test/shared/**`, atualizações em `.agents/skills/module-*`, artefatos desta change OpenSpec, `mise.toml`, e dependência `uuid` em `package.json`/`pnpm-lock.yaml`.
- **Apagar (fora desse commit):** kernel PascalCase e VOs/app legados em `src/shared` que não fazem parte de `1a04a95b`; implementações de domínio/app em `src/accounts`, `src/category`, `src/transactions`, `src/reporting` (e testes/adapters associados).
- **Preservar além do commit (assunção):** skills `module-*` e OpenSpec; bootstrap Nest/`PrismaService`/schema Prisma e scripts de infra mínimos necessários para o app voltar a subir após recriar módulos — só o que o código mantido ou o rebuild exigir.
- Controllers HTTP: contratos públicos como meta de equivalência após o rebuild; janela intermediária sem os contextos legados.
- Skills em `.agents/skills/module-*` não são reescritas nesta change além do já feito em `1a04a95b`.
