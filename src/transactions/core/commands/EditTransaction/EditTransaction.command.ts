import { TransactionProps } from '@/transactions/core/model/Transaction';

export type EditTransactionCommand = TransactionProps & Required<Pick<TransactionProps, 'id'>>;
