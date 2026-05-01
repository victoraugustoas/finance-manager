# Skill: Manter o README.md atualizado

## Quando usar

Esta skill deve ser usada **ao final de qualquer tarefa** que altere um dos seguintes aspectos do projeto:

- Estrutura de pastas ou módulos (`src/`)
- Dependências (`package.json`)
- Scripts disponíveis (`package.json` → `scripts`)
- Contextos delimitados (Account, Transaction, Category, Notifications ou novos)
- Variáveis de ambiente (`.env.example`)
- Convenções do projeto (nomeação, arquitetura, padrões)
- Configurações de infraestrutura (Docker, Prisma, banco de dados)
- Git hooks ou CI/CD

## Objetivo

O `README.md` é o ponto de entrada para qualquer desenvolvedor. Ele deve refletir **fielmente** o estado atual do projeto para que um novo contribuidor consiga entender, instalar e rodar o projeto sem precisar perguntar.

## Estrutura esperada do README.md

O README.md deve conter as seguintes seções, nesta ordem:

```markdown
# Finance Manager

Breve descrição do projeto (1-2 frases).

## Tecnologias

Tabela ou lista das tecnologias principais com versões.

## Pré-requisitos

O que é necessário ter instalado antes de começar (Node.js, pnpm, PostgreSQL, etc).

## Instalação

Passo a passo para instalar e configurar o projeto localmente.

## Scripts disponíveis

Tabela com todos os scripts do `package.json` e uma breve descrição de cada um.

## Estrutura do projeto

Árvore de diretórios com descrição de cada pasta/contexto relevante.

## Arquitetura

Breve explicação da arquitetura (Clean Architecture + DDD), contextos delimitados e como se organizam.

## Convenções

Convenções de código adotadas (nomeação de arquivos, formatação, etc).

## Variáveis de ambiente

Lista das variáveis com descrição, baseada no `.env.example`.

## Git Hooks

Descrição dos hooks configurados e o que cada um faz.

## CI/CD

Descrição do pipeline de integração contínua.
```

## Como executar esta skill

### 1. Coletar informações atualizadas

Leia os seguintes arquivos para obter o estado atual do projeto:

- `package.json` — scripts, dependências e versões
- `.nvmrc` — versão do Node.js
- `.env.example` — variáveis de ambiente
- `AGENTS.md` — visão geral do projeto, contextos e convenções
- `tsconfig.json` — configuração do TypeScript
- `.githooks/` — hooks de git configurados
- `.github/workflows/` — pipelines de CI/CD

### 2. Mapear a estrutura de diretórios

Liste os diretórios e arquivos dentro de `src/` para refletir a árvore de pastas atual. Inclua apenas diretórios e arquivos relevantes (ignore `node_modules`, `dist`, `coverage`).

### 3. Atualizar o README.md

Com base nas informações coletadas, atualize **apenas as seções que mudaram**. Não reescreva seções que já estão corretas.

Regras:
- Use português brasileiro
- Seja conciso e direto
- Use tabelas para listas com mais de 3 itens (scripts, variáveis, tecnologias)
- Versões devem vir do `package.json` ou `.nvmrc`, nunca hardcoded
- Comandos devem ser copiáveis (blocos de código com `bash`)
- Não inclua informações especulativas — documente apenas o que já existe no código

### 4. Validar

Após atualizar o README.md, verifique:
- Todos os comandos documentados funcionam (`pnpm install`, `pnpm test`, `pnpm lint`, `pnpm build`)
- Os caminhos de diretórios mencionados existem
- As versões de tecnologias estão corretas
