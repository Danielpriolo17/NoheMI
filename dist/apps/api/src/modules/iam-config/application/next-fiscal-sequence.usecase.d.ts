import { AuditPort } from '../../../shared/domain/audit.port';
import { Result } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';
type AuditTransaction = NonNullable<Parameters<AuditPort['record']>[1]>;
export interface NextSequenceResult {
    sequenceId: string;
    prefix: string;
    consecutive: bigint;
    fullNumber: string;
    resolutionNumber: string | null;
    alerts: string[];
}
export declare class NextFiscalSequenceUseCase {
    private readonly audit;
    constructor(audit: AuditPort);
    executeInTx(tx: AuditTransaction, params: {
        branchId: string;
        docType: string;
        isContingency?: boolean;
        userId: string;
    }): Promise<Result<NextSequenceResult, DomainError>>;
}
export {};
