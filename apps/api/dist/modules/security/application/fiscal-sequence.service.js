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
var FiscalSequenceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiscalSequenceService = void 0;
const common_1 = require("@nestjs/common");
const ports_1 = require("../../../shared/application/ports");
const domain_error_1 = require("../../../shared/domain/domain-error");
const result_1 = require("../../../shared/domain/result");
const prisma_service_1 = require("../../../shared/infra/prisma.service");
let FiscalSequenceService = class FiscalSequenceService {
    static { FiscalSequenceService_1 = this; }
    prisma;
    auditLogger;
    static USAGE_ALERT_THRESHOLD_PCT = 85;
    static EXPIRY_ALERT_DAYS = 15;
    constructor(prisma, auditLogger) {
        this.prisma = prisma;
        this.auditLogger = auditLogger;
    }
    async allocateNext(tx, resolutionId) {
        const rows = await tx.$queryRaw `
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
            return (0, result_1.err)((0, domain_error_1.domainError)('NOT_FOUND', 'La resolución fiscal no existe o se encuentra inactiva.', 404));
        }
        const now = new Date();
        if (now < res.validFrom || now > res.validUntil) {
            return (0, result_1.err)((0, domain_error_1.domainError)('FISCAL_SEQUENCE_EXHAUSTED', `La resolución con prefijo ${res.prefix} está vencida o aún no es vigente.`, 422, {
                validFrom: res.validFrom.toISOString(),
                validUntil: res.validUntil.toISOString(),
            }));
        }
        const start = BigInt(res.rangeStart);
        const end = BigInt(res.rangeEnd);
        const current = BigInt(res.currentNumber);
        const nextNumber = current < start ? start : current + 1n;
        if (nextNumber > end) {
            return (0, result_1.err)((0, domain_error_1.domainError)('FISCAL_SEQUENCE_EXHAUSTED', `Rango fiscal agotado para el prefijo ${res.prefix} (límite ${end.toString()}).`, 422));
        }
        await tx.fiscalResolution.update({
            where: { id: res.id },
            data: { currentNumber: nextNumber },
        });
        const { usagePercent, daysRemaining, alerts } = this.evaluateAlerts(start, end, nextNumber, res.validUntil);
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
        return (0, result_1.ok)({
            resolutionId: res.id,
            prefix: res.prefix,
            consecutive: nextNumber,
            fullNumber: `${res.prefix}-${nextNumber.toString()}`,
            isContingency: res.isContingency,
            warnings: alerts,
        });
    }
    async createResolution(actor, input, ipAddress) {
        if (input.rangeEnd <= input.rangeStart) {
            return (0, result_1.err)((0, domain_error_1.domainError)('VALIDATION_ERROR', 'El rango final debe ser estrictamente mayor al rango inicial.', 400));
        }
        if (input.validUntil <= input.validFrom) {
            return (0, result_1.err)((0, domain_error_1.domainError)('VALIDATION_ERROR', 'La fecha de vencimiento fiscal debe ser posterior a la fecha inicial.', 400));
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
            return (0, result_1.err)((0, domain_error_1.domainError)('CONFLICT', `Ya existe una resolución con prefijo ${prefix} para ese tipo de documento en la sede.`, 409));
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
            afterData: mapped,
        });
        return (0, result_1.ok)(mapped);
    }
    async listResolutions(branchId) {
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
    async createTaxRule(actor, input, ipAddress) {
        const code = input.code.trim().toUpperCase();
        const exists = await this.prisma.taxRule.findUnique({ where: { code } });
        if (exists) {
            return (0, result_1.err)((0, domain_error_1.domainError)('CONFLICT', `Ya existe una regla tributaria con código ${code}.`, 409));
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
        return (0, result_1.ok)(created);
    }
    toAlertStatus(r) {
        const { usagePercent, daysRemaining, alerts } = this.evaluateAlerts(r.rangeStart, r.rangeEnd, r.currentNumber, r.validUntil);
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
    evaluateAlerts(start, end, current, validUntil) {
        const totalCapacity = Number(end - start + 1n);
        const consumed = current < start ? 0 : Number(current - start + 1n);
        const usagePercent = totalCapacity > 0
            ? Number(((consumed / totalCapacity) * 100).toFixed(2))
            : 100;
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysRemaining = Math.ceil((validUntil.getTime() - Date.now()) / msPerDay);
        const alerts = [];
        if (usagePercent >= FiscalSequenceService_1.USAGE_ALERT_THRESHOLD_PCT) {
            alerts.push(`Consumo de rango fiscal en ${usagePercent}% (umbral preventivo 85%).`);
        }
        if (daysRemaining <= FiscalSequenceService_1.EXPIRY_ALERT_DAYS) {
            alerts.push(daysRemaining <= 0
                ? 'Resolución fiscal vencida.'
                : `Faltan ${daysRemaining} días para el vencimiento de la resolución (umbral 15 días).`);
        }
        return { usagePercent, daysRemaining, alerts };
    }
};
exports.FiscalSequenceService = FiscalSequenceService;
exports.FiscalSequenceService = FiscalSequenceService = FiscalSequenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(ports_1.AUDIT_LOGGER_PORT)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], FiscalSequenceService);
//# sourceMappingURL=fiscal-sequence.service.js.map