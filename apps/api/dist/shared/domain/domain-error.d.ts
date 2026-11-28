export type DomainErrorCode = 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'SUPERVISOR_OVERRIDE_REQUIRED' | 'INVALID_SUPERVISOR_PIN' | 'NOT_FOUND' | 'CONFLICT' | 'INSUFFICIENT_STOCK' | 'SKU_SALES_BLOCKED' | 'BELOW_MINIMUM_MARGIN' | 'CREDIT_LIMIT_EXCEEDED' | 'CUSTOMER_OVERDUE_BLOCKED' | 'SHRINKAGE_LIMIT_EXCEEDED' | 'KIT_PARTIAL_RETURN_FORBIDDEN' | 'GATE_PASS_ALREADY_USED' | 'FISCAL_SEQUENCE_EXHAUSTED' | 'PERIOD_CLOSED' | 'CASH_SHIFT_REQUIRED' | 'CASH_SHIFT_ALREADY_CLOSED' | 'DUPLICATE_PAYMENT_REFERENCE';
export interface DomainError {
    readonly code: DomainErrorCode;
    readonly message: string;
    readonly httpStatus: number;
    readonly details?: Record<string, unknown>;
}
export declare const domainError: (code: DomainErrorCode, message: string, httpStatus?: number, details?: Record<string, unknown>) => DomainError;
