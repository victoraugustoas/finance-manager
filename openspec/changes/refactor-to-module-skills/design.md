# Design

## Context

Ver `proposal.md` (Why). Estado atual observado:

- App NestJS single-package: `src/{accounts,category,transactions,reporting,shared,entrypoint}` + `src/main.ts`.
- CQRS legado: `CommandHandler`/`QueryHandler` sob `core/commands` e `core/queries`; ports em `core/ports`; Prisma em `infra/database`; DTOs HTTP em `infra/dtos`.
- Shared em `src/shared/base` com `Entity`, `Result`, `ValueObject`, `UseCase`, `CommandHandler`, `QueryHandler`, `AggregateRoot` — APIs diferentes das skills Genérico (`Entity<Type, Props>`, `tryCreate`, `cloneWith`, `CrudRepository`, pacote `@mentoria-360/shared` nos exemplos).
- Skills novas assumem monorepo Genérico: `modules/<module>`, `packages/shared`, `apps/backend`, arquivos `kebab-case` + sufixos.
- `AGENTS.md` ainda cita skills `create-*` removidas e PascalCase para arquivos de componente.
- Arquivo referenciado `../skills-standards.md` **não existe** no commit; nomenclatura autoritativa = skill `module-aggregate` + pattern docs irmãos.
- Não há `modules/`, `packages/` nem `apps/` hoje. Contexto Notifications está só documentado (sem pasta em `src/`).

## Goals / Non-Goals

**Goals:**

- Definir o caminho de migração estrutural até o layout das skills, contexto a contexto.
- Adaptar o kernel shared às APIs que as skills exigem, preservando comportamento de negócio.
- Substituir handlers de comando por use cases e handlers de query por contratos Query + adapters.
- Registrar conflitos de convenção e a fonte da verdade escolhida.

**Non-Goals:**

- Novas features de produto, novos endpoints ou mudanças de schema Prisma “de propósito”.
- Reescrever as skills `module-*` ou portar o exemplo Mentoria-360 literal (auth/stock/product).
- Introduzir frontend ou apps além do backend Nest.
- Criar `modules/notifications` vazio só por documentação.

## Decisions

### D1 — Adotar monorepo pnpm com três camadas

**Escolha:** Workspace com `packages/shared`, `modules/*` (pacotes de domínio) e `apps/backend` (Nest + Prisma adapters + controllers).

**Por quê:** É o layout explícito das skills (`module-aggregate`, `module-repository`, `module-query-cqrs`). Manter tudo em `src/` forçaria desviar das skills e quebraria o script `create-aggregate.js`.

**Alternativa:** Manter single-package e só renomear pastas internas — rejeitada porque paths das skills (`modules/`, `packages/shared`, `apps/backend`) deixariam de ser verdadeiros.

### D2 — Nomes de módulos no singular inglês

**Escolha:** `account`, `category`, `transaction`, `reporting` (e `notifications` só com código).

**Por quê:** Skills exigem pastas kebab-case em inglês; singular alinha a exemplos Genérico (`modules/auth`, `modules/product`).

**Alternativa:** Manter plurais legados (`accounts`, `transactions`) — rejeitada por divergir da skill de aggregate e do inglês canônico.

### D3 — Nomenclatura de arquivos: skills vencem AGENTS.md

**Conflito:** `AGENTS.md` manda PascalCase (`Account.ts`); skills mandam `account.entity.ts`, `create-account.use-case.ts`, etc.

**Escolha:** Seguir as skills `module-*`. Atualizar `AGENTS.md`/README na fase de docs (tarefa de apply).

**Assunção registrada:** na ausência de `skills-standards.md`, `module-aggregate` é a fonte de verdade de naming entre skills.

### D4 — Evoluir shared em vez de copiar Mentoria-360 cegamente

**Escolha:** Criar `packages/shared` migrando/evoluindo `src/shared` para a superfície exigida pelas skills (`Entity` com `tryCreate`/`cloneWith` ou equivalente, `Result` com `combine`/`validator`/`try` conforme necessário, `UseCase`, bases de repo). Remover ou deprecar `CommandHandler`/`QueryHandler` após migração dos contextos.

**Por quê:** Skills importam shared por pacote e assumem essas APIs; o shared atual é mais simples e incompatível nos detalhes.

**Alternativa:** Wrapper fino mantendo API antiga — rejeitada: skills e templates geram código contra a API Genérico.

**Compatibilidade:** Durante a migração incremental, permitir dual-support temporário (adapters de API) só se necessário para não migrar todos os contextos de uma vez; meta final é uma única API shared.

### D5 — Mapeamento legado → alvo por contexto

