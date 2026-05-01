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

## Comandos

- `pnpm install`: instala as dependências do projeto
- `nvm use`: para usar a versão correta do node.js
