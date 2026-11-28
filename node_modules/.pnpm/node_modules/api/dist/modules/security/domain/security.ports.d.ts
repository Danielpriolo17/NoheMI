import { RoleCode } from '@prisma/client';
import { GrantedPermission, OverrideActionCode } from './auth.types';
export declare const SECURITY_REPO_PORT: unique symbol;
export declare const SESSION_STORE_PORT: unique symbol;
export declare const PASSWORD_HASHER_PORT: unique symbol;
export interface UserSecurityRecord {
    id: string;
    branchId: string;
    username: string;
    email: string;
    fullName: string;
    passwordHash: string;
    supervisorPinHash: string | null;
    allowedWorkStart: string | null;
    allowedWorkEnd: string | null;
    isActive: boolean;
    failedLoginCount: number;
    lockedUntil: Date | null;
    role: {
        code: RoleCode;
        canViewCosts: boolean;
        canViewCashExpected: boolean;
        canApproveOverride: boolean;
        permissions: GrantedPermission[];
    };
}
export interface SecurityRepositoryPort {
    findByUsername(username: string): Promise<UserSecurityRecord | null>;
    findById(userId: string): Promise<UserSecurityRecord | null>;
    recordFailedLogin(userId: string, failedCount: number, lockedUntil: Date | null): Promise<void>;
    recordSuccessfulLogin(userId: string): Promise<void>;
    createOverrideLog(input: {
        requesterId: string;
        approverId: string;
        actionCode: OverrideActionCode;
        reason: string;
        referenceType: string;
        referenceId: string;
        expiresAt: Date;
    }): Promise<{
        id: string;
    }>;
    markOverrideLogUsed(overrideLogId: string): Promise<void>;
}
export interface ActiveSessionPayload {
    userId: string;
    branchId: string;
    terminalId?: string;
    roleCode: RoleCode;
    lastSeenAt: string;
}
export interface SupervisorOverrideTokenPayload {
    overrideLogId: string;
    requesterId: string;
    approverId: string;
    actionCode: OverrideActionCode;
    referenceType: string;
    referenceId: string;
}
export interface SessionStorePort {
    saveActiveSession(sessionId: string, payload: ActiveSessionPayload, idleTtlSeconds: number): Promise<void>;
    touchActiveSession(sessionId: string, idleTtlSeconds: number): Promise<ActiveSessionPayload | null>;
    revokeSession(sessionId: string): Promise<void>;
    saveOverrideToken(token: string, payload: SupervisorOverrideTokenPayload, ttlSeconds: number): Promise<void>;
    consumeOverrideToken(token: string): Promise<SupervisorOverrideTokenPayload | null>;
}
export interface PasswordHasherPort {
    hash(plain: string): Promise<string>;
    verify(hash: string, plain: string): Promise<boolean>;
}
