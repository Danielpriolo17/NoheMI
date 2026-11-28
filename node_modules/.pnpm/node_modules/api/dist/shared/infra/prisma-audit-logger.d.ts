import { AuditEntryInput, AuditLoggerPort, TransactionClient } from '../application/ports';
import { PrismaService } from './prisma.service';
export declare class PrismaAuditLogger implements AuditLoggerPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(entry: AuditEntryInput, tx?: TransactionClient): Promise<void>;
}
