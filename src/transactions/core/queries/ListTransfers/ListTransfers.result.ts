export type ListTransfersResult = {
  id: string;
  name: string;
  amount: number;
  notes?: string;
  dueDate: Date;
  entryDate: Date;
  effectivatedDate?: Date;
  effectivated: boolean;
  accountIdOrigin: string;
  accountOriginName: string;
  accountIdDestination: string;
  accountDestinationName: string;
};
