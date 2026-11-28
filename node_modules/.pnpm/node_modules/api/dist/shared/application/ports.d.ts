import { Prisma } from '@prisma/client';
export type TransactionClient = Prisma.TransactionClient;
export declare const UNIT_OF_WORK_PORT: unique symbol;
export declare const AUDIT_LOGGER_PORT: unique symbol;
export interface UnitOfWorkPort {
    runInTransaction<T>(work: (tx: TransactionClient) => Promise<T>, options?: {
        isolationLevel?: Prisma.TransactionIsolationLevel;
        timeoutMs?: number;
    }): Promise<T>;
}
export interface AuditEntryInput {
    userId?: string | null;
    supervisorId?: string | null;
    branchId?: string | null;
    terminalId?: string | null;
    ipAddress?: string | null;
    module: string;
    action: string;
    entityName: string;
    entityId: string;
    beforeData?: Record<string, unknown> | null;
    afterData?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
}
export interface AuditLoggerPort {
    log(entry: AuditEntryInput, tx?: TransactionClient): Promise<void>;
}
