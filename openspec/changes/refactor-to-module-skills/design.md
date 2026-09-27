# Design

## Context

Ver `proposal.md` (Why). Estado observado após o commit `1a04a95b`:

- **Kernel Genérico (adicionar/manter — fonte de verdade):** `src/shared/base/{aggregate-root,entity,message,metadata,result,result-error,result-validator,vo}.ts`, `src/shared/ValueObjects/id.vo.ts`, `src/shared/errors/{shared-errors,validation-error,validation-errors}.ts`, testes em `test/shared/**`. Skills `module-*` importam via `@/shared` (`@/*` → `src/*`) e rejeitam `packages/shared/package.json` / `CrudRepository` / `TransactionContext`.
- **Kernel e domínio legados (apagar):** shared PascalCase (`Entity.ts`, `Result.ts`, `AggregateRoot.ts`, `CommandHandler.ts`, `QueryHandler.ts`, `ValueObject.ts`, `Check.ts`, VOs `Money`/`Effectivated`/`ReportingPeriod`, etc.) e contextos `src/{accounts,category,transactions,reporting}` com CQRS legado.
- App Nest single-package ainda em `src/` + `src/main.ts`. O alvo deixou de ser `modules/` na raiz mais `apps/backend/`: domínio, adapters e testes ficam em `src/modules/<module>/`, e o bootstrap Nest permanece em `src/`.
- `AGENTS.md` ainda cita convenções PascalCase / skills `create-*` removidas.
- Arquivo `../skills-standards.md` **não existe**; naming autoritativo = skills `module-*`.
- **Nota de worktree:** o working tree pode estar com o kernel de `1a04a95b` ausente e o PascalCase presente (ou o inverso). O apply deve **restaurar/preservar** o tree do commit e só então executar o delete — esta sessão de planejamento **não** altera código.

## Goals / Non-Goals

**Goals:**

- Fixar a fonte de verdade do shared: kernel Genérico de `1a04a95b`.
- Remover implementações legadas que competem com esse kernel e com as skills.
- Recriar domínio e adapters Nest/Prisma/HTTP em `src/modules/<module>` sobre o kernel mantido.
- Registrar conflitos de convenção e a ordem keep → delete → rebuild.

**Non-Goals:**

- Aplicar keep/delete ou rebuild nesta sessão de planejamento.
- Novas features de produto ou mudanças de schema Prisma “de propósito”.
- Reescrever regras das skills `module-*` além do layout `src/modules/` já refletido nelas.
- Introduzir frontend; criar `src/modules/notifications` vazio.

## Decisions

### D1 — Kernel em `src/shared` via `@/shared` (não `packages/shared`)

**Escolha:** O kernel canônico permanece sob `src/shared/**`, importado exclusivamente pelo alias `@/shared`, como definido pelo commit `1a04a95b` e pelas skills.

**Por quê:** As skills atualizadas proíbem resolver pacote a partir de `packages/shared/package.json` e geram imports `@/shared/base/...`.

**Alternativa rejeitada:** Migrar shared para `packages/shared` e usar nome de pacote workspace — contradiz o commit e as skills atuais.

**Domínio / app:** O alvo é `src/modules/<module>/` para domínio, testes e adapters Prisma/HTTP. O bootstrap Nest permanece em `src/` (`main.ts` / entrypoint). O shared **não** se move para `packages/` nesta change.

### D2 — Nomes de módulos no singular inglês

**Escolha:** `account`, `category`, `transaction`, `reporting` (e `notifications` só com código).

**Por quê:** Skills exigem pastas kebab-case em inglês; singular alinha aos exemplos Genérico.

**Alternativa rejeitada:** Plurais legados (`accounts`, `transactions`).

### D3 — Nomenclatura de arquivos: skills vencem AGENTS.md

**Conflito:** `AGENTS.md` manda PascalCase; skills mandam `account.entity.ts`, etc.

**Escolha:** Seguir as skills `module-*`. Atualizar docs na fase de apply.

**Assunção:** na ausência de `skills-standards.md`, `module-aggregate` é a fonte de naming entre skills.

### D4 — Keep `1a04a95b` / delete o restante (substitui a deduplicação anterior)

**Decisão anterior (supersedida):** manter o kernel PascalCase do finance-manager e remover o kernel Genérico importado.

**Decisão atual:**

| Ação | Escopo |
| --- | --- |
| **KEEP** | Tudo que o commit `1a04a95b` adicionou: kernel Genérico listado no Context; `test/shared/**`; mudanças em `.agents/skills/module-*`; artefatos OpenSpec desta change; `mise.toml`; `uuid` em `package.json` / lockfile. |
| **DELETE** | Implementações pré-existentes **fora** desse commit: shared PascalCase e VOs/infra de domínio legado em `src/shared` que não foram adicionados por `1a04a95b`; código de negócio/app em `src/accounts`, `src/category`, `src/transactions`, `src/reporting` (core + infra + testes associados). |
| **Preservar além do commit (assunção explícita)** | Skills e OpenSpec; `src/shared/base/UseCase.ts` enquanto as skills ainda importarem `@/shared/base/UseCase` (arquivo pré-existente não recriado no commit); bootstrap Nest (`main`/entrypoint), `PrismaService`, schema/migrations Prisma e scripts mínimos de infra necessários para o rebuild — **não** os adapters/handlers dos contextos apagados. Outbox/events e enums de domínio legados entram no DELETE com os contextos, salvo dependência descoberta do kernel mantido (hoje o kernel Genérico não depende deles). |

