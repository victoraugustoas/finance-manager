# Reporting context

## Use Cases

***

### C1. Breakdown of categories

#### Definition

Deve retornar uma lista de categorias com seus respectivos valores.
O filtro deve ser possível aplicar os seguintes parâmetros:

- Categorias
- Data inicial
- Data final
- Efetivadas/Não efetivadas

#### C1. Bussiness Rules

- BR1.
  - A lista deve ser agrupada por categoria.
  - Cada categoria terá um somatório dos valores das transações que existem nela.
- BR2.
  - A lista deve ser ordenada por valor, do maior para o menor.
- BR3.
  - Se uma categoria não for informada, todas as categorias devem ser retornadas.
  - O limite de 6 categorias deve ser aplicado, sendo que a última categoria deve ter
    o somatório das demais categorias.

*******
