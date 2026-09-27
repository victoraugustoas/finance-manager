/** Input of the create-account write operation. Amounts are decimal values. */
export interface CreateAccountInDTO {
  name: string;
  openingBalance: number;
}

/** Projection of an account for API consumers. Amounts are decimal values. */
export interface AccountOutDTO {
  id: string;
  name: string;
  openingBalance: number;
}
