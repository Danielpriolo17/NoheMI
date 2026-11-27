"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextFiscalSequenceUseCase = void 0;
const common_1 = require("@nestjs/common");
const audit_port_1 = require("../../../shared/domain/audit.port");
const result_1 = require("../../../shared/domain/result");
const domain_error_1 = require("../../../shared/domain/domain-error");
let NextFiscalSequenceUseCase = class NextFiscalSequenceUseCase {
    constructor(audit) {
        this.audit = audit;
    }
    async executeInTx(tx, params) {
        const isContingency = params.isContingency ?? false;
        const rows = await tx.$queryRaw `
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
            return (0, result_1.err)((0, domain_error_1.domainError)('FISCAL_SEQUENCE_EXHAUSTED', `No existe resolución DIAN activa para ${params.docType} (contingencia=${isContingency}).`, 409));
        }
        const now = new Date();
        if (now < seq.validFrom || now > seq.validTo) {
            return (0, result_1.err)((0, domain_error_1.domainError)('FISCAL_SEQUENCE_EXHAUSTED', `Resolución DIAN ${seq.resolutionNumber ?? seq.prefix} fuera de vigencia.`, 409));
        }
        const nextNumber = seq.currentNumber === 0n ? seq.rangeFrom : seq.currentNumber + 1n;
        if (nextNumber > seq.rangeTo) {
            return (0, result_1.err)((0, domain_error_1.domainError)('FISCAL_SEQUENCE_EXHAUSTED', `Rango autorizado agotado para prefijo ${seq.prefix} (límite ${seq.rangeTo}).`, 409));
        }
        await tx.fiscalSequence.update({
            where: { id: seq.id },
            data: { currentNumber: nextNumber },
        });
        const alerts = [];
        const totalRange = Number(seq.rangeTo - seq.rangeFrom) + 1;
        const usedCount = Number(nextNumber - seq.rangeFrom + 1);
        const usagePct = (usedCount / totalRange) * 100;
        if (usagePct >= 85) {
            alerts.push(`ALERTA DIAN: Prefijo ${seq.prefix} alcanzó ${usagePct.toFixed(1)}% del rango autorizado.`);
        }
        const daysRemaining = Math.ceil((seq.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysRemaining <= 15) {
            alerts.push(`ALERTA DIAN: Resolución ${seq.resolutionNumber ?? seq.prefix} vence en ${daysRemaining} días.`);
        }
        if (alerts.length > 0) {
            await this.audit.record({
                userId: params.userId,
                module: 'FISCAL_DIAN',
                action: 'FISCAL_SEQUENCE_ALERT',
                documentType: params.docType,
                documentId: seq.id,
                afterState: { prefix: seq.prefix, nextNumber: nextNumber.toString(), alerts },
            }, tx);
        }
        return (0, result_1.ok)({
            sequenceId: seq.id,
            prefix: seq.prefix,
            consecutive: nextNumber,
            fullNumber: `${seq.prefix}-${nextNumber.toString()}`,
            resolutionNumber: seq.resolutionNumber,
            alerts,
        });
    }
};
exports.NextFiscalSequenceUseCase = NextFiscalSequenceUseCase;
exports.NextFiscalSequenceUseCase = NextFiscalSequenceUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(audit_port_1.AUDIT_PORT)),
    __metadata("design:paramtypes", [Object])
], NextFiscalSequenceUseCase);
//# sourceMappingURL=next-fiscal-sequence.usecase.js.map