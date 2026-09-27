# Tasks

## 1. Workspace e packages/shared

- [ ] 1.1 Configurar pnpm workspaces (`packages/*`, `modules/*`, `apps/*`) e criar `packages/shared/package.json` com nome local (ex.: `@finance-manager/shared`); verificar com `pnpm install` sem erro
- [ ] 1.2 Migrar/evoluir bases de `src/shared` para `packages/shared` alinhadas às skills (`Entity` com `create`/`tryCreate`/`cloneWith` ou equivalente, `ValueObject`, `Result` com `combine`/`ok`/`fail`, `UseCase`, bases de repositório CRUD quando aplicável); verificar testes unitários do shared passando
- [ ] 1.3 Expor exports públicos do shared e garantir que imports usam o pacote (não path relativo para dentro de `packages/shared`); verificar TypeScript resolve o pacote a partir de um consumer de teste

## 2. App Nest em apps/backend

- [ ] 2.1 Criar `apps/backend` movendo bootstrap Nest (`main.ts`, módulos de entrypoint, wiring Prisma/config) sem alterar rotas HTTP; verificar `pnpm start`/`build` do app
- [ ] 2.2 Apontar paths/tsconfig/jest do monorepo para `apps/backend` + `packages/shared`; verificar `pnpm test` da suíte existente ainda executa (mesmo que parte do domínio ainda esteja em `src/` temporariamente)
- [ ] 2.3 Manter `prisma/` utilizável (raiz preferencial na primeira onda) e `DATABASE_URL`; verificar `pnpm prisma:generate` funciona

## 3. Módulo account

- [ ] 3.1 Criar `modules/account` com `src/index.ts` e agregado `account` (`model`, `provider`, `use-case`, `dto`); verificar estrutura conforme `module-structure`
- [ ] 3.2 Migrar entidade/VOs de conta para `*.entity.ts`/`*.vo.ts` com `create`/`tryCreate`; verificar testes de entidade/VO
- [ ] 3.3 Migrar contrato de repositório para `provider/*.repository.ts` e adapter Prisma para `apps/backend`; verificar testes do repositório/mock in-memory em `modules/account/test/**/mock`
- [ ] 3.4 Substituir `CreateAccount` CommandHandler por `create-account.use-case.ts` (e demais escritas do contexto); verificar testes de use case
- [ ] 3.5 Migrar leituras do contexto account (se houver) para `*.query.ts` + DTOs; controller chama query/use case conforme lado; verificar `POST /accounts` (e GETs do contexto) equivalentes
- [ ] 3.6 Remover código legado de `src/accounts` após wiring; verificar build/test sem imports quebrados

## 4. Módulo category

- [ ] 4.1 Criar `modules/category` e migrar modelo Category/SubCategory para `model/` com nomenclatura das skills; verificar testes de domínio
- [ ] 4.2 Migrar repositório + adapter Prisma; verificar mocks in-memory e testes de persistência
- [ ] 4.3 Migrar `CreateCategory`/`CreateSubCategory` para use cases; verificar testes de use case
- [ ] 4.4 Migrar `ListIncomeCategories`/`ListExpenseCategories` para Query + DTO + chamada direta no controller; verificar `GET /categories/income`, `GET /categories/expense`, `POST /categories`, `POST /categories/:categoryId/subcategories`
- [ ] 4.5 Remover `src/category` legado; verificar suite verde no contexto

## 5. Módulo transaction

- [ ] 5.1 Criar `modules/transaction` e migrar entidades Expense/Income/Transfer (e eventos de domínio se existirem) para o layout de agregado; verificar testes de domínio
- [ ] 5.2 Migrar repositórios/ACL/readers de escrita para `provider` + adapters em `apps/backend`; verificar mocks e testes
- [ ] 5.3 Migrar `RegisterExpense`/`RegisterIncome`/`RegisterTransfer`/`EditTransaction` para use cases; verificar testes de use case
- [ ] 5.4 Migrar listagens para Query + DTO; controller sem QueryHandler legado; verificar `GET/POST/PUT` de `/transactions/*` equivalentes
- [ ] 5.5 Remover `src/transactions` legado; verificar suite verde no contexto

## 6. Módulo reporting

- [ ] 6.1 Criar `modules/reporting` e classificar `AccountBalanceCalculator`/`BreakdownCategoriesComposer`: domain service puro vs use case de leitura justificado; verificar testes unitários correspondentes
- [ ] 6.2 Migrar queries `ListAccounts`/`BreakdownCategories`/`Statement` para contratos `*.query.ts` + DTOs (e use case de leitura só se a exceção da skill se aplicar, com comentário); verificar testes
- [ ] 6.3 Implementar adapters Prisma/readers em `apps/backend` e wiring dos controllers; verificar `GET /reporting/accounts`, `GET /reporting/categories/breakdown`, `GET /reporting/statement`
- [ ] 6.4 Remover `src/reporting` legado; verificar suite verde no contexto

## 7. Limpeza, docs e integração

- [ ] 7.1 Remover `CommandHandler`/`QueryHandler` e restos de `src/shared`/`src/` legado não usados; verificar que nenhum import aponta para paths antigos
- [ ] 7.2 Atualizar `AGENTS.md` e README: layout `modules/`/`packages/shared`/`apps/backend`, nomenclatura kebab-case das skills, referências às skills `module-*` no lugar das `create-*` removidas; verificar docs batem com `package.json` e árvore real (skill `update-readme`)
- [ ] 7.3 Rodar integração ampla: `pnpm lint`, `pnpm test`, smoke e2e dos endpoints públicos listados nas specs; verificar tudo verde sem mudança intencional de contrato HTTP/schema
