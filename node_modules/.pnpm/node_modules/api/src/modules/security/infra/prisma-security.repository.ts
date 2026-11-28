import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infra/prisma.service';
import { OverrideActionCode, PermissionAction } from '../domain/auth.types';
import {
  SecurityRepositoryPort,
  UserSecurityRecord,
} from '../domain/security.ports';

@Injectable()
export class PrismaSecurityRepository implements SecurityRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string): Promise<UserSecurityRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    return user ? this.mapUser(user) : null;
  }

  async findById(userId: string): Promise<UserSecurityRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    return user ? this.mapUser(user) : null;
  }

  async recordFailedLogin(
    userId: string,
    failedCount: number,
    lockedUntil: Date | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: failedCount, lockedUntil },
    });
  }

  async recordSuccessfulLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastActivityAt: new Date(),
      },
    });
  }

  async createOverrideLog(input: {
    requesterId: string;
    approverId: string;
    actionCode: OverrideActionCode;
    reason: string;
    referenceType: string;
    referenceId: string;
    expiresAt: Date;
  }): Promise<{ id: string }> {
    const record = await this.prisma.supervisorOverrideLog.create({
      data: {
        requesterId: input.requesterId,
        approverId: input.approverId,
        actionCode: input.actionCode,
        reason: input.reason,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        expiresAt: input.expiresAt,
      },
      select: { id: true },
    });
    return record;
  }

  async markOverrideLogUsed(overrideLogId: string): Promise<void> {
    await this.prisma.supervisorOverrideLog.update({
      where: { id: overrideLogId },
      data: { usedAt: new Date() },
    });
  }

  private mapUser(raw: {
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
      code: UserSecurityRecord['role']['code'];
      canViewCosts: boolean;
      canViewCashExpected: boolean;
      canApproveOverride: boolean;
      permissions: Array<{
        ownRecordsOnly: boolean;
        maskedSensitive: boolean;
        permission: {
          resource: string;
          action: string;
        };
      }>;
    };
  }): UserSecurityRecord {
    return {
      id: raw.id,
      branchId: raw.branchId,
      username: raw.username,
      email: raw.email,
      fullName: raw.fullName,
      passwordHash: raw.passwordHash,
      supervisorPinHash: raw.supervisorPinHash,
      allowedWorkStart: raw.allowedWorkStart,
      allowedWorkEnd: raw.allowedWorkEnd,
      isActive: raw.isActive,
      failedLoginCount: raw.failedLoginCount,
      lockedUntil: raw.lockedUntil,
      role: {
        code: raw.role.code,
        canViewCosts: raw.role.canViewCosts,
        canViewCashExpected: raw.role.canViewCashExpected,
        canApproveOverride: raw.role.canApproveOverride,
        permissions: raw.role.permissions.map((rp) => ({
          resource: rp.permission.resource,
          action: rp.permission.action as PermissionAction,
          ownRecordsOnly: rp.ownRecordsOnly,
          maskedSensitive: rp.maskedSensitive,
        })),
      },
    };
  }
}