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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const http_result_1 = require("../../../../shared/infra/http-result");
const login_use_case_1 = require("../../application/login.use-case");
const supervisor_override_use_case_1 = require("../../application/supervisor-override.use-case");
const security_ports_1 = require("../../domain/security.ports");
const security_decorators_1 = require("./decorators/security.decorators");
const auth_dto_1 = require("./dto/auth.dto");
let AuthController = class AuthController {
    loginUseCase;
    overrideUseCase;
    sessionStore;
    constructor(loginUseCase, overrideUseCase, sessionStore) {
        this.loginUseCase = loginUseCase;
        this.overrideUseCase = overrideUseCase;
        this.sessionStore = sessionStore;
    }
    async login(dto, req) {
        const result = await this.loginUseCase.execute({
            username: dto.username,
            password: dto.password,
            terminalId: dto.terminalId,
            ipAddress: req.ip,
        });
        return (0, http_result_1.unwrapOrThrowHttp)(result);
    }
    async logout(user) {
        await this.sessionStore.revokeSession(user.sessionId);
        return { message: 'Sesión cerrada correctamente.' };
    }
    getProfile(user) {
        return user;
    }
    async requestOverride(user, dto, req) {
        const result = await this.overrideUseCase.authorize({
            requester: user,
            supervisorUsername: dto.supervisorUsername,
            supervisorPin: dto.supervisorPin,
            actionCode: dto.actionCode,
            reason: dto.reason,
            referenceType: dto.referenceType,
            referenceId: dto.referenceId,
            ipAddress: req.ip,
        });
        return (0, http_result_1.unwrapOrThrowHttp)(result);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, security_decorators_1.Public)(),
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({ summary: 'Inicio de sesión con Argon2id y sesión deslizante en Redis' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('logout'),
    (0, swagger_1.ApiOperation)({ summary: 'Cierre de sesión inmediato (revoca clave Redis)' }),
    __param(0, (0, security_decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Perfil activo y permisos granulares del usuario autenticado' }),
    __param(0, (0, security_decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('supervisor-override'),
    (0, swagger_1.ApiOperation)({
        summary: 'Autorización emergente por PIN de supervisor en caliente (RF-01)',
    }),
    __param(0, (0, security_decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.RequestSupervisorOverrideDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestOverride", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Módulo 1 — Seguridad y Autenticación'),
    (0, common_1.Controller)('auth'),
    __param(2, (0, common_1.Inject)(security_ports_1.SESSION_STORE_PORT)),
    __metadata("design:paramtypes", [login_use_case_1.LoginUseCase,
        supervisor_override_use_case_1.SupervisorOverrideUseCase, Object])
], AuthController);
//# sourceMappingURL=auth.controller.js.map