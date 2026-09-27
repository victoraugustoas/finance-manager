# Query CQRS Pattern (Genérico)

## Princípio

Leitura e comando seguem caminhos diferentes:

| | Comando | Leitura (query) |
| --- | --- | --- |
| Exemplos | create, update, delete | listagem, detalhe, árvore, painel |
| Contrato | `*.repository.ts` em `provider/` | `*.query.ts` em `provider/` |
| Passa pela entidade | sim (`tryCreate`, `cloneWith`, invariantes) | não |
| Use case | sempre (`save-*`, `delete-*`) | por padrão, não |
| Onde fica a regra | entidade, VOs e use case | SQL |
| Retorno | entidade (repository) / DTO (use case) | DTO/projeção |
| Testes | unitários (entidade, VO, use case) | integração `.http` |

## Caminho padrão: interface + Prisma + controller

### 1. Interface e DTOs no módulo

`src/modules/<module>/<aggregate>/dto/<aggregate>-filters.dto.ts` e `<aggregate>.dto.ts`:

```ts
export interface BrandFiltersDTO {
  page: number
  pageSize: number
  search?: string
  isActive?: boolean
}

export interface BrandPageDTO {
  items: BrandDTO[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
```

`src/modules/<module>/<aggregate>/provider/find-brands.query.ts`:

```ts
import { Result } from '@/shared/base/result'
import { BrandFiltersDTO, BrandPageDTO } from '../dto'

// One page of non-deleted brands. Without `search` they come ordered by name
// (ignoring case and accents); with `search`, every term must match the start
// of a word in the name, slug or description, best matches first. `isActive`
// filters by status when defined.
export interface FindBrandsQuery {
  execute(filter: BrandFiltersDTO): Promise<Result<BrandPageDTO>>
}
```

O comentário da interface descreve o comportamento que o SQL precisa cumprir (filtros, ordenação, quando retorna `null`).

### 2. Implementação no adapter Prisma

A query é um atributo público tipado da mesma classe que implementa o repository do agregado (`src/modules/<module>/<aggregate>.prisma.ts`):

