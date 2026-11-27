export type DomainErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN_RBAC' | 'SUPERVISOR_PIN_REQUIRED' | 'SUPERVISOR_PIN_INVALID' | 'INSUFFICIENT_STOCK' | 'NEGATIVE_STOCK_FORBIDDEN' | 'MIN_MARGIN_VIOLATED' | 'CREDIT_LIMIT_EXCEEDED' | 'CUSTOMER_IN_ARREARS' | 'FISCAL_SEQUENCE_EXHAUSTED' | 'ACCOUNTING_PERIOD_CLOSED' | 'SHIFT_NOT_OPEN' | 'CASH_LIMIT_EXCEEDED' | 'MERMA_THRESHOLD_EXCEEDED' | 'KIT_PARTIAL_RETURN_FORBIDDEN' | 'GATE_PASS_ALREADY_USED' | 'DUPLICATE_REFERENCE' | 'NOT_FOUND' | 'VALIDATION_ERROR';
export interface DomainError {
    readonly code: DomainErrorCode;
    readonly message: string;
    readonly httpStatus: number;
    readonly metadata?: Record<string, unknown>;
}
export declare const domainError: (code: DomainErrorCode, message: string, httpStatus?: number, metadata?: Record<string, unknown>) => DomainError;
