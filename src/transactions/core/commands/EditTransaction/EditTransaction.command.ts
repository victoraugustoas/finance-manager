import { EffectivatedProps } from '@/shared/ValueObjects/Effectivated';
import { TransactionProps } from '@/transactions/core/model/Transaction';

export interface EditTransactionCommand extends TransactionProps, EffectivatedProps {
  id: string;
}
