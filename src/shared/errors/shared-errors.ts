export const SharedErrors = {
  ID_INVALID: 'INVALID_ID',
} as const;

/** Failures of the shared `Money` value object. */
export const MoneyErrors = {
  NOT_FINITE: 'MONEY_NOT_FINITE',
  CENTS_NOT_INTEGER: 'MONEY_CENTS_NOT_INTEGER',
} as const;

/** Failures of the shared `ReportingPeriod` value object. */
export const PeriodErrors = {
  END_DATE_NOT_AFTER_START_DATE: 'END_DATE_NOT_AFTER_START_DATE',
} as const;

export type SharedErrorCode = (typeof SharedErrors)[keyof typeof SharedErrors];

/**
 * Falhas do próprio `Result`, quando o validador reprova sem um código de
 * domínio para atribuir. Não deveriam chegar ao usuário: se chegam, é defeito.
 */
export const ResultErrors = {
  EXPRESSION_FALSE: 'RESULT_EXPRESSION_FALSE',
  EXPRESSION_TRUE: 'RESULT_EXPRESSION_TRUE',
  FAILED: 'RESULT_FAILED',
  INSTANCE_EMPTY: 'RESULT_INSTANCE_EMPTY',
  INSTANCE_NOT_EMPTY: 'RESULT_INSTANCE_NOT_EMPTY',
  INSTANCE_NOT_NULL: 'RESULT_INSTANCE_NOT_NULL',
  INSTANCE_NULL: 'RESULT_INSTANCE_NULL',
  UNDEFINED: 'RESULT_UNDEFINED',
} as const;

/**
 * O que todo repositório e toda query emitem, independente do agregado. Ficam
 * aqui porque `ENTITY_NOT_FOUND` não pertence a user nem a course: pertence ao
 * contrato de persistência que os dois cumprem.
 */
export const RepositoryErrors = {
  ENTITY_ALREADY_EXISTS: 'ENTITY_ALREADY_EXISTS',
  ENTITY_NOT_FOUND: 'ENTITY_NOT_FOUND',
  /** Codes kept as `PRISMA_*` so the public HTTP status mapping stays unchanged. */
  WRITE_FAILED: 'PRISMA_INSERT_ERROR',
  READ_FAILED: 'PRISMA_QUERY_ERROR',
} as const;
