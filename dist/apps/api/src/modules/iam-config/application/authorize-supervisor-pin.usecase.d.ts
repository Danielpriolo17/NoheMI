import Redis from 'ioredis';
import { PrismaService } from '../../../shared/infra/prisma.service';
import { AuditPort } from '../../../shared/domain/audit.port';
import { PasswordHasherPort } from '../domain/password-hasher.port';
import { Result } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';
export interface AuthorizeSupervisorPinInput {
    requesterId: string;
    supervisorDocument: string;
    supervisorPin: string;
    actionCode: 'DISCOUNT_BELOW_MARGIN' | 'VOID_INVOICE_SHIFT' | 'CREDIT_LIMIT_OVERRIDE' | 'MANUAL_DRAWER_OPEN';
    reason: string;
    documentType: string;
    documentId?: string;
    terminalId?: string;
    ipAddress?: string;
}
export interface SupervisorOverrideGrant {
    overrideId: string;
    overrideToken: string;
    expiresInSeconds: number;
    approverName: string;
}
export declare class AuthorizeSupervisorPinUseCase {
    private readonly prisma;
    private readonly hasher;
    private readonly redis;
    private readonly audit;
    private readonly allowedApproverRoles;
    constructor(prisma: PrismaService, hasher: PasswordHasherPort, redis: Redis, audit: AuditPort);
    execute(input: AuthorizeSupervisorPinInput): Promise<Result<SupervisorOverrideGrant, DomainError>>;
}