| Legado | Alvo |
| --- | --- |
| `src/shared/**` | `packages/shared/**` |
| `src/accounts/core/model/*` | `modules/account/src/<aggregate>/model/*.entity.ts` (+ VOs) |
| `src/accounts/core/ports/repositories/*` | `modules/account/src/<aggregate>/provider/*.repository.ts` |
| `src/accounts/core/commands/*` | `modules/account/src/<aggregate>/use-case/*.use-case.ts` |
| `src/accounts/core/queries/*` | `modules/account/src/<aggregate>/provider/*.query.ts` + `dto/` |
| `src/accounts/infra/database/**` | `apps/backend/src/modules/account/*.prisma.ts` (ou equivalente Nest) |
| `src/accounts/infra/controllers/**` | `apps/backend` controllers Nest |
| `src/accounts/infra/dtos/**` | DTOs de transporte HTTP em `apps/backend` **ou** reexport de `modules/.../dto` sem vazar ORM; preferir DTOs de domínio/query no módulo |
| `src/category/**` | `modules/category` + adapters em `apps/backend` (agregados `category`, `sub-category` se fizer sentido) |
| `src/transactions/**` | `modules/transaction` (agregados expense/income/transfer ou um agregado `transaction` — preferir espelhar o modelo de domínio atual sem inventar features) |
| `src/reporting/core/queries/*` + readers | Queries em `modules/reporting/.../provider` + adapters; composers/calculators puros → `*.service.ts` de domínio **ou** use case de leitura se agregarem várias queries |
| `src/reporting/core/service/*` | Avaliar: puro → domain service; orquestração multi-query → use case de leitura justificado |
| `src/entrypoint`, `src/main.ts` | `apps/backend` bootstrap Nest |
| `prisma/` | Permanecer na raiz ou sob `apps/backend` com `DATABASE_URL` estável; **sem** mudança de schema |

Agregados iniciais sugeridos (ajustáveis na implementação sem mudar specs):

- `account`: `account`
- `category`: `category` (subcategory como entidade aninhada ou agregado irmão, conforme modelo atual)
- `transaction`: manter operações Register/Edit como use cases; modelar entidades Expense/Income/Transfer conforme domínio atual
- `reporting`: agregados/features de leitura (`statement`, `breakdown`, `account-balance`) sem forçar CRUD

### D6 — CQRS: use case na escrita; query na leitura

**Escolha:** Seguir `module-query-cqrs`: controller chama Query direto; Reporting composto (breakdown/statement) pode usar use case de leitura **com comentário de justificativa** se continuar agregando múltiplas fontes.

**Alternativa:** Manter QueryHandler em todos os GETs — rejeitada por contrariar a skill.

### D7 — Package name do shared

**Escolha:** Pacote workspace local (ex.: `@finance-manager/shared`), não `@mentoria-360/shared` dos exemplos das skills.

**Por quê:** Skills dizem “resolved from `packages/shared/package.json`”; o nome Mentoria é do projeto de origem das skills.

### D8 — Ordem de migração

1. Workspace + `packages/shared` (bases exigidas pelas skills).
2. Esqueleto `apps/backend` movendo bootstrap Nest/Prisma sem mudar rotas.
3. `account` (menor superfície de escrita).
4. `category`.
5. `transaction`.
6. `reporting` (mais exceções de leitura composta).
7. Docs (`AGENTS.md`, README) + limpeza de `src/` legado.
8. Não criar `notifications` vazio.

Cada contexto: contratos no módulo → use cases/queries → adapter Prisma → controller → testes verdes → remover código legado do contexto.

### D9 — Testes

- Unitários de entidade/VO/use case/domain service em `modules/*/test/**` (Jest atual pode ser reconfigurado para o workspace).
- Mocks in-memory sob `test/**/mock/`.
- Controllers/adapters: manter cobertura equivalente aos `*.spec.ts` atuais; integração HTTP existente (`test:e2e` / specs de controller) deve continuar passando com a mesma API.
- Skills pedem `.http` de integração no Genérico; neste repo, **equivalente** = e2e/supertest já existente, sem obrigar nova stack `.http` nesta mudança (assunção).

## Risks / Trade-offs

- **[Risco] Quebra ampla ao mudar API do shared** → Mitigação: migrar shared com camada de compatibilidade temporária; um contexto por vez; suite de testes a cada etapa.
- **[Risco] Skill Genérico vs Nest single-app** → Mitigação: `apps/backend` continua Nest; módulos são libs TypeScript puras.
- **[Risco] Relocar `prisma/` quebra scripts/CI** → Mitigação: preferir manter `prisma/` na raiz na primeira onda; só mover se paths/scripts forem atualizados na mesma tarefa.
- **[Risco] Reporting “quase CQRS puro” vira use cases demais** → Mitigação: checklist da skill de query; justificar cada use case de leitura.
- **[Risco] `skills-standards.md` ausente** → Mitigação: documentar assunção (D3); não inventar o arquivo nesta mudança salvo necessidade de unificar naming.
- **[Trade-off] Monorepo aumenta complexidade de build/tsconfig** → Aceito para conformidade com as skills e o script de aggregate.

## Migration Plan

1. Introduzir pnpm workspaces e pacotes vazios/mínimos.
2. Migrar shared e fazer o app depender do pacote.
3. Mover Nest para `apps/backend` apontando para módulos (inicialmente ainda podem reexportar código legado).
4. Migrar contextos na ordem D8; após cada um, `pnpm test` + smoke HTTP.
5. Remover `src/` legado e referências `create-*` na documentação.
6. Rollback: git revert por PR/contexto; schema DB inalterado facilita rollback de código.

## Open Questions

Nenhum que altere specs ou a abordagem acima. Detalhes de quantos agregados dentro de `transaction`/`category` ficam para o apply, desde que respeitem `module-structure` e preservem regras atuais.
