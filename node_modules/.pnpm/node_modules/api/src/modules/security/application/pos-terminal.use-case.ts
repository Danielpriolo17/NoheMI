import { Inject, Injectable } from '@nestjs/common';
import { FraudSeverity, Prisma } from '@prisma/client';
import {
  AUDIT_LOGGER_PORT,
  AuditLoggerPort,
} from '../../../shared/application/ports';
import { DomainError, domainError } from '../../../shared/domain/domain-error';
import { err, ok, Result } from '../../../shared/domain/result';
import { PrismaService } from '../../../shared/infra/prisma.service';
import { AuthenticatedUser } from '../domain/auth.types';
import { SupervisorOverrideUseCase } from './supervisor-override.use-case';

@Injectable()
export class PosTerminalUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly overrideUseCase: SupervisorOverrideUseCase,
    @Inject(AUDIT_LOGGER_PORT)
    private readonly auditLogger: AuditLoggerPort,
  ) {}

  async createTerminal(
    actor: AuthenticatedUser,
    input: {
      branchId: string;
      defaultWarehouseId: string;
      primaryResolutionId?: string;
      contingencyResolutionId?: string;
      code: string;
      name: string;
      maxCashAllowed: number;
      thermalPrinterConfig?: Record<string, unknown>;
      laserPrinterConfig?: Record<string, unknown>;
      scaleSerialConfig?: Record<string, unknown>;
    },
    ipAddress?: string,
  ): Promise<Result<Record<string, unknown>, DomainError>> {
    const code = input.code.trim().toUpperCase();
    const [warehouse, existing] = await Promise.all([
      this.prisma.warehouse.findUnique({
        where: { id: input.defaultWarehouseId },
      }),
      this.prisma.posTerminal.findUnique({ where: { code } }),
    ]);

    if (!warehouse || warehouse.branchId !== input.branchId) {
      return err(
        domainError(
          'VALIDATION_ERROR',
          'La bodega predeterminada no pertenece a la sucursal indicada.',
          400,
        ),
      );
    }

    if (!warehouse.allowsDirectSales) {
      return err(
        domainError(
          'VALIDATION_ERROR',
          'La bodega predeterminada de una caja POS debe permitir facturación directa.',
          400,
        ),
      );
    }

    if (existing) {
      return err(
        domainError('CONFLICT', `Ya existe una terminal POS con código ${code}.`, 409),
      );
    }

    const terminal = await this.prisma.posTerminal.create({
      data: {
        branchId: input.branchId,
        defaultWarehouseId: input.defaultWarehouseId,
        primaryResolutionId: input.primaryResolutionId ?? null,
        contingencyResolutionId: input.contingencyResolutionId ?? null,
        code,
        name: input.name.trim(),
        maxCashAllowed: input.maxCashAllowed,
        thermalPrinterConfig: input.thermalPrinterConfig
          ? (input.thermalPrinterConfig as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        laserPrinterConfig: input.laserPrinterConfig
          ? (input.laserPrinterConfig as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        scaleSerialConfig: input.scaleSerialConfig
          ? (input.scaleSerialConfig as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });

    await this.auditLogger.log({
      userId: actor.userId,
      branchId: actor.branchId,
      ipAddress,
      module: 'SECURITY_POS',
      action: 'POS_TERMINAL_CREATED',
      entityName: 'PosTerminal',
      entityId: terminal.id,
      afterData: {
        code: terminal.code,
        maxCashAllowed: terminal.maxCashAllowed.toString(),
      },
    });

    return ok(terminal as unknown as Record<string, unknown>);
  }

  async listTerminals(branchId?: string) {
    return this.prisma.posTerminal.findMany({
      where: branchId ? { branchId } : undefined,
      include: {
        defaultWarehouse: { select: { id: true, code: true, name: true } },
        primaryResolution: { select: { id: true, prefix: true, validUntil: true } },
        contingencyResolution: {
          select: { id: true, prefix: true, validUntil: true },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Registra toda apertura manual del cajón monedero fuera de venta/devolución (RF-04).
   * Si no trae token de supervisor válido, queda marcada como anómala y genera alerta antifraude.
   */
  async registerManualDrawerOpen(
    actor: AuthenticatedUser,
    input: {
      terminalId: string;
      shiftId?: string;
      reason: string;
      overrideToken?: string;
    },
    ipAddress?: string,
  ): Promise<Result<Record<string, unknown>, DomainError>> {
    const terminal = await this.prisma.posTerminal.findUnique({
      where: { id: input.terminalId },
    });
    if (!terminal) {
      return err(domainError('NOT_FOUND', 'Terminal POS no encontrada.', 404));
    }

    let isAuthorized = false;
    let supervisorId: string | null = null;

    if (input.overrideToken) {
      const verified = await this.overrideUseCase.verifyAndConsume({
        overrideToken: input.overrideToken,
        expectedRequesterId: actor.userId,
        expectedActionCode: 'MANUAL_CASH_DRAWER_OPEN',
        expectedReferenceId: input.terminalId,
      });

      if (verified.isErr) {
        return err(verified.error);
      }

      isAuthorized = true;
      supervisorId = verified.value.approverId;
    }

    const event = await this.prisma.cashDrawerEvent.create({
      data: {
        terminalId: terminal.id,
        userId: actor.userId,
        shiftId: input.shiftId ?? null,
        reason: input.reason.trim(),
        isAuthorized,
      },
    });

    if (!isAuthorized) {
      await this.prisma.fraudAlert.create({
        data: {
          ruleCode: 'ANOMALOUS_CASH_DRAWER_OPEN',
          severity: FraudSeverity.ALTA,
          branchId: terminal.branchId,
          userId: actor.userId,
          description: `Apertura manual de cajón monedero sin autorización en terminal ${terminal.code}. Motivo: ${input.reason}`,
          payload: {
            terminalId: terminal.id,
            drawerEventId: event.id,
            shiftId: input.shiftId ?? null,
          },
        },
      });
    }

    await this.auditLogger.log({
      userId: actor.userId,
      supervisorId,
      branchId: terminal.branchId,
      terminalId: terminal.id,
      ipAddress,
      module: 'SECURITY_POS',
      action: isAuthorized
        ? 'CASH_DRAWER_MANUAL_AUTHORIZED'
        : 'CASH_DRAWER_ANOMALOUS_OPEN',
      entityName: 'CashDrawerEvent',
      entityId: event.id,
      afterData: { reason: event.reason, isAuthorized },
    });

    return ok(event as unknown as Record<string, unknown>);
  }

  async listAnomalousDrawerEvents(terminalId?: string) {
    return this.prisma.cashDrawerEvent.findMany({
      where: {
        isAuthorized: false,
        ...(terminalId ? { terminalId } : {}),
      },
      include: {
        terminal: { select: { code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}