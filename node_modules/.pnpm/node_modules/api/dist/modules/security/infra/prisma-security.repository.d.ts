import { PrismaService } from '../../../shared/infra/prisma.service';
import { OverrideActionCode } from '../domain/auth.types';
import { SecurityRepositoryPort, UserSecurityRecord } from '../domain/security.ports';
export declare class PrismaSecurityRepository implements SecurityRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    private mapUser;
}
