import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { PrismaService } from '../../../shared/infra/prisma.service';
import { REDIS_CLIENT } from '../../../shared/infra/redis.provider';
import { AUDIT_PORT, AuditPort } from '../../../shared/domain/audit.port';
import {
  PASSWORD_HASHER_PORT,
  PasswordHasherPort,
} from '../domain/password-hasher.port';
import { Result, err, ok } from '../../../shared/domain/result';
import { DomainError, domainError } from '../../../shared/domain/domain-error';

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

@Injectable()
export class AuthorizeSupervisorPinUseCase {
  private readonly allowedApproverRoles: ReadonlySet<string> = new Set([
    'ADMIN_GERENCIA',
    'CONTADOR_TESORERIA',
  ]);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PASSWORD_HASHER_PORT) private readonly hasher: PasswordHasherPort,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(AUDIT_PORT) private readonly audit: AuditPort,
  ) {}

  async execute(
    input: AuthorizeSupervisorPinInput,
  ): Promise<Result<SupervisorOverrideGrant, DomainError>> {
    if (!input.reason || input.reason.trim().length < 5) {
      return err(
        domainError('VALIDATION_ERROR', 'Debe indicar un motivo detallado (mínimo 5 caracteres).', 400),
      );
    }

    const supervisor = await this.prisma.user.findUnique({
      where: { documentNumber: input.supervisorDocument },
    });

    if (
      !supervisor ||
      !supervisor.isActive ||
      !supervisor.supervisorPinHash ||
      !this.allowedApproverRoles.has(supervisor.role)
    ) {
      return err(
        domainError('SUPERVISOR_PIN_INVALID', 'Credenciales de supervisor no autorizadas.', 403),
      );
    }

    if (supervisor.id === input.requesterId) {
      return err(
        domainError(
          'FORBIDDEN_RBAC',
          'Segregación de funciones: un usuario no puede auto-aprobar su propia operación.',
          403,
        ),
      );
    }

    const validPin = await this.hasher.verify(supervisor.supervisorPinHash, input.supervisorPin);
    if (!validPin) {
      await this.audit.record({
        userId: input.requesterId,
        ipAddress: input.ipAddress,
        terminalId: input.terminalId,
        module: 'IAM',
        action: 'SUPERVISOR_OVERRIDE',
        documentType: input.documentType,
        documentId: input.documentId,
        afterState: { status: 'REJECTED_INVALID_PIN', supervisorDoc: input.supervisorDocument },
      });
      return err(domainError('SUPERVISOR_PIN_INVALID', 'PIN de supervisor incorrecto.', 403));
    }

    const override = await this.prisma.$transaction(
      async (tx) => {
        const created = await tx.supervisorOverride.create({
        data: {
          requesterId: input.requesterId,
          approverId: supervisor.id,
          actionCode: input.actionCode,
          reason: input.reason.trim(),
          documentType: input.documentType,
          documentId: input.documentId,
          terminalId: input.terminalId,
      },
    });

      await this.audit.record(
        {
          userId: input.requesterId,
          ipAddress: input.ipAddress,
          terminalId: input.terminalId,
          module: 'IAM',
          action: 'SUPERVISOR_OVERRIDE',
          documentType: input.documentType,
          documentId: input.documentId,
          afterState: {
            overrideId: created.id,
            approverId: supervisor.id,
            actionCode: input.actionCode,
            reason: created.reason,
          },
        },
        tx,
      );

      return created;
    });

    // Token efímero de un solo uso (120 segundos) para el siguiente request del cajero
    const overrideToken = randomUUID();
    const expiresInSeconds = 120;
    await this.redis.set(
      `override:${overrideToken}`,
      JSON.stringify({
        overrideId: override.id,
        requesterId: input.requesterId,
        approverId: supervisor.id,
        actionCode: input.actionCode,
      }),
      'EX',
      expiresInSeconds,
    );

    return ok({
      overrideId: override.id,
      overrideToken,
      expiresInSeconds,
      approverName: supervisor.fullName,
    });
  }
}