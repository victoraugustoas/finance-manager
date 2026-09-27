---
name: module-query-cqrs
description: Criar, revisar ou orientar queries de módulo no padrão CQRS de leitura no Genérico. Usar quando o pedido envolver interfaces `*Query`, arquivos `*.query.ts`, implementação de queries no adapter Prisma e chamada direta no controller, decisão sobre use case de leitura (`find-*`), projeções/DTOs para consumo da API/front, paginação/filtros/agregações em SQL, separação entre leitura (query) e escrita (repository/comando) ou a skill `module-query-cqrs`.
---

# Module Query CQRS

## Overview

Leitura é tratada de forma diferente de comando. Por padrão, uma query é só um contrato no módulo, implementado pelo adapter Prisma e chamado direto pelo controller: sem use case, sem entidade e sem passar pela camada de negócio. A complexidade da leitura fica no SQL, e o retorno é um DTO/projeção orientado ao consumidor.

## Guidelines

- Separar leitura de comando:
  - comando (create/update/delete, invariantes de escrita) passa por entidade + repository + use case;
  - leitura/projeção usa Query e **não** passa pela entidade nem pelo use case.
- Caminho padrão da leitura: **interface + implementação Prisma + controller**.
  - Interface `*Query` em `src/modules/<module>/<aggregate>/provider/<nome>.query.ts` (`execute(input) => Promise<Result<DTO>>`), com os DTOs em `dto/`.
  - Implementação no adapter do agregado (`src/modules/<module>/<aggregate>.prisma.ts`) como atributo público tipado com a interface (ex.: `readonly findBrands: FindBrandsQuery = { execute: ... }`), mapeando linhas direto para DTO.
  - O controller converte os parâmetros HTTP no DTO de entrada, chama `this.<aggregate>Prisma.<query>.execute(...)` e mapeia `isFailure`/`null` para exceção HTTP.
- Colocar a complexidade da leitura no SQL sempre que fizer sentido: filtros, regras de visibilidade, hierarquias (self-joins ou `WITH RECURSIVE`), busca textual, ordenação, agregações, contagens, campos derivados e agregação em JSON. O adapter só normaliza a entrada e mapeia linhas para DTO.
- Não criar serviço de domínio nem carregar tabelas inteiras para calcular campos de projeção em memória.
- Use case de leitura (`find-*.use-case.ts`) é exceção, aceitável somente quando:
  - há muitas regras que não cabem em SQL; ou
  - é preciso agregar várias queries distintas num único resultado.

  Nesses casos, o use case recebe as queries por parâmetro, não usa entidade nem repository de escrita e registra em comentário por que a leitura não coube no SQL.
- Não acoplar query a regras de domínio de escrita.
- DTO de query:
  - pode derivar de `*Props` (ex.: `UserProps`, `RoleProps`) com `Omit`/campos adicionais;
  - ou ser DTO totalmente independente, conforme necessidade da projeção;
  - não estender a classe da entidade.
- Documentar o comportamento da query (filtros, ordenação, `null`, paginação) no comentário da interface: ele é o contrato que o SQL precisa cumprir.
- Cobrir o comportamento das queries nos testes de integração `.http` do backend, não em testes unitários da interface.

## Workflow

1. Identificar se o caso é leitura (query) ou comando (repository + use case).
2. Definir o DTO de saída (e o de filtros, se houver) em `dto/` e a interface `FindXxxQuery` em `provider/`, documentando o comportamento esperado.
3. Implementar a query no adapter Prisma como atributo público tipado, resolvendo filtros, paginação, hierarquia e campos derivados no SQL e mapeando as linhas para o DTO.
4. Chamar a query direto no controller, normalizando os parâmetros HTTP e mapeando falha/`null` para exceção HTTP (skill: backend-controller).
5. Só criar use case de leitura se o caso cair nas exceções das Guidelines; justificar em comentário e testar o use case com queries em memória (skill: module-use-case).
6. Validar o formato final do DTO para o consumidor (API/front).
7. Cobrir sucesso, vazio/not found, filtros, paginação e ordenação no `test/<aggregate>.integration.http` do backend.

## References

Consultar `references/query-cqrs-pattern.md` para exemplos reais, critérios para use case de leitura, checklist e modelagem de DTO.