```ts
@Injectable()
export class BrandPrisma implements BrandRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Read side (CQRS): rows are mapped straight to `BrandDTO`, without the entity.
  readonly findBrands: FindBrandsQuery = {
    execute: (filter) =>
      Result.tryAsync(async () => {
        const page = Math.max(1, Math.trunc(filter.page) || 1);
        const pageSize = Math.max(1, Math.trunc(filter.pageSize) || 1);

        const conditions = [Prisma.sql`deleted_at IS NULL`];
        if (typeof filter.isActive === 'boolean') {
          conditions.push(Prisma.sql`is_active = ${filter.isActive}`);
        }
        const where = Prisma.join(conditions, ' AND ');

        const client = this.prisma.client;
        const [counts, rows] = await Promise.all([
          client.$queryRaw<{ total: number }[]>`SELECT count(*)::int AS total FROM brands WHERE ${where}`,
          client.$queryRaw<BrandSearchRow[]>`
            SELECT id, name, slug, description, logo_url, is_active, created_at, updated_at
            FROM brands
            WHERE ${where}
            ORDER BY name COLLATE "pt-BR-x-icu", id
            LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
        ]);

        const total = counts[0]?.total ?? 0;
        return { items: rows.map(searchRowToDTO), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),
  };

  readonly findBrandById: FindBrandByIdQuery = {
    execute: (id) =>
      Result.tryAsync(async () => {
        // A malformed id never matches the uuid column; skip the database error.
        if (!this.isUuid(id)) return null;
        const row = await this.prisma.client.brand.findFirst({ where: { id, deletedAt: null } });
        return row ? this.toDTO(row) : null;
      }),
  };

  // ... métodos do repository (create/update/findById/delete)
}
```

Responsabilidades do adapter na leitura:

- normalizar a entrada (limites de `page`/`pageSize`, id que não é uuid não vai ao banco);
- montar e executar o SQL;
- mapear linhas para DTO (`snake_case` → `camelCase`, `null` explícito).

### 3. Chamada direta no controller

```ts
@Get()
async findAll(
  @Query('page') page?: unknown,
  @Query('pageSize') pageSize?: unknown,
  @Query('isActive') isActive?: unknown,
): Promise<BrandPageDTO> {
  const filter: BrandFiltersDTO = {
    page: this.positiveInteger(page, DEFAULT_PAGE),
    pageSize: Math.min(this.positiveInteger(pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE),
  };
  if (isActive === 'true' || isActive === 'false') filter.isActive = isActive === 'true';

  const result = await this.brandPrisma.findBrands.execute(filter);

  if (result.isFailure) this.throwFailure(result.errors);
  return result.instance;
}

@Get(':id')
async findById(@Param('id') id: string): Promise<BrandDTO> {
  const result = await this.brandPrisma.findBrandById.execute(id);

  if (result.isFailure) this.throwFailure(result.errors);
  if (!result.instance) throw new NotFoundException([BrandErrors.BRAND_NOT_FOUND]);
  return result.instance;
}
```

O controller converte parâmetros HTTP no DTO de entrada e traduz falha/`null` em exceção HTTP. Não instancia use case para ler.

Compor a resposta de um comando com uma query no controller também não exige use case: `CategoryController.respondWith` executa `SaveCategory` e devolve o resultado de `findCategoryById`, que calcula `level`, `path` e `childrenCount`.

## Complexidade da leitura fica no SQL

Resolver no SQL sempre que fizer sentido:

- filtros e regras de visibilidade (`deleted_at IS NULL`, ativo, ancestrais ativos);
- busca textual (`tsvector`, `to_tsquery`, `ts_rank`) com `folded`/`toPrefixTsQuery` de `apps/backend/src/db/text-search.sql.ts`;
- ordenação estável (`COLLATE "pt-BR-x-icu"`, `id` como desempate);
- hierarquias: self-joins quando a profundidade é fixa (`BASE_SELECT` de `CategoryPrisma`) ou `WITH RECURSIVE` quando não é;
- agregações, contagens e facetas (`count(*)`, `GROUP BY`, subconsultas);
- campos derivados de projeção (`level`, `path`, `childrenCount`, percentual de desconto);
- estruturas aninhadas com `json_agg`/`jsonb_build_object` quando evitam N+1.

Quando o Prisma Client não expressa a consulta (collation no `orderBy`, full-text, campos por linha), usar `$queryRaw` com `Prisma.sql`/`Prisma.join`. Nunca interpolar texto do usuário fora de `Prisma.sql`.

Não criar serviço de domínio só para calcular campo de projeção, nem carregar uma tabela inteira para montar árvore, caminho ou contagem em memória.

## Quando um use case de leitura é aceitável

Exceção, não padrão. Criar `find-*.use-case.ts` somente quando:

- há **muitas regras** que não cabem em SQL (ex.: política que depende de cálculo de domínio já existente e não reproduzível em SQL sem duplicá-lo); ou
- é preciso **agregar várias queries distintas** num único resultado (ex.: painel que combina queries de agregados ou módulos diferentes).

Não justificam use case de leitura:

- mapear falha para erro de domínio (o controller já faz);
- formatar campo (preço, data): o front formata, ou o SQL entrega o valor;
- chamar uma única query;
- "manter o padrão" de ter use case para tudo.

Quando for aceitável:

- fica em `src/modules/<module>/<aggregate>/use-case/find-<nome>.use-case.ts` e implementa `UseCase<Input, Output>`;
- recebe as queries por parâmetro; não usa entidade nem repository de escrita;
- registra em comentário por que a leitura não coube no SQL;
- tem teste unitário com implementações em memória das queries (skill: module-use-case).

## Quando usar Repository (comando)

- Fluxos de escrita: create/update/delete.
- Leitura para preservar invariantes antes de comando (ex.: `findById` retornando entidade, `findBySlug` para unicidade, `existsByBrandId` para bloquear exclusão).
- Regras de domínio de escrita com `Entity`/`tryCreate`/`cloneWith`.

## DTO em Query: regra de modelagem

- Não estender a classe da entidade.
- Opções válidas:
  - Derivar de `*Props` da entidade com adaptação:
    - exemplo: `interface RoleDTO extends Omit<RoleProps, "permissionIds"> { permissions: ... }`
  - Criar DTO totalmente independente quando a projeção exigir (ex.: `CategoryDTO` com `level`, `path` e `childrenCount`, que não existem na entidade).
- Escolher a opção de menor acoplamento para o caso.
- Comentar no DTO os campos calculados pela leitura e que nunca são persistidos.

## Contrato esperado

```ts
export interface FindXxxQuery {
  execute(input: InputDTO): Promise<Result<OutputDTO>>
}
```

- `InputDTO` pode ser primitivo, objeto de filtro ou paginação.
- `OutputDTO` pode ser item único, coleção paginada, árvore, painel agregado etc.
- Busca por id/slug retorna `Result<DTO | null>`: `null` quando não existir ou estiver excluído; o controller responde `404` com o código `<AGGREGATE>_NOT_FOUND`.
- `isFailure` fica para erro técnico (banco indisponível, SQL inválido), capturado por `Result.tryAsync`.

## Paths de referência

- Interfaces de query e DTOs no módulo:
  - `src/modules/catalog/brand/provider/find-brands.query.ts`
  - `src/modules/catalog/brand/provider/find-brand-by-id.query.ts`
  - `src/modules/catalog/category/provider/find-category-tree.query.ts`
  - `src/modules/catalog/category/provider/find-category-children.query.ts`
  - `src/modules/catalog/category/dto/category.dto.ts`
- Implementações no adapter (Prisma):
  - `src/modules/catalog/brand.prisma.ts` (`findBrands`: busca textual, ordenação com collation e contagem em SQL)
  - `src/modules/catalog/category.prisma.ts` (`BASE_SELECT`: `level`, `path` e `childrenCount` calculados em SQL)
- Controllers que chamam queries direto:
  - `src/modules/catalog/brand.controller.ts`
  - `src/modules/catalog/category.controller.ts`
- Testes de integração das queries:
  - `src/modules/catalog/test/brand.integration.http`
  - `src/modules/catalog/test/category.integration.http`
- Contraexemplo (não seguir em queries novas):
  - `src/modules/catalog/product.prisma.ts` (`findProducts` carrega todas as categorias para calcular `categoryPath` e descendentes em memória; resolver no SQL)

## Checklist de implementação

- [ ] Caso é leitura (não comando).
- [ ] DTOs em `dto/` e interface `*Query` em `provider/` do agregado.
- [ ] Comentário da interface descreve filtros, ordenação e quando retorna `null`.
- [ ] `execute` retorna `Promise<Result<DTO>>`.
- [ ] Implementação no `*.prisma.ts` do agregado como atributo público tipado (`readonly findXxx: FindXxxQuery`).
- [ ] Filtros, hierarquia, contagens e campos derivados resolvidos no SQL; nada calculado em memória que o banco resolva.
- [ ] Adapter só normaliza a entrada e mapeia linhas para DTO, sem passar pela entidade.
- [ ] Controller chama a query direto e mapeia `isFailure`/`null` para exceção HTTP.
- [ ] Nenhum `find-*.use-case.ts` criado, salvo exceção justificada em comentário.
- [ ] Nenhum serviço de domínio criado para campo de projeção.
- [ ] DTO alinhado com a necessidade do consumidor e sem detalhes do banco.
- [ ] Cenários cobertos no `test/<aggregate>.integration.http`.

## Estratégia de testes

- Query não tem teste unitário da interface: o comportamento real está no SQL e só é verificado contra o banco.
- Cobrir no `src/modules/<module>/test/<aggregate>.integration.http`:
  - cenário feliz (formato do DTO, campos derivados);
  - vazio e not found (`null` → `404`);
  - filtros e busca (conferindo `total` e `totalPages`);
  - paginação (limite de `pageSize`, página além da última);
  - ordenação e campos calculados que dependem de outros registros (ex.: `childrenCount` após excluir um filho).
- Use case de leitura, quando existir por exceção, tem teste unitário com queries em memória.

## Armadilhas comuns

- Criar `find-*.use-case.ts` para cada query "por padrão".
- Criar serviço de domínio ou use case só para calcular campo de projeção.
- Carregar uma tabela inteira e filtrar, ordenar ou montar árvore em memória.
- Buscar relações em laço (N+1) em vez de join, subconsulta ou `json_agg`.
- Retornar entidade em query voltada a API quando DTO era o contrato certo.
- Colocar regra de escrita numa query ou query fazendo comando.
- Acoplar DTO de leitura à estrutura de banco (`snake_case`, colunas internas).
- Escrever teste unitário da interface com mock que reimplementa o SQL.
