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
var LoginUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginUseCase = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const uuid_1 = require("uuid");
const ports_1 = require("../../../shared/application/ports");
const domain_error_1 = require("../../../shared/domain/domain-error");
const result_1 = require("../../../shared/domain/result");
const security_ports_1 = require("../domain/security.ports");
let LoginUseCase = class LoginUseCase {
    static { LoginUseCase_1 = this; }
    securityRepo;
    hasher;
    sessionStore;
    auditLogger;
    jwtService;
    config;
    static MAX_FAILED_ATTEMPTS = 5;
    static LOCK_DURATION_MINUTES = 15;
    constructor(securityRepo, hasher, sessionStore, auditLogger, jwtService, config) {
        this.securityRepo = securityRepo;
        this.hasher = hasher;
        this.sessionStore = sessionStore;
        this.auditLogger = auditLogger;
        this.jwtService = jwtService;
        this.config = config;
    }
    async execute(input) {
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
            return (0, result_1.err)((0, domain_error_1.domainError)('UNAUTHORIZED', 'Credenciales inválidas o usuario inactivo.', 401));
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            return (0, result_1.err)((0, domain_error_1.domainError)('UNAUTHORIZED', 'Cuenta bloqueada temporalmente por múltiples intentos fallidos.', 423, { lockedUntil: user.lockedUntil.toISOString() }));
        }
        const passwordMatches = await this.hasher.verify(user.passwordHash, input.password);
        if (!passwordMatches) {
            const nextAttempts = user.failedLoginCount + 1;
            const shouldLock = nextAttempts >= LoginUseCase_1.MAX_FAILED_ATTEMPTS;
            const lockedUntil = shouldLock
                ? new Date(Date.now() + LoginUseCase_1.LOCK_DURATION_MINUTES * 60 * 1000)
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
            return (0, result_1.err)((0, domain_error_1.domainError)('UNAUTHORIZED', 'Credenciales inválidas.', 401));
        }
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
            return (0, result_1.err)((0, domain_error_1.domainError)('FORBIDDEN', 'Acceso denegado fuera del horario operativo autorizado.', 403));
        }
        const sessionId = (0, uuid_1.v4)();
        const idleTimeoutSeconds = Number(this.config.get('POS_IDLE_TIMEOUT_SECONDS', '300'));
        await this.securityRepo.recordSuccessfulLogin(user.id);
        await this.sessionStore.saveActiveSession(sessionId, {
            userId: user.id,
            branchId: user.branchId,
            terminalId: input.terminalId,
            roleCode: user.role.code,
            lastSeenAt: new Date().toISOString(),
        }, idleTimeoutSeconds);
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
        return (0, result_1.ok)({
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
    isWithinAllowedSchedule(start, end) {
        if (!start || !end)
            return true;
        const now = new Date();
        const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return hhmm >= start && hhmm <= end;
    }
};
exports.LoginUseCase = LoginUseCase;
exports.LoginUseCase = LoginUseCase = LoginUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(security_ports_1.SECURITY_REPO_PORT)),
    __param(1, (0, common_1.Inject)(security_ports_1.PASSWORD_HASHER_PORT)),
    __param(2, (0, common_1.Inject)(security_ports_1.SESSION_STORE_PORT)),
    __param(3, (0, common_1.Inject)(ports_1.AUDIT_LOGGER_PORT)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, jwt_1.JwtService,
        config_1.ConfigService])
], LoginUseCase);
//# sourceMappingURL=login.use-case.js.map