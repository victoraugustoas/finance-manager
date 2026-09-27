# Tasks

## 0. Keep `1a04a95b` / delete implementações legadas (apply futuro)

- [x] 0.1 Garantir no worktree a presença de tudo que o commit `1a04a95b` adicionou (kernel Genérico em `src/shared/**` kebab-case, `test/shared/**`, skills `module-*`, `mise.toml`, `uuid`); restaurar do commit se estiver ausente; verificar diff contra `1a04a95b` nos paths KEEP
- [x] 0.2 Remover o kernel/shared legado fora desse commit (PascalCase `Entity`/`Result`/`AggregateRoot`/`CommandHandler`/`QueryHandler`/`Check`/`ValueObject`, VOs `Money`/`Effectivated`/`ReportingPeriod`, `MapResultErrorToHttpException` e correlatos não usados pelo kernel Genérico); preservar `UseCase.ts` enquanto as skills importarem `@/shared/base/UseCase`; verificar que imports `@/shared` resolvem o kernel Genérico
- [x] 0.3 Remover implementações de domínio/app legadas em `src/accounts`, `src/category`, `src/transactions`, `src/reporting` (core, infra, testes associados) e wiring que só sirva a esses contextos; preservar bootstrap Nest, `PrismaService`, schema/migrations Prisma e scripts mínimos; verificar build do app sem esses contextos (falhas de rota esperadas até o rebuild)
- [x] 0.4 Confirmar que skills OpenSpec e `.agents/skills/module-*` permanecem intactas nesta etapa; verificar `pnpm test` dos testes em `test/shared/**` passando

## 1. Layout `src/modules`

- [x] 1.1 Criar estrutura `src/modules/` (domínio em `<aggregate>/`, adapters em `infra/<aggregate>/`, testes em `test/`) mantendo o bootstrap Nest em `src/main.ts` / entrypoint, sem `apps/backend` e sem alterar schema Prisma; verificar app sobe
- [x] 1.2 Apontar tsconfig/jest/paths para `@/shared` → `src/*` e consumers em `src/modules/*`; verificar resolução TypeScript
- [x] 1.3 Manter `prisma/` utilizável (raiz preferencial na 1ª onda) e `DATABASE_URL`; verificar `pnpm prisma:generate`

## 2. Módulo account (rebuild via skills)

- [x] 2.1 Criar `src/modules/account` com `index.ts` e agregado `account` (`model`, `provider`, `use-case`, `dto`) via skill `module-aggregate`; verificar estrutura
- [x] 2.2 Implementar entidade/VOs de conta (`*.entity.ts`/`*.vo.ts`) sobre o kernel Genérico; verificar testes
- [x] 2.3 Contrato `account/provider/*.repository.ts` + adapter em `src/modules/account/infra/account/provider/prisma-account.repository.ts` + mock in-memory em `src/modules/account/test/`; verificar testes
- [x] 2.4 Use cases de escrita (ex.: create-account); verificar testes de use case
- [x] 2.5 Leituras do contexto (se houver) via `account/provider/*.query.ts`, implementação em `infra/account/provider/prisma-*.query.ts` e controller em `infra/account/account.controller.ts`; verificar equivalência HTTP do contexto account
- [x] 2.6 Garantir ausência de restos `src/accounts`; verificar build/test sem imports quebrados

## 3. Módulo category

- [x] 3.1 Criar `src/modules/category` e modelo Category/SubCategory; verificar testes de domínio
- [x] 3.2 Repositório + adapter em `src/modules/category/infra/<aggregate>/provider/` + mocks; verificar testes
- [x] 3.3 Use cases de criação (category/sub-category); verificar testes
- [x] 3.4 Queries de listagem income/expense em `<aggregate>/provider/` com implementação em `infra/<aggregate>/provider/prisma-*.query.ts` e controller em `infra/<aggregate>/`; verificar `GET/POST` de categories equivalentes
- [x] 3.5 Garantir ausência de `src/category`; verificar suite do contexto

## 4. Módulo transaction

- [x] 4.1 Criar `src/modules/transaction` e entidades Expense/Income/Transfer; verificar testes de domínio
- [x] 4.2 Providers/repositórios + adapters em `src/modules/transaction/infra/<aggregate>/provider/`; verificar mocks e testes
- [x] 4.3 Use cases Register/Edit; verificar testes
- [x] 4.4 Queries de listagem em `<aggregate>/provider/` com implementação em `infra/<aggregate>/provider/prisma-*.query.ts` e controller em `infra/<aggregate>/`; verificar `GET/POST/PUT` de `/transactions/*` equivalentes
- [x] 4.5 Garantir ausência de `src/transactions`; verificar suite do contexto

## 5. Módulo reporting

- [x] 5.1 Criar `src/modules/reporting`; classificar calculators/composers como domain service vs use case de leitura justificado; verificar testes
- [x] 5.2 Queries ListAccounts/Breakdown/Statement + DTOs (use case de leitura só com justificativa); verificar testes
- [x] 5.3 Adapters em `src/modules/reporting/infra/<aggregate>/provider/`, controllers em `infra/<aggregate>/` e módulo Nest em `infra/reporting.module.ts`; verificar endpoints `/reporting/*` equivalentes
- [x] 5.4 Garantir ausência de `src/reporting`; verificar suite do contexto

## 6. Docs e integração

- [x] 6.1 Remover quaisquer restos de `CommandHandler`/`QueryHandler` e shared legado não preservado; verificar nenhum import para paths apagados
- [x] 6.2 Atualizar `AGENTS.md` e README: kernel `@/shared`, layout `src/modules/` com infra espelhada em `infra/<aggregate>/`, bootstrap Nest em `src/`, nomenclatura kebab-case, skills `module-*`, decisão keep/delete; verificar docs (skill `update-readme`)
- [x] 6.3 Rodar `pnpm lint`, `pnpm test`, smoke e2e dos endpoints públicos; verificar verde sem mudança intencional de contrato HTTP/schema
