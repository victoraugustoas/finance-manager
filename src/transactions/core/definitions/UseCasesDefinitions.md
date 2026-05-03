# Transactions context

## Use Cases

***

### C1. Register an expense

#### Definition

Registering an expense should initially have the following parameters:

- Name. E.g.: Grocery, Electricity, Internet
- Amount. E.g.: $25.23
- Due date.
- Entry date.
- Payment date.
- Settled
- Account

#### C1. Business rules

BR1. If an expense is settled, it must
have the payment date filled in.

BR2. The expense must belong to a category and subcategory.

BR3. The expense must have a positive value greater than zero.

BR4. The expense must belong to an account.
***

### C2. Transfer between accounts

#### Definition

The transfer must be made between two different accounts.
Parameters:

- Name. E.g.: Transfer from Santander to Wallet
- Amount. E.g.: $20.30
- Source account. E.g.: Santander
- Destination account. E.g.: Wallet
- Due date.
- Settlement date.
- Entry date.
- Settled.
- Notes.

##### C2. Business rules

BR1. The transfer must credit the destination account and
debit the source account.

BR2. If the transfer is settled,
the settlement date must be filled in.
***

### C3. Register income

#### Definition

Registering income should initially have the following parameters:

- Name. E.g.: Salary, Freelance, Dividends
- Amount. E.g.: $3,500.00
- Category
- Subcategory
- Notes
- Due date.
- Entry date.
- Receipt date.
- Settled
- Account

#### C3. Business rules

BR1. If income is settled, it must
have the receipt date filled in.

BR2. Income must belong to a category and subcategory.

BR3. Income must have a positive value greater than zero.

BR4. Income must belong to an account.
***
