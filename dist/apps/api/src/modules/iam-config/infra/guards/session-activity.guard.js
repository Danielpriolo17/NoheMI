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
exports.SessionActivityGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const ioredis_1 = __importDefault(require("ioredis"));
const audit_port_1 = require("../../../../shared/domain/audit.port");
const redis_provider_1 = require("../../../../shared/infra/redis.provider");
let SessionActivityGuard = class SessionActivityGuard {
    constructor(jwtService, redis, audit) {
        this.jwtService = jwtService;
        this.redis = redis;
        this.audit = audit;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Token requerido.' });
        }
        const token = authHeader.slice(7);
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(token);
        }
        catch {
            throw new common_1.UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Token inválido o expirado.' });
        }
        const sessionKey = `session:active:${payload.jti}`;
        const isAlive = await this.redis.get(sessionKey);
        if (!isAlive) {
            await this.audit.record({
                userId: payload.sub,
                ipAddress: req.ip,
                terminalId: payload.terminalId,
                module: 'IAM',
                action: 'SESSION_LOCKED_INACTIVITY',
            });
            throw new common_1.UnauthorizedException({
                code: 'SESSION_LOCKED_INACTIVITY',
                message: 'Sesión bloqueada por inactividad. Ingrese sus credenciales.',
            });
        }
        const ttlSeconds = Math.max(180, (payload.sessionTimeoutMinutes || 5) * 60);
        await this.redis.expire(sessionKey, ttlSeconds);
        req.user = payload;
        return true;
    }
};
exports.SessionActivityGuard = SessionActivityGuard;
exports.SessionActivityGuard = SessionActivityGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(redis_provider_1.REDIS_CLIENT)),
    __param(2, (0, common_1.Inject)(audit_port_1.AUDIT_PORT)),
    __metadata("design:paramtypes", [jwt_1.JwtService, ioredis_1.default, Object])
], SessionActivityGuard);
//# sourceMappingURL=session-activity.guard.js.map