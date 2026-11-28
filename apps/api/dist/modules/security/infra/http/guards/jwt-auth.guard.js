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
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const security_ports_1 = require("../../../domain/security.ports");
const security_decorators_1 = require("../decorators/security.decorators");
let JwtAuthGuard = class JwtAuthGuard {
    reflector;
    jwtService;
    config;
    sessionStore;
    securityRepo;
    constructor(reflector, jwtService, config, sessionStore, securityRepo) {
        this.reflector = reflector;
        this.jwtService = jwtService;
        this.config = config;
        this.sessionStore = sessionStore;
        this.securityRepo = securityRepo;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(security_decorators_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException({
                code: 'UNAUTHORIZED',
                message: 'Token de acceso requerido.',
            });
        }
        const token = authHeader.slice(7);
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(token);
        }
        catch {
            throw new common_1.UnauthorizedException({
                code: 'UNAUTHORIZED',
                message: 'Token inválido o expirado.',
            });
        }
        const idleTimeoutSeconds = Number(this.config.get('POS_IDLE_TIMEOUT_SECONDS', '300'));
        const activeSession = await this.sessionStore.touchActiveSession(payload.sid, idleTimeoutSeconds);
        if (!activeSession) {
            throw new common_1.UnauthorizedException({
                code: 'SESSION_IDLE_EXPIRED',
                message: 'Sesión bloqueada automáticamente por inactividad. Inicie sesión nuevamente.',
            });
        }
        const user = await this.securityRepo.findById(payload.sub);
        if (!user || !user.isActive) {
            await this.sessionStore.revokeSession(payload.sid);
            throw new common_1.UnauthorizedException({
                code: 'UNAUTHORIZED',
                message: 'Usuario inactivo o revocado.',
            });
        }
        request.user = {
            sessionId: payload.sid,
            userId: user.id,
            username: user.username,
            fullName: user.fullName,
            branchId: user.branchId,
            terminalId: activeSession.terminalId,
            roleCode: user.role.code,
            canViewCosts: user.role.canViewCosts,
            canViewCashExpected: user.role.canViewCashExpected,
            canApproveOverride: user.role.canApproveOverride,
            permissions: user.role.permissions,
        };
        return true;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)(security_ports_1.SESSION_STORE_PORT)),
    __param(4, (0, common_1.Inject)(security_ports_1.SECURITY_REPO_PORT)),
    __metadata("design:paramtypes", [core_1.Reflector,
        jwt_1.JwtService,
        config_1.ConfigService, Object, Object])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map