# Transactions context

## Use Cases

***

### C3. Cadastrar uma despesa

#### Definição

Cadastrar uma despesa deve ter inicialmente os seguintes parâmetros:

- Nome. Ex: Supermercado, Energia, Internet
- Valor. Ex: $25,23
- Data de vencimento.
- Data de lançamento.
- Data de pagamento.
- Efetivada
- Conta

#### C3. Regras de negócio

RN1. Se uma despesa está efetivada, ela deve
ter a data de pagamento preenchida.

RN2. A despesa deve pertencer a uma categoria e subcategoria.

RN3. A despesa deve ter um valor positivo e maior que zero.

RN4. A despesa deve pertencer a uma conta.
***

### C4. Transferência entre contas

#### Definição

A transferência deve ser feita entre duas contas diferentes.
Parâmetros:

- Noma. Ex: Transferência de Santander para Carteira
- Valor. Ex: $20,30
- Conta de origem. Ex: Santander
- Conta de destino. Ex: Carteira
- Data de vencimento.
- Data de efetivação.
- Data de lançamento.
- Efetivada.

##### C4. Regras de negócio

RN1. A transferência deve creditar a conta de destino e
debitar a conta de origem.

RN2. Se a transferência for efetivada
a data de efetivação deve ser preenchida.
***
