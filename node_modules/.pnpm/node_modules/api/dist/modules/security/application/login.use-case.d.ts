import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuditLoggerPort } from '../../../shared/application/ports';
import { DomainError } from '../../../shared/domain/domain-error';
import { Result } from '../../../shared/domain/result';
import { PasswordHasherPort, SecurityRepositoryPort, SessionStorePort } from '../domain/security.ports';
export interface LoginInput {
    username: string;
    password: string;
    terminalId?: string;
    ipAddress?: string;
}
export interface LoginOutput {
    accessToken: string;
    idleTimeoutSeconds: number;
    user: {
        id: string;
        username: string;
        fullName: string;
        branchId: string;
        roleCode: string;
        canViewCosts: boolean;
        canViewCashExpected: boolean;
        canApproveOverride: boolean;
    };
}
export declare class LoginUseCase {
    private readonly securityRepo;
    private readonly hasher;
    private readonly sessionStore;
    private readonly auditLogger;
    private readonly jwtService;
    private readonly config;
    private static readonly MAX_FAILED_ATTEMPTS;
    private static readonly LOCK_DURATION_MINUTES;
    constructor(securityRepo: SecurityRepositoryPort, hasher: PasswordHasherPort, sessionStore: SessionStorePort, auditLogger: AuditLoggerPort, jwtService: JwtService, config: ConfigService);
    execute(input: LoginInput): Promise<Result<LoginOutput, DomainError>>;
    private isWithinAllowedSchedule;
}
