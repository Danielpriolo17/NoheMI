import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { AuditPort } from '../../../../shared/domain/audit.port';
export interface AuthenticatedUser {
    sub: string;
    jti: string;
    role: string;
    branchIds: string[];
    sessionTimeoutMinutes: number;
    terminalId?: string;
}
export declare class SessionActivityGuard implements CanActivate {
    private readonly jwtService;
    private readonly redis;
    private readonly audit;
    constructor(jwtService: JwtService, redis: Redis, audit: AuditPort);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
