# Spec Delta

## Purpose

Define os padrões de escrita (comando) do domínio e da aplicação: Entity, Value Object, Repository, Use Case, Domain Service e Result, conforme as skills `module-entity`, `module-value-object`, `module-repository`, `module-use-case` e `module-domain-service`.

## ADDED Requirements

### Requirement: Kernel compartilhado em packages/shared

O projeto MUST fornecer bases de domínio/aplicação em `packages/shared`, importáveis pelos módulos sem caminhos relativos para dentro do pacote shared. O kernel MUST incluir, no mínimo, contratos/classes alinhados às skills: `Entity`, `ValueObject`, `Result`, `UseCase`, e bases de repositório CRUD quando aplicáveis (`CrudRepository` ou equivalentes documentados nas skills).

Entidades de módulo MUST estender `Entity` do shared. Value Objects MUST estender `ValueObject` do shared. Use cases MUST implementar `UseCase<IN, OUT>` com `execute` retornando `Promise<Result<OUT>>`.

#### Scenario: Módulo importa shared por pacote

- **WHEN** uma entidade ou use case de `modules/<module>` referencia tipos base
- **THEN** a importação usa o pacote shared do workspace (não `../../packages/shared/...` relativo)
- **AND** o contrato de use case expõe `execute` assíncrono retornando `Result`

### Requirement: Entidades com create/tryCreate e Result

Entidades de domínio MUST:

- definir `Props` tipados;
- usar construtor `private` ou `protected`;
- expor `static create` (falha via throw após validação) e `static tryCreate` retornando `Result`;
- validar invariantes com Value Objects e `Result.combine` quando houver múltiplas validações;
- persistir em `props` apenas valores normalizados;
- evitar setters mutáveis públicos; usar métodos de domínio e/ou `cloneWith` (ou equivalente do shared) para mudanças de estado.

Testes de entidade MUST cobrir criação válida, inválida, igualdade por `id` e atualização via clone/validação.

#### Scenario: Criação inválida de entidade

- **WHEN** `tryCreate` recebe props que violam invariantes
- **THEN** retorna `Result` em falha com erros
- **AND** `create` lança ao receber as mesmas props

### Requirement: Value Objects com create/tryCreate

Value Objects MUST ser imutáveis, validar no `tryCreate`, normalizar entrada quando fizer sentido, e expor `create`/`tryCreate` com códigos de erro estáticos legíveis. VOs globais MUST viver em `packages/shared`; VOs específicos de domínio MUST viver em `modules/<module>/src/<feature>/model/<name>.vo.ts` com testes sob `modules/<module>/test/`.

#### Scenario: VO rejeita valor inválido

- **WHEN** `tryCreate` recebe valor que viola o invariante
- **THEN** retorna falha com código de erro estático do VO
- **AND** o valor armazenado em sucesso está normalizado (ex.: trim)

### Requirement: Repositórios no provider e adapters na infra

Contratos de repositório MUST residir em `modules/<module>/src/<aggregate>/provider/*.repository.ts`, tipando operações com `Promise<Result<...>>`. Implementações Prisma (ou outro adapter) MUST residir em `apps/backend`, mapear com `toDomain`/`fromDomain`, e NÃO vazar tipos de ORM para o domínio. Repositório é caminho de escrita/leitura orientada a entidade; NÃO MUST retornar DTO de projeção de API no lugar de entidade quando o contrato for de comando.

Mocks in-memory MUST implementar o mesmo contrato e viver sob `modules/<module>/test/**/mock/`.

#### Scenario: Contrato vs adapter

- **WHEN** um use case de escrita persiste um agregado
- **THEN** depende apenas da interface em `provider/*.repository.ts`
- **AND** a implementação Prisma em `apps/backend` retorna `Result` e mapeia entidade sem expor o client Prisma ao módulo

### Requirement: Use cases orquestram escrita

Operações de escrita (create/update/delete e comandos equivalentes legados) MUST ser implementadas como use cases em `modules/<module>/src/<aggregate>/use-case/*.use-case.ts`, implementando `UseCase<IN, OUT>`. O use case MUST orquestrar providers/repositórios/queries, delegar invariantes a entidades/VOs, e tratar falhas com early return via `Result.fail` / `withFail` (ou equivalente do shared). O use case NÃO MUST conter I/O direto de Prisma/HTTP.

Handlers legados `CommandHandler` MUST ser substituídos por use cases equivalentes semanticamente.

#### Scenario: Use case de criação com falha de domínio

- **WHEN** a entidade falha em `tryCreate`
- **THEN** o use case retorna `Result` de falha sem chamar persistência
- **AND** não lança exceção no fluxo normal de validação de domínio

### Requirement: Domain services puros

Serviços de domínio MUST existir apenas sob `modules/*/src/**` (arquivos `*.service.ts`), encapsular regras que não cabem em uma única entidade/VO, e NÃO depender de Nest, HTTP, Prisma, filesystem ou estado global. Serviços atuais de reporting que são pura composição/cálculo MUST ser classificados como domain services se permanecerem no módulo; lógica de projeção que cabe em SQL MUST migrar para o lado de leitura (ver capability `module-read-side`).

#### Scenario: Domain service sem I/O

- **WHEN** um domain service é executado em teste unitário
- **THEN** produz saída determinística a partir das entradas de domínio
- **AND** não importa adapters de `apps/backend` nem clients de banco
