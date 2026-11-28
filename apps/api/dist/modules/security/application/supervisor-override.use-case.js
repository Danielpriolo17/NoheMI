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
exports.SupervisorOverrideUseCase = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const ports_1 = require("../../../shared/application/ports");
const domain_error_1 = require("../../../shared/domain/domain-error");
const result_1 = require("../../../shared/domain/result");
const security_ports_1 = require("../domain/security.ports");
let SupervisorOverrideUseCase = class SupervisorOverrideUseCase {
    securityRepo;
    hasher;
    sessionStore;
    auditLogger;
    config;
    constructor(securityRepo, hasher, sessionStore, auditLogger, config) {
        this.securityRepo = securityRepo;
        this.hasher = hasher;
        this.sessionStore = sessionStore;
        this.auditLogger = auditLogger;
        this.config = config;
    }
    async authorize(input) {
        const supervisor = await this.securityRepo.findByUsername(input.supervisorUsername.trim());
        if (!supervisor ||
            !supervisor.isActive ||
            !supervisor.role.canApproveOverride ||
            !supervisor.supervisorPinHash) {
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
            return (0, result_1.err)((0, domain_error_1.domainError)('INVALID_SUPERVISOR_PIN', 'El usuario indicado no tiene privilegios de supervisor o no tiene PIN configurado.', 403));
        }
        if (supervisor.id === input.requester.userId &&
            supervisor.role.code !== 'ADMIN_GERENCIA') {
            return (0, result_1.err)((0, domain_error_1.domainError)('FORBIDDEN', 'Segregación de funciones: un usuario operativo no puede autoaprobar excepciones.', 403));
        }
        const pinValid = await this.hasher.verify(supervisor.supervisorPinHash, input.supervisorPin);
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
            return (0, result_1.err)((0, domain_error_1.domainError)('INVALID_SUPERVISOR_PIN', 'PIN de supervisor incorrecto.', 401));
        }
        const ttlSeconds = Number(this.config.get('SUPERVISOR_OVERRIDE_TTL_SECONDS', '60'));
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
        const overrideToken = (0, uuid_1.v4)();
        await this.sessionStore.saveOverrideToken(overrideToken, {
            overrideLogId: logRecord.id,
            requesterId: input.requester.userId,
            approverId: supervisor.id,
            actionCode: input.actionCode,
            referenceType: input.referenceType,
            referenceId: input.referenceId,
        }, ttlSeconds);
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
        return (0, result_1.ok)({
            overrideToken,
            overrideLogId: logRecord.id,
            approverName: supervisor.fullName,
            expiresInSeconds: ttlSeconds,
        });
    }
    async verifyAndConsume(params) {
        const payload = await this.sessionStore.consumeOverrideToken(params.overrideToken);
        if (!payload) {
            return (0, result_1.err)((0, domain_error_1.domainError)('SUPERVISOR_OVERRIDE_REQUIRED', 'El token de autorización de supervisor expiró o ya fue utilizado.', 403));
        }
        if (payload.requesterId !== params.expectedRequesterId ||
            payload.actionCode !== params.expectedActionCode ||
            payload.referenceId !== params.expectedReferenceId) {
            return (0, result_1.err)((0, domain_error_1.domainError)('FORBIDDEN', 'El token de supervisor no corresponde a la operación o usuario actual.', 403));
        }
        await this.securityRepo.markOverrideLogUsed(payload.overrideLogId);
        return (0, result_1.ok)(payload);
    }
};
exports.SupervisorOverrideUseCase = SupervisorOverrideUseCase;
exports.SupervisorOverrideUseCase = SupervisorOverrideUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(security_ports_1.SECURITY_REPO_PORT)),
    __param(1, (0, common_1.Inject)(security_ports_1.PASSWORD_HASHER_PORT)),
    __param(2, (0, common_1.Inject)(security_ports_1.SESSION_STORE_PORT)),
    __param(3, (0, common_1.Inject)(ports_1.AUDIT_LOGGER_PORT)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, config_1.ConfigService])
], SupervisorOverrideUseCase);
//# sourceMappingURL=supervisor-override.use-case.js.map