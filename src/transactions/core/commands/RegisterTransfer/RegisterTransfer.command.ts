import { EffectivatedProps } from '@/shared/ValueObjects/Effectivated';

export interface RegisterTransferCommand extends EffectivatedProps {
  name: string;
  amount: number;
  dueDate: Date;
  entryDate: Date;
  accountIdOrigin: string;
  accountIdDestination: string;
  notes?: string;
}
