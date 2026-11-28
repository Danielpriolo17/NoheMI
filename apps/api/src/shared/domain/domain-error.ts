export type DomainErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'SUPERVISOR_OVERRIDE_REQUIRED'
  | 'INVALID_SUPERVISOR_PIN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INSUFFICIENT_STOCK'          // CB-02 / CB-04
  | 'SKU_SALES_BLOCKED'           // CB-02 Stock fantasma
  | 'BELOW_MINIMUM_MARGIN'        // RF-12 / CB-07
  | 'CREDIT_LIMIT_EXCEEDED'       // RF-12 / RF-23
  | 'CUSTOMER_OVERDUE_BLOCKED'    // RF-23
  | 'SHRINKAGE_LIMIT_EXCEEDED'    // CB-05
  | 'KIT_PARTIAL_RETURN_FORBIDDEN'// CB-06
  | 'GATE_PASS_ALREADY_USED'      // CB-07 Portería
  | 'FISCAL_SEQUENCE_EXHAUSTED'   // RF-03
  | 'PERIOD_CLOSED'               // RF-31
  | 'CASH_SHIFT_REQUIRED'         // RF-18
  | 'CASH_SHIFT_ALREADY_CLOSED'   // RF-20
  | 'DUPLICATE_PAYMENT_REFERENCE';// RF-18

export interface DomainError {
  readonly code: DomainErrorCode;
  readonly message: string;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;
}

export const domainError = (
  code: DomainErrorCode,
  message: string,
  httpStatus = 422,
  details?: Record<string, unknown>,
): DomainError => ({
  code,
  message,
  httpStatus,
  details,
});