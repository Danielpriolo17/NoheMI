import { RoleCode } from '@prisma/client';
import { AuditLoggerPort } from '../../../shared/application/ports';
import { DomainError } from '../../../shared/domain/domain-error';
import { Result } from '../../../shared/domain/result';
import { PrismaService } from '../../../shared/infra/prisma.service';
import { AuthenticatedUser } from '../domain/auth.types';
import { PasswordHasherPort } from '../domain/security.ports';
export interface CreateUserInput {
    branchId: string;
    roleCode: RoleCode;
    username: string;
    email: string;
    fullName: string;
    password: string;
    supervisorPin?: string;
    allowedWorkStart?: string;
    allowedWorkEnd?: string;
}
export declare class UserManagementUseCase {
    private readonly prisma;
    private readonly hasher;
    private readonly auditLogger;
    constructor(prisma: PrismaService, hasher: PasswordHasherPort, auditLogger: AuditLoggerPort);
    createUser(actor: AuthenticatedUser, input: CreateUserInput, ipAddress?: string): Promise<Result<Record<string, unknown>, DomainError>>;
    listUsers(branchId?: string): Promise<{
        username: string;
        fullName: string;
        branchId: string;
        isActive: boolean;
        role: {
            canViewCosts: boolean;
            canViewCashExpected: boolean;
            canApproveOverride: boolean;
            name: string;
            code: import("@prisma/client").$Enums.RoleCode;
        };
        id: string;
        email: string;
        allowedWorkStart: string | null;
        allowedWorkEnd: string | null;
        lastActivityAt: Date | null;
    }[]>;
    listRoles(): Promise<({
        permissions: ({
            permission: {
                resource: string;
                id: string;
                description: string;
                action: string;
            };
        } & {
            roleId: string;
            permissionId: string;
            ownRecordsOnly: boolean;
            maskedSensitive: boolean;
        })[];
    } & {
        canViewCosts: boolean;
        canViewCashExpected: boolean;
        canApproveOverride: boolean;
        id: string;
        createdAt: Date;
        name: string;
        code: import("@prisma/client").$Enums.RoleCode;
    })[]>;
}
