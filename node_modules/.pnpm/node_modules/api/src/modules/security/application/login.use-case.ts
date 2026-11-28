import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import {
  AUDIT_LOGGER_PORT,
  AuditLoggerPort,
} from '../../../shared/application/ports';
import { DomainError, domainError } from '../../../shared/domain/domain-error';
import { err, ok, Result } from '../../../shared/domain/result';
import {
  PASSWORD_HASHER_PORT,
  PasswordHasherPort,
  SECURITY_REPO_PORT,
  SecurityRepositoryPort,
  SESSION_STORE_PORT,
  SessionStorePort,
} from '../domain/security.ports';

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

@Injectable()
export class LoginUseCase {
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCK_DURATION_MINUTES = 15;

  constructor(
    @Inject(SECURITY_REPO_PORT)
    private readonly securityRepo: SecurityRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly hasher: PasswordHasherPort,
    @Inject(SESSION_STORE_PORT)
    private readonly sessionStore: SessionStorePort,
    @Inject(AUDIT_LOGGER_PORT)
    private readonly auditLogger: AuditLoggerPort,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(input: LoginInput): Promise<Result<LoginOutput, DomainError>> {
    const user = await this.securityRepo.findByUsername(input.username.trim());

    if (!user || !user.isActive) {
      await this.auditLogger.log({
        ipAddress: input.ipAddress,
        terminalId: input.terminalId,
        module: 'SECURITY',
        action: 'LOGIN_FAILED_UNKNOWN_OR_INACTIVE',
        entityName: 'User',
        entityId: input.username,
      });
      return err(
        domainError('UNAUTHORIZED', 'Credenciales inválidas o usuario inactivo.', 401),
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return err(
        domainError(
          'UNAUTHORIZED',
          'Cuenta bloqueada temporalmente por múltiples intentos fallidos.',
          423,
          { lockedUntil: user.lockedUntil.toISOString() },
        ),
      );
    }

    const passwordMatches = await this.hasher.verify(
      user.passwordHash,
      input.password,
    );

    if (!passwordMatches) {
      const nextAttempts = user.failedLoginCount + 1;
      const shouldLock = nextAttempts >= LoginUseCase.MAX_FAILED_ATTEMPTS;
      const lockedUntil = shouldLock
        ? new Date(Date.now() + LoginUseCase.LOCK_DURATION_MINUTES * 60 * 1000)
        : null;

      await this.securityRepo.recordFailedLogin(user.id, nextAttempts, lockedUntil);
      await this.auditLogger.log({
        userId: user.id,
        branchId: user.branchId,
        terminalId: input.terminalId,
        ipAddress: input.ipAddress,
        module: 'SECURITY',
        action: shouldLock ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED_BAD_PASSWORD',
        entityName: 'User',
        entityId: user.id,
        metadata: { failedAttempts: nextAttempts },
      });

      return err(domainError('UNAUTHORIZED', 'Credenciales inválidas.', 401));
    }

    // Validación de franja horaria permitida (RF-01)
    if (!this.isWithinAllowedSchedule(user.allowedWorkStart, user.allowedWorkEnd)) {
      await this.auditLogger.log({
        userId: user.id,
        branchId: user.branchId,
        terminalId: input.terminalId,
        ipAddress: input.ipAddress,
        module: 'SECURITY',
        action: 'LOGIN_BLOCKED_OUTSIDE_SCHEDULE',
        entityName: 'User',
        entityId: user.id,
        metadata: {
          allowedStart: user.allowedWorkStart,
          allowedEnd: user.allowedWorkEnd,
        },
      });
      return err(
        domainError(
          'FORBIDDEN',
          'Acceso denegado fuera del horario operativo autorizado.',
          403,
        ),
      );
    }

    const sessionId = uuidv4();
    const idleTimeoutSeconds = Number(
      this.config.get<string>('POS_IDLE_TIMEOUT_SECONDS', '300'),
    );

    await this.securityRepo.recordSuccessfulLogin(user.id);
    await this.sessionStore.saveActiveSession(
      sessionId,
      {
        userId: user.id,
        branchId: user.branchId,
        terminalId: input.terminalId,
        roleCode: user.role.code,
        lastSeenAt: new Date().toISOString(),
      },
      idleTimeoutSeconds,
    );

    const accessToken = await this.jwtService.signAsync({
      sid: sessionId,
      sub: user.id,
      username: user.username,
      branchId: user.branchId,
      terminalId: input.terminalId,
      role: user.role.code,
    });

    await this.auditLogger.log({
      userId: user.id,
      branchId: user.branchId,
      terminalId: input.terminalId,
      ipAddress: input.ipAddress,
      module: 'SECURITY',
      action: 'LOGIN_SUCCESS',
      entityName: 'User',
      entityId: user.id,
      metadata: { sessionId },
    });

    return ok({
      accessToken,
      idleTimeoutSeconds,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        branchId: user.branchId,
        roleCode: user.role.code,
        canViewCosts: user.role.canViewCosts,
        canViewCashExpected: user.role.canViewCashExpected,
        canApproveOverride: user.role.canApproveOverride,
      },
    });
  }

  private isWithinAllowedSchedule(
    start: string | null,
    end: string | null,
  ): boolean {
    if (!start || !end) return true;
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes(),
    ).padStart(2, '0')}`;
    return hhmm >= start && hhmm <= end;
  }
}