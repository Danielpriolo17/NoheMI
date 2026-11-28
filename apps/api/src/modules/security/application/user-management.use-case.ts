import { Inject, Injectable } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import {
  AUDIT_LOGGER_PORT,
  AuditLoggerPort,
} from '../../../shared/application/ports';
import { DomainError, domainError } from '../../../shared/domain/domain-error';
import { err, ok, Result } from '../../../shared/domain/result';
import { PrismaService } from '../../../shared/infra/prisma.service';
import { AuthenticatedUser } from '../domain/auth.types';
import {
  PASSWORD_HASHER_PORT,
  PasswordHasherPort,
} from '../domain/security.ports';

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

@Injectable()
export class UserManagementUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly hasher: PasswordHasherPort,
    @Inject(AUDIT_LOGGER_PORT)
    private readonly auditLogger: AuditLoggerPort,
  ) {}

  async createUser(
    actor: AuthenticatedUser,
    input: CreateUserInput,
    ipAddress?: string,
  ): Promise<Result<Record<string, unknown>, DomainError>> {
    const [branch, role, existingUser] = await Promise.all([
      this.prisma.branch.findUnique({ where: { id: input.branchId } }),
      this.prisma.role.findUnique({ where: { code: input.roleCode } }),
      this.prisma.user.findFirst({
        where: {
          OR: [
            { username: input.username.trim() },
            { email: input.email.trim().toLowerCase() },
          ],
        },
      }),
    ]);

    if (!branch || !branch.isActive) {
      return err(domainError('NOT_FOUND', 'Sede no encontrada o inactiva.', 404));
    }
    if (!role) {
      return err(domainError('NOT_FOUND', 'Rol RBAC no encontrado.', 404));
    }
    if (existingUser) {
      return err(
        domainError('CONFLICT', 'El username o email ya está registrado.', 409),
      );
    }

    if (input.supervisorPin && !role.canApproveOverride) {
      return err(
        domainError(
          'VALIDATION_ERROR',
          `El rol ${role.code} no está habilitado para autorizaciones de supervisor.`,
          400,
        ),
      );
    }

    const passwordHash = await this.hasher.hash(input.password);
    const supervisorPinHash = input.supervisorPin
      ? await this.hasher.hash(input.supervisorPin)
      : null;

    const created = await this.prisma.user.create({
      data: {
        branchId: branch.id,
        roleId: role.id,
        username: input.username.trim(),
        email: input.email.trim().toLowerCase(),
        fullName: input.fullName.trim(),
        passwordHash,
        supervisorPinHash,
        allowedWorkStart: input.allowedWorkStart ?? null,
        allowedWorkEnd: input.allowedWorkEnd ?? null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        branchId: true,
        allowedWorkStart: true,
        allowedWorkEnd: true,
        isActive: true,
        createdAt: true,
        role: {
          select: { code: true, name: true, canApproveOverride: true },
        },
      },
    });

    await this.auditLogger.log({
      userId: actor.userId,
      branchId: actor.branchId,
      ipAddress,
      module: 'SECURITY',
      action: 'USER_CREATED',
      entityName: 'User',
      entityId: created.id,
      afterData: {
        username: created.username,
        roleCode: created.role.code,
        branchId: created.branchId,
        hasSupervisorPin: Boolean(supervisorPinHash),
      },
    });

    return ok(created as unknown as Record<string, unknown>);
  }

  async listUsers(branchId?: string) {
    return this.prisma.user.findMany({
      where: branchId ? { branchId } : undefined,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        branchId: true,
        isActive: true,
        allowedWorkStart: true,
        allowedWorkEnd: true,
        lastActivityAt: true,
        role: {
          select: {
            code: true,
            name: true,
            canViewCosts: true,
            canViewCashExpected: true,
            canApproveOverride: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
      orderBy: { code: 'asc' },
    });
  }
}