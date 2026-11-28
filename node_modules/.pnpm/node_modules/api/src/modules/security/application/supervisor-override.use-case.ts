import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import {
  AUDIT_LOGGER_PORT,
  AuditLoggerPort,
} from '../../../shared/application/ports';
import { DomainError, domainError } from '../../../shared/domain/domain-error';
import { err, ok, Result } from '../../../shared/domain/result';
import { AuthenticatedUser, OverrideActionCode } from '../domain/auth.types';
import {
  PASSWORD_HASHER_PORT,
  PasswordHasherPort,
  SECURITY_REPO_PORT,
  SecurityRepositoryPort,
  SESSION_STORE_PORT,
  SessionStorePort,
  SupervisorOverrideTokenPayload,
} from '../domain/security.ports';

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

@Injectable()
export class SupervisorOverrideUseCase {
  constructor(
    @Inject(SECURITY_REPO_PORT)
    private readonly securityRepo: SecurityRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly hasher: PasswordHasherPort,
    @Inject(SESSION_STORE_PORT)
    private readonly sessionStore: SessionStorePort,
    @Inject(AUDIT_LOGGER_PORT)
    private readonly auditLogger: AuditLoggerPort,
    private readonly config: ConfigService,
  ) {}

  /**
   * Emite un token de aprobación de un solo uso sin cerrar la sesión del operador.
   */
  async authorize(
    input: RequestOverrideInput,
  ): Promise<Result<RequestOverrideOutput, DomainError>> {
    const supervisor = await this.securityRepo.findByUsername(
      input.supervisorUsername.trim(),
    );

    if (
      !supervisor ||
      !supervisor.isActive ||
      !supervisor.role.canApproveOverride ||
      !supervisor.supervisorPinHash
    ) {
      await this.auditLogger.log({
        userId: input.requester.userId,
        branchId: input.requester.branchId,
        terminalId: input.requester.terminalId,
        ipAddress: input.ipAddress,
        module: 'SECURITY',
        action: 'SUPERVISOR_OVERRIDE_DENIED_ROLE',
        entityName: input.referenceType,
        entityId: input.referenceId,
        metadata: {
          attemptedSupervisor: input.supervisorUsername,
          actionCode: input.actionCode,
        },
      });
      return err(
        domainError(
          'INVALID_SUPERVISOR_PIN',
          'El usuario indicado no tiene privilegios de supervisor o no tiene PIN configurado.',
          403,
        ),
      );
    }

    // Segregación de funciones: un operador no puede autoaprobarse si es la misma persona
    if (
      supervisor.id === input.requester.userId &&
      supervisor.role.code !== 'ADMIN_GERENCIA'
    ) {
      return err(
        domainError(
          'FORBIDDEN',
          'Segregación de funciones: un usuario operativo no puede autoaprobar excepciones.',
          403,
        ),
      );
    }

    const pinValid = await this.hasher.verify(
      supervisor.supervisorPinHash,
      input.supervisorPin,
    );

    if (!pinValid) {
      await this.auditLogger.log({
        userId: input.requester.userId,
        supervisorId: supervisor.id,
        branchId: input.requester.branchId,
        terminalId: input.requester.terminalId,
        ipAddress: input.ipAddress,
        module: 'SECURITY',
        action: 'SUPERVISOR_OVERRIDE_INVALID_PIN',
        entityName: input.referenceType,
        entityId: input.referenceId,
        metadata: { actionCode: input.actionCode },
      });
      return err(
        domainError('INVALID_SUPERVISOR_PIN', 'PIN de supervisor incorrecto.', 401),
      );
    }

    const ttlSeconds = Number(
      this.config.get<string>('SUPERVISOR_OVERRIDE_TTL_SECONDS', '60'),
    );
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const logRecord = await this.securityRepo.createOverrideLog({
      requesterId: input.requester.userId,
      approverId: supervisor.id,
      actionCode: input.actionCode,
      reason: input.reason,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      expiresAt,
    });

    const overrideToken = uuidv4();
    await this.sessionStore.saveOverrideToken(
      overrideToken,
      {
        overrideLogId: logRecord.id,
        requesterId: input.requester.userId,
        approverId: supervisor.id,
        actionCode: input.actionCode,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
      },
      ttlSeconds,
    );

    await this.auditLogger.log({
      userId: input.requester.userId,
      supervisorId: supervisor.id,
      branchId: input.requester.branchId,
      terminalId: input.requester.terminalId,
      ipAddress: input.ipAddress,
      module: 'SECURITY',
      action: 'SUPERVISOR_OVERRIDE_GRANTED',
      entityName: input.referenceType,
      entityId: input.referenceId,
      afterData: {
        overrideLogId: logRecord.id,
        actionCode: input.actionCode,
        reason: input.reason,
      },
    });

    return ok({
      overrideToken,
      overrideLogId: logRecord.id,
      approverName: supervisor.fullName,
      expiresInSeconds: ttlSeconds,
    });
  }

  /**
   * Consumido internamente por casos de uso críticos (anulación, descuento, cupo).
   */
  async verifyAndConsume(params: {
    overrideToken: string;
    expectedRequesterId: string;
    expectedActionCode: OverrideActionCode;
    expectedReferenceId: string;
  }): Promise<Result<SupervisorOverrideTokenPayload, DomainError>> {
    const payload = await this.sessionStore.consumeOverrideToken(
      params.overrideToken,
    );

    if (!payload) {
      return err(
        domainError(
          'SUPERVISOR_OVERRIDE_REQUIRED',
          'El token de autorización de supervisor expiró o ya fue utilizado.',
          403,
        ),
      );
    }

    if (
      payload.requesterId !== params.expectedRequesterId ||
      payload.actionCode !== params.expectedActionCode ||
      payload.referenceId !== params.expectedReferenceId
    ) {
      return err(
        domainError(
          'FORBIDDEN',
          'El token de supervisor no corresponde a la operación o usuario actual.',
          403,
        ),
      );
    }

    await this.securityRepo.markOverrideLogUsed(payload.overrideLogId);
    return ok(payload);
  }
}