# Spec Delta

## Purpose

Define o lado de leitura CQRS: contratos Query, DTOs de projeção, implementação no adapter e chamada direta pelo controller, conforme as skills `module-query-cqrs` e `module-dto`, preservando a API HTTP pública.

## ADDED Requirements

### Requirement: Separação comando versus leitura

Leitura voltada a API/projeção MUST usar contratos Query e NÃO MUST passar pela entidade de domínio nem, por padrão, por use case. Escrita MUST continuar em Entity + Repository + Use Case. Carregar entidade via Repository é permitido apenas quando a leitura serve a invariantes de um comando.

#### Scenario: Listagem não instancia entidade

- **WHEN** um endpoint de listagem/detalhe de leitura é atendido
- **THEN** o fluxo usa interface `*Query` e mapeia linhas para DTO
- **AND** não chama `Entity.tryCreate` / `create` só para montar a resposta

### Requirement: Contratos Query e DTOs no módulo

Interfaces de query MUST viver em `modules/<module>/src/<aggregate>/provider/<nome>.query.ts` com assinatura `execute(input) => Promise<Result<DTO>>`. DTOs de entrada/saída/projeção MUST viver em `modules/<module>/src/<aggregate>/dto/`. O comentário da interface Query MUST documentar filtros, ordenação, paginação e quando retorna `null`.

DTOs MUST:

- distinguir Input, Output e Query/projeção conforme o consumidor;
- não estender a classe da entidade;
- não acoplar a tipos Prisma/ORM;
- poder derivar de `*Props` com `Omit`/`Pick` ou ser tipos independentes.

#### Scenario: Query de listagem tipada

- **WHEN** uma listagem migrada é definida
- **THEN** existe interface `*Query` em `provider/` com `execute` retornando `Result` de DTO
- **AND** os DTOs estão em `dto/` sem importar o client Prisma

### Requirement: Implementação no adapter e controller

A implementação da query MUST residir no adapter de infraestrutura do agregado em `apps/backend` (ex.: atributo público tipado na classe Prisma do agregado). O controller MUST converter parâmetros HTTP no DTO de entrada, chamar a query diretamente e mapear `isFailure` / `null` para resposta HTTP equivalente à API atual.

Handlers legados `QueryHandler` usados só para projetar leitura MUST ser removidos ou reduzidos às exceções abaixo.

Complexidade de leitura (filtros, ordenação, agregações, campos derivados) MUST ser resolvida no SQL/consulta sempre que fizer sentido; NÃO MUST criar domain service só para campo de projeção.

#### Scenario: Controller de leitura chama query

- **WHEN** um GET de listagem migrado é invocado
- **THEN** o controller chama `*.execute(...)` da query do adapter
- **AND** não instancia use case de leitura, salvo exceção justificada

### Requirement: Use case de leitura somente por exceção

Use case `find-*.use-case.ts` de leitura MUST ser criado somente quando:

- há muitas regras que não cabem em SQL sem duplicar domínio existente; ou
- é preciso agregar várias queries distintas em um único resultado.

Nesses casos, o use case MUST receber queries por parâmetro, NÃO MUST usar entidade nem repository de escrita, e MUST registrar em comentário a justificativa. Reporting composto (ex.: breakdown/statement que hoje combina readers/composers) MAY usar use case de leitura se a agregação de múltiplas queries for a justificativa.

#### Scenario: Painel que agrega várias queries

- **WHEN** um relatório precisa combinar resultados de queries distintas que não cabem em uma única consulta SQL estável
- **THEN** um use case de leitura pode orquestrar essas queries
- **AND** um comentário no arquivo justifica a exceção

### Requirement: Equivalência dos endpoints de leitura existentes

Os endpoints HTTP de leitura já expostos MUST permanecer equivalentes após a migração:

- `GET /accounts` (se aplicável via reporting/accounts)
- `GET /categories/income`, `GET /categories/expense`
- `GET /transactions/expenses`, `GET /transactions/incomes`, `GET /transactions/transfers`
- `GET /reporting/accounts`, `GET /reporting/categories/breakdown`, `GET /reporting/statement`

(e demais GETs públicos existentes no momento da migração).

#### Scenario: Breakdown de categorias

- **WHEN** `GET /reporting/categories/breakdown` é chamado com os mesmos filtros de antes
- **THEN** o shape público da resposta e o status HTTP permanecem equivalentes
- **AND** a implementação interna usa Query/DTO (e use case de leitura só se a exceção se aplicar)
