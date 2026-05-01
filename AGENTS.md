# Project overview

## Briefing

Este projeto é um gerenciador financeiro pessoal.
Capaz de registrar despesas, receitas e transferências entre contas.
Gerar análises financeiras como gráficos de onde os maiores gastos e receitas estão,
permitindo que o usuário tenha uma visão holística da sua vida financeira.

## Organização do projeto

O projeto será construído utilizando princípios da arquitetura limpa e
DDD (Domain Driven Design). Será escrito em typescript.

### Tecnologias utilizadas

- Typescript (v6)
- Node.js (.nvmrc)
- NestJS
- PostgreSQL
- Prisma
- Eslint
- Prettier
- Pnpm as a package manager

### Casos de uso

Cada contexto terá a sua pasta de casos de uso definido em `src/{context}/core/definitions/UseCasesDefinitions.md`.
Esse arquivo conterá a descrição dos casos de uso assim como as regras de negócio associadas.

### Contextos delimitados

Teremos contextos delimitados para definir as funcionalidades do sistema.

#### Account

Responsável pelo ciclo de vida das contas financeiras.

#### Transaction

Gerencia despesas, receitas e transferências.

#### Category

Gerencia categorias de despesas e receitas.

#### Notifications

Contexto reativo, acionado por eventos.

### Shared folder

A pasta shared conterá bases utilizadas em diversos contextos.

- UseCase: classe abstrata para os casos de uso.
- Result: classe para encapsular os resultados.
- ValueObject: classe para representar valores.
- Entity: classe para representar entidades.
- RootAggregate: classe para representar os agregados.****

### Convenção de nomeação de arquivos

Arquivos de componentes de código (classes, entidades, value objects, aggregates, use cases, etc.) devem usar **PascalCase**.

Exemplos: `Account.ts`, `Category.ts`, `SubCategory.ts`, `AggregateRoot.ts`, `Money.ts`, `Result.ts`.

Arquivos de teste seguem o mesmo padrão com sufixo `.spec.ts`: `Account.spec.ts`, `Money.spec.ts`.

Exceções: `index.ts` (barrel files) permanecem em lowercase.

## Comandos

- instala o node.js

```bash
nvm install
```

- para usar a versão correta do node.js

```bash
nvm use
```

- habilita o uso do corepack

```bash
npm install -g corepack && corepack enable
```

- instala as dependências do projeto

```bash
pnpm install
```

## Cursor Cloud specific instructions

- O projeto está em fase inicial de domínio (DDD). Não existe `src/main.ts` nem controllers NestJS, portanto `pnpm start:dev` ainda não funciona. Os comandos válidos atualmente são `pnpm test`, `pnpm lint`, `pnpm build` e `pnpm format`.
- Prisma está declarado como dependência mas **não existe** `prisma/schema.prisma` nem migrações. Os scripts `prisma:generate` e `prisma:migrate` só funcionarão após a criação do schema.
- PostgreSQL será necessário quando a camada de infraestrutura for implementada. A string de conexão padrão está em `.env.example`.
- O Prisma 7 não suporta oficialmente o Node.js 25 (apenas 20.19+, 22.12+, 24.0+), mas funciona sem problemas para build/test. Ignore o warning do preinstall.
- Foram adicionadas as dependências `@eslint/js` e `typescript-eslint` ao `package.json` pois o `eslint.config.mjs` as importa mas não estavam declaradas — essas dependências são necessárias para `pnpm lint` funcionar.
- A configuração `pnpm.onlyBuiltDependencies` foi adicionada ao `package.json` para permitir build scripts de `@nestjs/core`, `@prisma/engines`, `prisma`, `unrs-resolver` e `inotify` sem necessidade de aprovação interativa.
- Para referência rápida dos scripts disponíveis, consulte o `package.json` na seção `scripts`.
