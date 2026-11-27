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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizeSupervisorPinUseCase = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const ioredis_1 = __importDefault(require("ioredis"));
const prisma_service_1 = require("../../../shared/infra/prisma.service");
const redis_provider_1 = require("../../../shared/infra/redis.provider");
const audit_port_1 = require("../../../shared/domain/audit.port");
const password_hasher_port_1 = require("../domain/password-hasher.port");
const result_1 = require("../../../shared/domain/result");
const domain_error_1 = require("../../../shared/domain/domain-error");
let AuthorizeSupervisorPinUseCase = class AuthorizeSupervisorPinUseCase {
    constructor(prisma, hasher, redis, audit) {
        this.prisma = prisma;
        this.hasher = hasher;
        this.redis = redis;
        this.audit = audit;
        this.allowedApproverRoles = new Set([
            'ADMIN_GERENCIA',
            'CONTADOR_TESORERIA',
        ]);
    }
    async execute(input) {
        if (!input.reason || input.reason.trim().length < 5) {
            return (0, result_1.err)((0, domain_error_1.domainError)('VALIDATION_ERROR', 'Debe indicar un motivo detallado (mínimo 5 caracteres).', 400));
        }
        const supervisor = await this.prisma.user.findUnique({
            where: { documentNumber: input.supervisorDocument },
        });
        if (!supervisor ||
            !supervisor.isActive ||
            !supervisor.supervisorPinHash ||
            !this.allowedApproverRoles.has(supervisor.role)) {
            return (0, result_1.err)((0, domain_error_1.domainError)('SUPERVISOR_PIN_INVALID', 'Credenciales de supervisor no autorizadas.', 403));
        }
        if (supervisor.id === input.requesterId) {
            return (0, result_1.err)((0, domain_error_1.domainError)('FORBIDDEN_RBAC', 'Segregación de funciones: un usuario no puede auto-aprobar su propia operación.', 403));
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
            return (0, result_1.err)((0, domain_error_1.domainError)('SUPERVISOR_PIN_INVALID', 'PIN de supervisor incorrecto.', 403));
        }
        const override = await this.prisma.$transaction(async (tx) => {
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
            await this.audit.record({
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
            }, tx);
            return created;
        });
        const overrideToken = (0, crypto_1.randomUUID)();
        const expiresInSeconds = 120;
        await this.redis.set(`override:${overrideToken}`, JSON.stringify({
            overrideId: override.id,
            requesterId: input.requesterId,
            approverId: supervisor.id,
            actionCode: input.actionCode,
        }), 'EX', expiresInSeconds);
        return (0, result_1.ok)({
            overrideId: override.id,
            overrideToken,
            expiresInSeconds,
            approverName: supervisor.fullName,
        });
    }
};
exports.AuthorizeSupervisorPinUseCase = AuthorizeSupervisorPinUseCase;
exports.AuthorizeSupervisorPinUseCase = AuthorizeSupervisorPinUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(password_hasher_port_1.PASSWORD_HASHER_PORT)),
    __param(2, (0, common_1.Inject)(redis_provider_1.REDIS_CLIENT)),
    __param(3, (0, common_1.Inject)(audit_port_1.AUDIT_PORT)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, ioredis_1.default, Object])
], AuthorizeSupervisorPinUseCase);
//# sourceMappingURL=authorize-supervisor-pin.usecase.js.map