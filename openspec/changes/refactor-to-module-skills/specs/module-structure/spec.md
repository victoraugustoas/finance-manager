# Spec Delta

## Purpose

Define o layout estrutural do finance-manager alinhado às skills `module-*`: domínio, testes e adapters em `src/modules/`, kernel Genérico em `src/shared` via `@/shared`, bootstrap Nest em `src/`, organização por agregado e nomenclatura obrigatória.

## ADDED Requirements

### Requirement: Layout alinhado às module skills

O repositório MUST organizar o código assim:

- Domínio, adapters Prisma/HTTP e testes do módulo: `src/modules/<module>/`
- Kernel compartilhado: `src/shared/**`, importado exclusivamente via alias `@/shared` (`@/*` mapeia para `src/*`)
- Bootstrap NestJS (`main.ts`, entrypoint): `src/`

O projeto MUST NOT tratar `packages/shared` como localização canônica do kernel nesta change e MUST NOT introduzir `modules/` na raiz nem `apps/backend/`. Cada módulo MUST expor `src/modules/<module>/index.ts`. Código de produção do agregado MUST viver sob `src/modules/<module>/<aggregate>/**`. Artefatos exclusivos de teste MUST viver sob `src/modules/<module>/test/**` e NÃO sob `src/modules/<module>/<aggregate>/**`.

#### Scenario: Estrutura após migração

- **WHEN** a migração estrutural for concluída
- **THEN** existem `src/modules/`, kernel utilizável sob `src/shared` via `@/shared`, e bootstrap Nest em `src/`
- **AND** não permanece domínio de negócio sob o layout legado `src/{accounts,category,transactions,reporting}/core`

### Requirement: Fonte de verdade do kernel shared

O kernel compartilhado MUST ser o conjunto adicionado pelo commit `1a04a95b` (arquivos Genérico kebab-case sob `src/shared/base`, `src/shared/ValueObjects/id.vo.ts`, `src/shared/errors/*`, com testes em `test/shared/**`). Implementações shared PascalCase legadas e demais VOs/handlers legados em `src/shared` que não fazem parte desse commit MUST ser removidas no apply. Skills `module-*` e artefatos OpenSpec MUST ser preservados.

#### Scenario: Kernel único após limpeza

- **WHEN** a etapa keep/delete do apply for concluída
- **THEN** o código importa bases de domínio de `@/shared/...` correspondente aos arquivos Genérico de `1a04a95b`
- **AND** não coexistem `Entity.ts`/`Result.ts` PascalCase legados como API canônica ao lado do kernel Genérico

### Requirement: Organização por agregado

Dentro de `src/modules/<module>/<aggregate>/`, o agregado MUST usar pastas em inglês e kebab-case: `model`, `provider`, `use-case` e `dto` quando aplicável. O agregado MUST exportar via `src/modules/<module>/<aggregate>/index.ts`, e o módulo MUST reexportar o agregado em `src/modules/<module>/index.ts` sem remover exports existentes no momento da adição.

#### Scenario: Scaffold de agregado

- **WHEN** um agregado é criado sob um módulo
- **THEN** existem pelo menos `model/`, `provider/` e `use-case/` sob `src/modules/<module>/<aggregate>/`
- **AND** o módulo exporta o agregado por `src/modules/<module>/index.ts`

### Requirement: Nomenclatura kebab-case com sufixos das skills

Arquivos de componentes de código sob `src/modules/` e o kernel sob `src/shared/` MUST usar `kebab-case` com sufixos em inglês definidos pelas skills (exceto símbolos já referenciados pelas skills em path PascalCase pontual, ex. `UseCase`, até alinhamento explícito):

- Entidade: `<nome>.entity.ts`
- Value Object: `<nome>.vo.ts`
- Repositório (contrato): `<nome>.repository.ts`
- Query CQRS: `<nome>.query.ts`
- Use case: `<verb>-<nome>.use-case.ts`
- Domain service: `<nome>.service.ts`
- DTO: sob `dto/`, nomes em kebab-case

Classes e interfaces MUST permanecer em PascalCase. Testes de use case MUST seguir `src/modules/<module>/test/<aggregate>/<verb>-<aggregate>.use-case.test.ts` (ou equivalente documentado pela skill). Mocks in-memory de repositório MUST ficar em `src/modules/<module>/test/**/mock/`, nunca dentro de `src/modules/<module>/<aggregate>/**`.

Em conflito com a convenção PascalCase de arquivos do `AGENTS.md` legado, esta requirement MUST prevalecer.

#### Scenario: Arquivo de entidade recriado

- **WHEN** a entidade de conta é criada no módulo correspondente
- **THEN** o arquivo se chama `account.entity.ts` (ou nome kebab-case do agregado) sob `model/`
- **AND** não permanece como `Account.ts` no layout legado

### Requirement: Mapeamento dos bounded contexts

Os bounded contexts documentados MUST ser representados como módulos sob `src/modules/` **após** a remoção das implementações legadas e o rebuild via skills:

| Contexto legado (a remover) | Módulo alvo (kebab-case) |
| --- | --- |
| Account (`src/accounts`) | `src/modules/account` |
| Category (`src/category`) | `src/modules/category` |
| Transaction (`src/transactions`) | `src/modules/transaction` |
| Reporting (`src/reporting`) | `src/modules/reporting` |
| Notifications (sem código em `src/modules/` hoje) | `src/modules/notifications` somente quando houver implementação |

#### Scenario: Contextos de negócio recriados

- **WHEN** o rebuild dos contextos for concluído
- **THEN** existem `src/modules/account`, `src/modules/category`, `src/modules/transaction` e `src/modules/reporting`
- **AND** cada um contém `index.ts`

### Requirement: Estabilidade da API HTTP e da persistência

Após o rebuild, a refatoração MUST preservar o comportamento HTTP observável (rotas, métodos, formatos de request/response e códigos de status já expostos) e o schema de persistência Prisma, salvo correção de bug incidental documentada. Regras de negócio MUST permanecer semanticamente equivalentes. Durante a janela entre o delete das implementações legadas e a recriação dos módulos, a API MAY ficar indisponível para esses contextos — essa janela MUST ser temporária e encerrada antes de concluir a change.

#### Scenario: Smoke da API após rebuild de um contexto

- **WHEN** um contexto recriado é exercitado pelos mesmos endpoints HTTP de antes
- **THEN** as respostas observáveis (status e shape público) permanecem equivalentes
- **AND** nenhuma migration Prisma nova é exigida apenas por mudança de pastas/arquivos