**Por quê:** Uma única API shared alinhada às skills; evitar dual-kernel e migração “em cima” do CQRS legado.

**Alternativa rejeitada:** Evoluir/preservar o PascalCase e descartar o Genérico (dedup anterior).

**Ordenação:** keep/restore do tree de `1a04a95b` → delete do restante → só então scaffold/rebuild dos módulos. Tudo isso é trabalho de **apply** futuro, não desta sessão.

### D5 — Mapeamento legado → alvo (após delete)

| Antes (a remover ou já removido) | Alvo (rebuild) |
| --- | --- |
| Kernel PascalCase em `src/shared` | *apagado*; kernel Genérico de `1a04a95b` permanece |
| Kernel Genérico `src/shared` (kebab-case) | **mantido** in loco via `@/shared` |
| `src/accounts/**` | Recriar `src/modules/account` (domínio + adapters) |
| `src/category/**` | Recriar `src/modules/category` (domínio + adapters) |
| `src/transactions/**` | Recriar `src/modules/transaction` (domínio + adapters) |
| `src/reporting/**` | Recriar `src/modules/reporting` (domínio + adapters) |
| `src/entrypoint`, `src/main.ts` | Permanecer em `src/` como bootstrap Nest, sem mudar contrato HTTP final |
| `prisma/` | Permanecer na raiz (preferência 1ª onda); **sem** mudança de schema de propósito |

Agregados iniciais (ajustáveis no apply): `account`; `category` (+ subcategory conforme modelo); `transaction` (expense/income/transfer); `reporting` (leituras statement/breakdown/balance).

### D6 — CQRS: use case na escrita; query na leitura

**Escolha:** Seguir `module-query-cqrs`: controller chama Query direto; reporting composto MAY usar use case de leitura **com comentário de justificativa**.

### D7 — Package name do shared

**Escolha:** Não introduzir pacote `@finance-manager/shared` / `@mentoria-360/shared` nesta change. Consumers usam `@/shared/...`.

### D8 — Ordem de migração (apply)

1. Garantir presença do tree adicionado por `1a04a95b` (restore se o worktree o removeu).
2. Delete do restante das implementações (D4).
3. Esqueleto `src/modules/*` (domínio, testes e adapters) com bootstrap Nest em `src/`, sem inventar features.
4. Recriar `account` → `category` → `transaction` → `reporting` via skills.
5. Docs (`AGENTS.md`, README) + limpeza final.
6. Não criar `notifications` vazio.

### D9 — Testes

- Testes do kernel mantido: `test/shared/**` (já no commit).
- Unitários de módulo em `src/modules/*/test/**`.
- Equivalência HTTP via e2e/supertest existente após rebuild; skills pedem `.http` no Genérico — **equivalente** = e2e atual (assunção).

## Risks / Trade-offs

- **[Risco] Delete remove a API HTTP temporariamente** → Mitigação: rebuild por contexto; meta de equivalência só no fim; não declarar a change concluída com endpoints quebrados.
- **[Risco] Worktree já divergiu de `1a04a95b`** → Mitigação: primeira tarefa de apply = restaurar arquivos KEEP do commit.
- **[Risco] Skills ainda importam `UseCase` PascalCase** → Mitigação: preservar `UseCase.ts` (D4) ou alinhar path no apply sem reescrever skills além do necessário.
- **[Risco] Perda de regras de negócio ao apagar contextos** → Mitigação: usar git history / specs de comportamento HTTP existentes como referência ao recriar; sem mudança intencional de regras.
- **[Risco] Relocar `prisma/` quebra CI** → Mitigação: manter na raiz na 1ª onda.
- **[Trade-off] Rebuild vs migrate-in-place** → Aceito: delete + skills é mais simples que dual-kernel.

## Migration Plan

1. Restore/keep arquivos de `1a04a95b` (kernel + testes shared).
2. Delete implementações legadas (D4) — **somente no apply**.
3. Introduzir `src/modules/` mínimo, com bootstrap Nest ainda em `src/`.
4. Recriar contextos na ordem D8; `pnpm test` + smoke HTTP por etapa quando houver endpoints de novo.
5. Atualizar docs; limpar restos.
6. Rollback: git revert / checkout dos paths apagados; schema DB inalterado facilita rollback.

## Open Questions

Nenhum que altere a decisão keep/delete. Detalhes de quantos agregados dentro de `transaction`/`category` ficam para o apply, desde que respeitem as specs e o kernel mantido. O bootstrap Nest permanece em `src/`; adapters e controllers do módulo vivem em `src/modules/<module>/`.
