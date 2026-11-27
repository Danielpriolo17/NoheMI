import { Inject, Injectable } from '@nestjs/common';
import { AUDIT_PORT, AuditPort } from '../../../shared/domain/audit.port';
import { Result, err, ok } from '../../../shared/domain/result';
import { DomainError, domainError } from '../../../shared/domain/domain-error';

type AuditTransaction = NonNullable<Parameters<AuditPort['record']>[1]>;

export interface NextSequenceResult {
  sequenceId: string;
  prefix: string;
  consecutive: bigint;
  fullNumber: string;
  resolutionNumber: string | null;
  alerts: string[];
}

interface LockedSequenceRow {
  id: string;
  prefix: string;
  resolutionNumber: string | null;
  rangeFrom: bigint;
  rangeTo: bigint;
  currentNumber: bigint;
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
}

@Injectable()
export class NextFiscalSequenceUseCase {
  constructor(@Inject(AUDIT_PORT) private readonly audit: AuditPort) {}

  /**
   * Debe ejecutarse DENTRO de la transacción ACID del documento (Factura, NC, Remisión, etc.)
   * para garantizar cero saltos si la operación hace rollback.
   */
  async executeInTx(
    tx: AuditTransaction,
    params: { branchId: string; docType: string; isContingency?: boolean; userId: string },
  ): Promise<Result<NextSequenceResult, DomainError>> {
    const isContingency = params.isContingency ?? false;

    const rows = await tx.$queryRaw<LockedSequenceRow[]>`
      SELECT id, prefix, "resolutionNumber", "rangeFrom", "rangeTo",
             "currentNumber", "validFrom", "validTo", "isActive"
      FROM "FiscalSequence"
      WHERE "branchId" = ${params.branchId}
        AND "docType"::text = ${params.docType}
        AND "isContingency" = ${isContingency}
        AND "isActive" = true
      ORDER BY "validTo" ASC
      LIMIT 1
      FOR UPDATE
    `;

    const seq = rows[0];
    if (!seq) {
      return err(
        domainError(
          'FISCAL_SEQUENCE_EXHAUSTED',
          `No existe resolución DIAN activa para ${params.docType} (contingencia=${isContingency}).`,
          409,
        ),
      );
    }

    const now = new Date();
    if (now < seq.validFrom || now > seq.validTo) {
      return err(
        domainError(
          'FISCAL_SEQUENCE_EXHAUSTED',
          `Resolución DIAN ${seq.resolutionNumber ?? seq.prefix} fuera de vigencia.`,
          409,
        ),
      );
    }

    const nextNumber = seq.currentNumber === 0n ? seq.rangeFrom : seq.currentNumber + 1n;
    if (nextNumber > seq.rangeTo) {
      return err(
        domainError(
          'FISCAL_SEQUENCE_EXHAUSTED',
          `Rango autorizado agotado para prefijo ${seq.prefix} (límite ${seq.rangeTo}).`,
          409,
        ),
      );
    }

    await tx.fiscalSequence.update({
      where: { id: seq.id },
      data: { currentNumber: nextNumber },
    });

    // Cálculo de alertas preventivas (RF-03: 85% de uso o <=15 días de vencimiento)
    const alerts: string[] = [];
    const totalRange = Number(seq.rangeTo - seq.rangeFrom) + 1;
    const usedCount = Number(nextNumber - seq.rangeFrom + 1);
    const usagePct = (usedCount / totalRange) * 100;

    if (usagePct >= 85) {
      alerts.push(
        `ALERTA DIAN: Prefijo ${seq.prefix} alcanzó ${usagePct.toFixed(1)}% del rango autorizado.`,
      );
    }

    const daysRemaining = Math.ceil((seq.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 15) {
      alerts.push(
        `ALERTA DIAN: Resolución ${seq.resolutionNumber ?? seq.prefix} vence en ${daysRemaining} días.`,
      );
    }

    if (alerts.length > 0) {
      await this.audit.record(
        {
          userId: params.userId,
          module: 'FISCAL_DIAN',
          action: 'FISCAL_SEQUENCE_ALERT',
          documentType: params.docType,
          documentId: seq.id,
          afterState: { prefix: seq.prefix, nextNumber: nextNumber.toString(), alerts },
        },
        tx,
      );
    }

    return ok({
      sequenceId: seq.id,
      prefix: seq.prefix,
      consecutive: nextNumber,
      fullNumber: `${seq.prefix}-${nextNumber.toString()}`,
      resolutionNumber: seq.resolutionNumber,
      alerts,
    });
  }
}