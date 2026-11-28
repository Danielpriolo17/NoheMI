import { Inject, Injectable } from '@nestjs/common';
import { FiscalDocumentType } from '@prisma/client';
import {
  AUDIT_LOGGER_PORT,
  AuditLoggerPort,
  TransactionClient,
} from '../../../shared/application/ports';
import { DomainError, domainError } from '../../../shared/domain/domain-error';
import { err, ok, Result } from '../../../shared/domain/result';
import { PrismaService } from '../../../shared/infra/prisma.service';
import { AuthenticatedUser } from '../domain/auth.types';

export interface NextSequenceResult {
  resolutionId: string;
  prefix: string;
  consecutive: bigint;
  fullNumber: string;
  isContingency: boolean;
  warnings: string[];
}

export interface ResolutionAlertStatus {
  id: string;
  branchId: string;
  documentType: FiscalDocumentType;
  resolutionNumber: string;
  prefix: string;
  rangeStart: string;
  rangeEnd: string;
  currentNumber: string;
  usagePercent: number;
  daysRemaining: number;
  validFrom: string;
  validUntil: string;
  isContingency: boolean;
  isActive: boolean;
  alerts: string[];
}

interface LockedResolutionRow {
  id: string;
  prefix: string;
  rangeStart: bigint;
  rangeEnd: bigint;
  currentNumber: bigint;
  validFrom: Date;
  validUntil: Date;
  isContingency: boolean;
  isActive: boolean;
}

