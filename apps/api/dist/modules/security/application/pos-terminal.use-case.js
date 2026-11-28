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
exports.PosTerminalUseCase = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const ports_1 = require("../../../shared/application/ports");
const domain_error_1 = require("../../../shared/domain/domain-error");
const result_1 = require("../../../shared/domain/result");
const prisma_service_1 = require("../../../shared/infra/prisma.service");
const supervisor_override_use_case_1 = require("./supervisor-override.use-case");
let PosTerminalUseCase = class PosTerminalUseCase {
    prisma;
    overrideUseCase;
    auditLogger;
    constructor(prisma, overrideUseCase, auditLogger) {
        this.prisma = prisma;
        this.overrideUseCase = overrideUseCase;
        this.auditLogger = auditLogger;
    }
    async createTerminal(actor, input, ipAddress) {
        const code = input.code.trim().toUpperCase();
        const [warehouse, existing] = await Promise.all([
            this.prisma.warehouse.findUnique({
                where: { id: input.defaultWarehouseId },
            }),
            this.prisma.posTerminal.findUnique({ where: { code } }),
        ]);
        if (!warehouse || warehouse.branchId !== input.branchId) {
            return (0, result_1.err)((0, domain_error_1.domainError)('VALIDATION_ERROR', 'La bodega predeterminada no pertenece a la sucursal indicada.', 400));
        }
        if (!warehouse.allowsDirectSales) {
            return (0, result_1.err)((0, domain_error_1.domainError)('VALIDATION_ERROR', 'La bodega predeterminada de una caja POS debe permitir facturación directa.', 400));
        }
        if (existing) {
            return (0, result_1.err)((0, domain_error_1.domainError)('CONFLICT', `Ya existe una terminal POS con código ${code}.`, 409));
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
                    ? input.thermalPrinterConfig
                    : client_1.Prisma.JsonNull,
                laserPrinterConfig: input.laserPrinterConfig
                    ? input.laserPrinterConfig
                    : client_1.Prisma.JsonNull,
                scaleSerialConfig: input.scaleSerialConfig
                    ? input.scaleSerialConfig
                    : client_1.Prisma.JsonNull,
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
        return (0, result_1.ok)(terminal);
    }
    async listTerminals(branchId) {
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
    async registerManualDrawerOpen(actor, input, ipAddress) {
        const terminal = await this.prisma.posTerminal.findUnique({
            where: { id: input.terminalId },
        });
        if (!terminal) {
            return (0, result_1.err)((0, domain_error_1.domainError)('NOT_FOUND', 'Terminal POS no encontrada.', 404));
        }
        let isAuthorized = false;
        let supervisorId = null;
        if (input.overrideToken) {
            const verified = await this.overrideUseCase.verifyAndConsume({
                overrideToken: input.overrideToken,
                expectedRequesterId: actor.userId,
                expectedActionCode: 'MANUAL_CASH_DRAWER_OPEN',
                expectedReferenceId: input.terminalId,
            });
            if (verified.isErr) {
                return (0, result_1.err)(verified.error);
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
                    severity: client_1.FraudSeverity.ALTA,
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
        return (0, result_1.ok)(event);
    }
    async listAnomalousDrawerEvents(terminalId) {
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
};
exports.PosTerminalUseCase = PosTerminalUseCase;
exports.PosTerminalUseCase = PosTerminalUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(ports_1.AUDIT_LOGGER_PORT)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        supervisor_override_use_case_1.SupervisorOverrideUseCase, Object])
], PosTerminalUseCase);
//# sourceMappingURL=pos-terminal.use-case.js.map