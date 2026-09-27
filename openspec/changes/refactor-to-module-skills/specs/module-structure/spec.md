# Spec Delta

## Purpose

Define o layout estrutural do finance-manager alinhado às skills `module-*`: monorepo com `modules/`, `packages/shared/` e `apps/backend/`, organização por agregado e nomenclatura obrigatória.

## ADDED Requirements

### Requirement: Layout monorepo alinhado às module skills

O repositório MUST organizar o código de domínio, kernel compartilhado e infraestrutura de aplicação nos caminhos exigidos pelas skills `module-*`:

- Domínio de negócio: `modules/<module>/`
- Kernel compartilhado: `packages/shared/`
- App NestJS (controllers, adapters Prisma, wiring): `apps/backend/`

Cada módulo de domínio MUST expor `modules/<module>/src/index.ts`. Código de produção do módulo MUST viver sob `modules/<module>/src/**`. Artefatos exclusivos de teste MUST viver sob `modules/<module>/test/**` e NÃO sob `modules/<module>/src/**`.

#### Scenario: Estrutura raiz após migração

- **WHEN** a migração estrutural for concluída
- **THEN** existem os diretórios `modules/`, `packages/shared/` e `apps/backend/`
- **AND** não permanece domínio de negócio sob o layout legado `src/{accounts,category,transactions,reporting}/core`

### Requirement: Organização por agregado

Dentro de `modules/<module>/src/<aggregate>/`, o agregado MUST usar pastas em inglês e kebab-case: `model`, `provider`, `use-case` e `dto` quando aplicável. O agregado MUST exportar via `modules/<module>/src/<aggregate>/index.ts`, e o módulo MUST reexportar o agregado em `modules/<module>/src/index.ts` sem remover exports existentes no momento da adição.

#### Scenario: Scaffold de agregado

- **WHEN** um agregado é criado ou migrado para um módulo
- **THEN** existem pelo menos `model/`, `provider/` e `use-case/` sob `modules/<module>/src/<aggregate>/`
- **AND** o módulo exporta o agregado por `src/index.ts`

### Requirement: Nomenclatura kebab-case com sufixos das skills

Arquivos de componentes de código sob `modules/` e `packages/shared/` MUST usar `kebab-case` com sufixos em inglês definidos pelas skills:

- Entidade: `<nome>.entity.ts`
- Value Object: `<nome>.vo.ts`
- Repositório (contrato): `<nome>.repository.ts`
- Query CQRS: `<nome>.query.ts`
- Use case: `<verb>-<nome>.use-case.ts`
- Domain service: `<nome>.service.ts`
- DTO: sob `dto/`, nomes em kebab-case

Classes e interfaces MUST permanecer em PascalCase. Testes de use case MUST seguir `modules/<module>/test/<aggregate>/<verb>-<aggregate>.use-case.test.ts` (ou equivalente documentado pela skill). Mocks in-memory de repositório MUST ficar em `modules/<module>/test/**/mock/` (ex.: `in-memory-<aggregate>.repository.ts`), nunca em `src/**`.

Em conflito com a convenção PascalCase de arquivos do `AGENTS.md` legado, esta requirement MUST prevalecer.

#### Scenario: Arquivo de entidade migrado

- **WHEN** a entidade de conta é migrada para o módulo correspondente
- **THEN** o arquivo se chama `account.entity.ts` (ou nome kebab-case do agregado) sob `model/`
- **AND** não permanece como `Account.ts` no layout legado

### Requirement: Mapeamento dos bounded contexts existentes

Os bounded contexts documentados MUST ser representados como módulos sob `modules/`:

| Contexto legado | Módulo alvo (kebab-case) |
| --- | --- |
| Account (`src/accounts`) | `modules/account` |
| Category (`src/category`) | `modules/category` |
| Transaction (`src/transactions`) | `modules/transaction` |
| Reporting (`src/reporting`) | `modules/reporting` |
| Notifications (documentado; sem código em `src/` hoje) | `modules/notifications` somente quando houver implementação |

Nomes de pastas de módulo e agregado MUST ser em inglês kebab-case.

#### Scenario: Contextos de negócio migrados

- **WHEN** a migração dos contextos com código existente for concluída
- **THEN** existem `modules/account`, `modules/category`, `modules/transaction` e `modules/reporting`
- **AND** cada um contém `src/index.ts`

### Requirement: Estabilidade da API HTTP e da persistência

A refatoração estrutural MUST preservar o comportamento HTTP observável (rotas, métodos, formatos de request/response e códigos de status já expostos) e o schema de persistência Prisma (modelos e migrations existentes), salvo correção de bug incidental documentada. Regras de negócio MUST permanecer semanticamente equivalentes.

#### Scenario: Smoke da API após migração de um contexto

- **WHEN** um contexto migrado é exercitado pelos mesmos endpoints HTTP de antes
- **THEN** as respostas observáveis (status e shape público) permanecem equivalentes
- **AND** nenhuma migration Prisma nova é exigida apenas por mudança de pastas/arquivos