@Injectable()
export class FiscalSequenceService {
  private static readonly USAGE_ALERT_THRESHOLD_PCT = 85;
  private static readonly EXPIRY_ALERT_DAYS = 15;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUDIT_LOGGER_PORT)
    private readonly auditLogger: AuditLoggerPort,
  ) {}

  /**
   * Reserva el siguiente consecutivo fiscal SIN SALTOS bajo bloqueo pesimista FOR UPDATE.
   * Debe invocarse dentro de una transacción ACID (UnitOfWork).
   */
  async allocateNext(
    tx: TransactionClient,
    resolutionId: string,
  ): Promise<Result<NextSequenceResult, DomainError>> {
    const rows = await tx.$queryRaw<LockedResolutionRow[]>`
      SELECT
        "id",
        "prefix",
        "rangeStart",
        "rangeEnd",
        "currentNumber",
        "validFrom",
        "validUntil",
        "isContingency",
        "isActive"
      FROM "fiscal_resolutions"
      WHERE "id" = ${resolutionId}::uuid
      FOR UPDATE
    `;

    const res = rows[0];
    if (!res || !res.isActive) {
      return err(
        domainError(
          'NOT_FOUND',
          'La resolución fiscal no existe o se encuentra inactiva.',
          404,
        ),
      );
    }

    const now = new Date();
    if (now < res.validFrom || now > res.validUntil) {
      return err(
        domainError(
          'FISCAL_SEQUENCE_EXHAUSTED',
          `La resolución con prefijo ${res.prefix} está vencida o aún no es vigente.`,
          422,
          {
            validFrom: res.validFrom.toISOString(),
            validUntil: res.validUntil.toISOString(),
          },
        ),
      );
    }

    const start = BigInt(res.rangeStart);
    const end = BigInt(res.rangeEnd);
    const current = BigInt(res.currentNumber);
    const nextNumber = current < start ? start : current + 1n;

    if (nextNumber > end) {
      return err(
        domainError(
          'FISCAL_SEQUENCE_EXHAUSTED',
          `Rango fiscal agotado para el prefijo ${res.prefix} (límite ${end.toString()}).`,
          422,
        ),
      );
    }

    await tx.fiscalResolution.update({
      where: { id: res.id },
      data: { currentNumber: nextNumber },
    });

    const { usagePercent, daysRemaining, alerts } = this.evaluateAlerts(
      start,
      end,
      nextNumber,
      res.validUntil,
    );

    if (alerts.length > 0) {
      await tx.outboxEvent.create({
        data: {
          eventType: 'FISCAL_RESOLUTION_WARNING',
          aggregateId: res.id,
          payload: {
            prefix: res.prefix,
            currentNumber: nextNumber.toString(),
            usagePercent,
            daysRemaining,
            alerts,
          },
        },
      });
    }

    return ok({
      resolutionId: res.id,
      prefix: res.prefix,
      consecutive: nextNumber,
      fullNumber: `${res.prefix}-${nextNumber.toString()}`,
      isContingency: res.isContingency,
      warnings: alerts,
    });
  }

  async createResolution(
    actor: AuthenticatedUser,
    input: {
      branchId: string;
      documentType: FiscalDocumentType;
      resolutionNumber: string;
      prefix: string;
      rangeStart: number;
      rangeEnd: number;
      validFrom: Date;
      validUntil: Date;
      isContingency: boolean;
    },
    ipAddress?: string,
  ): Promise<Result<ResolutionAlertStatus, DomainError>> {
    if (input.rangeEnd <= input.rangeStart) {
      return err(
        domainError(
          'VALIDATION_ERROR',
          'El rango final debe ser estrictamente mayor al rango inicial.',
          400,
        ),
      );
    }

    if (input.validUntil <= input.validFrom) {
      return err(
        domainError(
          'VALIDATION_ERROR',
          'La fecha de vencimiento fiscal debe ser posterior a la fecha inicial.',
          400,
        ),
      );
    }

    const prefix = input.prefix.trim().toUpperCase();
    const existing = await this.prisma.fiscalResolution.findUnique({
      where: {
        branchId_prefix_documentType: {
          branchId: input.branchId,
          prefix,
          documentType: input.documentType,
        },
      },
    });

    if (existing) {
      return err(
        domainError(
          'CONFLICT',
          `Ya existe una resolución con prefijo ${prefix} para ese tipo de documento en la sede.`,
          409,
        ),
      );
    }

    const startBig = BigInt(input.rangeStart);
    const created = await this.prisma.fiscalResolution.create({
      data: {
        branchId: input.branchId,
        documentType: input.documentType,
        resolutionNumber: input.resolutionNumber.trim(),
        prefix,
        rangeStart: startBig,
        rangeEnd: BigInt(input.rangeEnd),
        currentNumber: startBig - 1n,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        isContingency: input.isContingency,
      },
    });

    const mapped = this.toAlertStatus(created);

    await this.auditLogger.log({
      userId: actor.userId,
      branchId: actor.branchId,
      ipAddress,
      module: 'SECURITY_FISCAL',
      action: 'FISCAL_RESOLUTION_CREATED',
      entityName: 'FiscalResolution',
      entityId: created.id,
      afterData: mapped as unknown as Record<string, unknown>,
    });

    return ok(mapped);
  }

  async listResolutions(branchId?: string): Promise<ResolutionAlertStatus[]> {
    const items = await this.prisma.fiscalResolution.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: [{ isActive: 'desc' }, { validUntil: 'asc' }],
    });
    return items.map((r) => this.toAlertStatus(r));
  }

  async listTaxRules() {
    return this.prisma.taxRule.findMany({
      orderBy: [{ taxType: 'asc' }, { ratePercent: 'desc' }],
    });
  }

  async createTaxRule(
    actor: AuthenticatedUser,
    input: {
      code: string;
      name: string;
      taxType: string;
      ratePercent: number;
      minBaseAmount?: number;
      isRetention: boolean;
    },
    ipAddress?: string,
  ): Promise<Result<Record<string, unknown>, DomainError>> {
    const code = input.code.trim().toUpperCase();
    const exists = await this.prisma.taxRule.findUnique({ where: { code } });
    if (exists) {
      return err(
        domainError('CONFLICT', `Ya existe una regla tributaria con código ${code}.`, 409),
      );
    }

    const created = await this.prisma.taxRule.create({
      data: {
        code,
        name: input.name.trim(),
        taxType: input.taxType.trim().toUpperCase(),
        ratePercent: input.ratePercent,
        minBaseAmount: input.minBaseAmount ?? 0,
        isRetention: input.isRetention,
      },
    });

    await this.auditLogger.log({
      userId: actor.userId,
      branchId: actor.branchId,
      ipAddress,
      module: 'SECURITY_FISCAL',
      action: 'TAX_RULE_CREATED',
      entityName: 'TaxRule',
      entityId: created.id,
      afterData: {
        code: created.code,
        taxType: created.taxType,
        ratePercent: created.ratePercent.toString(),
      },
    });

    return ok(created as unknown as Record<string, unknown>);
  }

  private toAlertStatus(r: {
    id: string;
    branchId: string;
    documentType: FiscalDocumentType;
    resolutionNumber: string;
    prefix: string;
    rangeStart: bigint;
    rangeEnd: bigint;
    currentNumber: bigint;
    validFrom: Date;
    validUntil: Date;
    isContingency: boolean;
    isActive: boolean;
  }): ResolutionAlertStatus {
    const { usagePercent, daysRemaining, alerts } = this.evaluateAlerts(
      r.rangeStart,
      r.rangeEnd,
      r.currentNumber,
      r.validUntil,
    );

    return {
      id: r.id,
      branchId: r.branchId,
      documentType: r.documentType,
      resolutionNumber: r.resolutionNumber,
      prefix: r.prefix,
      rangeStart: r.rangeStart.toString(),
      rangeEnd: r.rangeEnd.toString(),
      currentNumber: r.currentNumber.toString(),
      usagePercent,
      daysRemaining,
      validFrom: r.validFrom.toISOString(),
      validUntil: r.validUntil.toISOString(),
      isContingency: r.isContingency,
      isActive: r.isActive,
      alerts,
    };
  }

  private evaluateAlerts(
    start: bigint,
    end: bigint,
    current: bigint,
    validUntil: Date,
  ): { usagePercent: number; daysRemaining: number; alerts: string[] } {
    const totalCapacity = Number(end - start + 1n);
    const consumed = current < start ? 0 : Number(current - start + 1n);
    const usagePercent =
      totalCapacity > 0
        ? Number(((consumed / totalCapacity) * 100).toFixed(2))
        : 100;

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.ceil(
      (validUntil.getTime() - Date.now()) / msPerDay,
    );

    const alerts: string[] = [];
    if (usagePercent >= FiscalSequenceService.USAGE_ALERT_THRESHOLD_PCT) {
      alerts.push(
        `Consumo de rango fiscal en ${usagePercent}% (umbral preventivo 85%).`,
      );
    }
    if (daysRemaining <= FiscalSequenceService.EXPIRY_ALERT_DAYS) {
      alerts.push(
        daysRemaining <= 0
          ? 'Resolución fiscal vencida.'
          : `Faltan ${daysRemaining} días para el vencimiento de la resolución (umbral 15 días).`,
      );
    }

    return { usagePercent, daysRemaining, alerts };
  }
}