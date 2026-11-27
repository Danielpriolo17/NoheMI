export type DomainErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN_RBAC'
  | 'SUPERVISOR_PIN_REQUIRED'
  | 'SUPERVISOR_PIN_INVALID'
  | 'INSUFFICIENT_STOCK'           // CB-02, CB-04
  | 'NEGATIVE_STOCK_FORBIDDEN'     // CB-02
  | 'MIN_MARGIN_VIOLATED'          // RF-12, CB-07
  | 'CREDIT_LIMIT_EXCEEDED'        // RF-12
  | 'CUSTOMER_IN_ARREARS'          // RF-23
  | 'FISCAL_SEQUENCE_EXHAUSTED'    // RF-03
  | 'ACCOUNTING_PERIOD_CLOSED'     // RF-31
  | 'SHIFT_NOT_OPEN'               // RF-18
  | 'CASH_LIMIT_EXCEEDED'          // RF-19
  | 'MERMA_THRESHOLD_EXCEEDED'     // CB-05
  | 'KIT_PARTIAL_RETURN_FORBIDDEN' // CB-06
  | 'GATE_PASS_ALREADY_USED'       // CB-07
  | 'DUPLICATE_REFERENCE'          // RF-18, RF-22
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR';

export interface DomainError {
  readonly code: DomainErrorCode;
  readonly message: string;
  readonly httpStatus: number;
  readonly metadata?: Record<string, unknown>;
}

export const domainError = (
  code: DomainErrorCode,
  message: string,
  httpStatus = 422,
  metadata?: Record<string, unknown>,
): DomainError => ({ code, message, httpStatus, metadata });