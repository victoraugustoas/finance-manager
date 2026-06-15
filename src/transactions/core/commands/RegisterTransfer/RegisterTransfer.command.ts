export type RegisterTransferCommand = {
  name: string;
  amount: number;
  dueDate: Date;
  entryDate: Date;
  effectivated: boolean;
  effectivatedDate?: Date;
  accountIdOrigin: string;
  accountIdDestination: string;
  notes?: string;
};
