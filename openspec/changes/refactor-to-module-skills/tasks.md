# Tasks

## 0. Keep `1a04a95b` / delete implementações legadas (apply futuro)

- [ ] 0.1 Garantir no worktree a presença de tudo que o commit `1a04a95b` adicionou (kernel Genérico em `src/shared/**` kebab-case, `test/shared/**`, skills `module-*`, `mise.toml`, `uuid`); restaurar do commit se estiver ausente; verificar diff contra `1a04a95b` nos paths KEEP
- [ ] 0.2 Remover o kernel/shared legado fora desse commit (PascalCase `Entity`/`Result`/`AggregateRoot`/`CommandHandler`/`QueryHandler`/`Check`/`ValueObject`, VOs `Money`/`Effectivated`/`ReportingPeriod`, `MapResultErrorToHttpException` e correlatos não usados pelo kernel Genérico); preservar `UseCase.ts` enquanto as skills importarem `@/shared/base/UseCase`; verificar que imports `@/shared` resolvem o kernel Genérico
- [ ] 0.3 Remover implementações de domínio/app legadas em `src/accounts`, `src/category`, `src/transactions`, `src/reporting` (core, infra, testes associados) e wiring que só sirva a esses contextos; preservar bootstrap Nest, `PrismaService`, schema/migrations Prisma e scripts mínimos; verificar build do app sem esses contextos (falhas de rota esperadas até o rebuild)
- [ ] 0.4 Confirmar que skills OpenSpec e `.agents/skills/module-*` permanecem intactas nesta etapa; verificar `pnpm test` dos testes em `test/shared/**` passando

## 1. Layout modules + apps/backend

- [ ] 1.1 Criar estrutura `modules/` e `apps/backend` (bootstrap Nest movido/adaptado de `main`/entrypoint) sem alterar schema Prisma; verificar app sobe
- [ ] 1.2 Apontar tsconfig/jest/paths para `@/shared` → `src/*` e consumers em `modules/*` + `apps/backend`; verificar resolução TypeScript
- [ ] 1.3 Manter `prisma/` utilizável (raiz preferencial na 1ª onda) e `DATABASE_URL`; verificar `pnpm prisma:generate`

## 2. Módulo account (rebuild via skills)

- [ ] 2.1 Criar `modules/account` com `src/index.ts` e agregado `account` (`model`, `provider`, `use-case`, `dto`) via skill `module-aggregate`; verificar estrutura
- [ ] 2.2 Implementar entidade/VOs de conta (`*.entity.ts`/`*.vo.ts`) sobre o kernel Genérico; verificar testes
- [ ] 2.3 Contrato `provider/*.repository.ts` + adapter Prisma em `apps/backend` + mock in-memory; verificar testes
- [ ] 2.4 Use cases de escrita (ex.: create-account); verificar testes de use case
- [ ] 2.5 Leituras do contexto (se houver) via `*.query.ts` + DTOs; verificar equivalência HTTP do contexto account
- [ ] 2.6 Garantir ausência de restos `src/accounts`; verificar build/test sem imports quebrados

## 3. Módulo category

- [ ] 3.1 Criar `modules/category` e modelo Category/SubCategory; verificar testes de domínio
- [ ] 3.2 Repositório + adapter Prisma + mocks; verificar testes
- [ ] 3.3 Use cases de criação (category/sub-category); verificar testes
- [ ] 3.4 Queries de listagem income/expense + DTOs; verificar `GET/POST` de categories equivalentes
- [ ] 3.5 Garantir ausência de `src/category`; verificar suite do contexto

## 4. Módulo transaction

- [ ] 4.1 Criar `modules/transaction` e entidades Expense/Income/Transfer; verificar testes de domínio
- [ ] 4.2 Providers/repositórios + adapters; verificar mocks e testes
- [ ] 4.3 Use cases Register/Edit; verificar testes
- [ ] 4.4 Queries de listagem + DTOs; verificar `GET/POST/PUT` de `/transactions/*` equivalentes
- [ ] 4.5 Garantir ausência de `src/transactions`; verificar suite do contexto

## 5. Módulo reporting

- [ ] 5.1 Criar `modules/reporting`; classificar calculators/composers como domain service vs use case de leitura justificado; verificar testes
- [ ] 5.2 Queries ListAccounts/Breakdown/Statement + DTOs (use case de leitura só com justificativa); verificar testes
- [ ] 5.3 Adapters em `apps/backend` + controllers; verificar endpoints `/reporting/*` equivalentes
- [ ] 5.4 Garantir ausência de `src/reporting`; verificar suite do contexto

## 6. Docs e integração

- [ ] 6.1 Remover quaisquer restos de `CommandHandler`/`QueryHandler` e shared legado não preservado; verificar nenhum import para paths apagados
- [ ] 6.2 Atualizar `AGENTS.md` e README: kernel `@/shared`, `modules/`/`apps/backend`, nomenclatura kebab-case, skills `module-*`, decisão keep/delete; verificar docs (skill `update-readme`)
- [ ] 6.3 Rodar `pnpm lint`, `pnpm test`, smoke e2e dos endpoints públicos; verificar verde sem mudança intencional de contrato HTTP/schema
