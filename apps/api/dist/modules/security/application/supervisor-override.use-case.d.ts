import { ConfigService } from '@nestjs/config';
import { AuditLoggerPort } from '../../../shared/application/ports';
import { DomainError } from '../../../shared/domain/domain-error';
import { Result } from '../../../shared/domain/result';
import { AuthenticatedUser, OverrideActionCode } from '../domain/auth.types';
import { PasswordHasherPort, SecurityRepositoryPort, SessionStorePort, SupervisorOverrideTokenPayload } from '../domain/security.ports';
export interface RequestOverrideInput {
    requester: AuthenticatedUser;
    supervisorUsername: string;
    supervisorPin: string;
    actionCode: OverrideActionCode;
    reason: string;
    referenceType: string;
    referenceId: string;
    ipAddress?: string;
}
export interface RequestOverrideOutput {
    overrideToken: string;
    overrideLogId: string;
    approverName: string;
    expiresInSeconds: number;
}
export declare class SupervisorOverrideUseCase {
    private readonly securityRepo;
    private readonly hasher;
    private readonly sessionStore;
    private readonly auditLogger;
    private readonly config;
    constructor(securityRepo: SecurityRepositoryPort, hasher: PasswordHasherPort, sessionStore: SessionStorePort, auditLogger: AuditLoggerPort, config: ConfigService);
    authorize(input: RequestOverrideInput): Promise<Result<RequestOverrideOutput, DomainError>>;
    verifyAndConsume(params: {
        overrideToken: string;
        expectedRequesterId: string;
        expectedActionCode: OverrideActionCode;
        expectedReferenceId: string;
    }): Promise<Result<SupervisorOverrideTokenPayload, DomainError>>;
}
