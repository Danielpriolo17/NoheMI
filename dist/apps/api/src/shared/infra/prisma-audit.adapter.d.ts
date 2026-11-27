import { PrismaService } from './prisma.service';
import { AuditEntryInput, AuditPort } from '../domain/audit.port';
type AuditClient = Pick<PrismaService, 'auditLog'>;
export declare class PrismaAuditAdapter implements AuditPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    record(entry: AuditEntryInput, tx?: AuditClient): Promise<void>;
}
export {};
