"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const fiscal_sequence_service_1 = require("./application/fiscal-sequence.service");
const login_use_case_1 = require("./application/login.use-case");
const organization_use_case_1 = require("./application/organization.use-case");
const pos_terminal_use_case_1 = require("./application/pos-terminal.use-case");
const supervisor_override_use_case_1 = require("./application/supervisor-override.use-case");
const user_management_use_case_1 = require("./application/user-management.use-case");
const security_ports_1 = require("./domain/security.ports");
const argon2_hasher_adapter_1 = require("./infra/argon2-hasher.adapter");
const auth_controller_1 = require("./infra/http/auth.controller");
const jwt_auth_guard_1 = require("./infra/http/guards/jwt-auth.guard");
const rbac_guard_1 = require("./infra/http/guards/rbac.guard");
const sensitive_masking_interceptor_1 = require("./infra/http/interceptors/sensitive-masking.interceptor");
const security_admin_controller_1 = require("./infra/http/security-admin.controller");
const prisma_security_repository_1 = require("./infra/prisma-security.repository");
const redis_session_store_1 = require("./infra/redis-session.store");
let SecurityModule = class SecurityModule {
};
exports.SecurityModule = SecurityModule;
exports.SecurityModule = SecurityModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.getOrThrow('JWT_SECRET'),
                    signOptions: {
                        expiresIn: 28800,
                    },
                }),
            }),
        ],
        controllers: [auth_controller_1.AuthController, security_admin_controller_1.SecurityAdminController],
        providers: [
            login_use_case_1.LoginUseCase,
            supervisor_override_use_case_1.SupervisorOverrideUseCase,
            user_management_use_case_1.UserManagementUseCase,
            organization_use_case_1.OrganizationUseCase,
            fiscal_sequence_service_1.FiscalSequenceService,
            pos_terminal_use_case_1.PosTerminalUseCase,
            jwt_auth_guard_1.JwtAuthGuard,
            rbac_guard_1.RbacGuard,
            sensitive_masking_interceptor_1.SensitiveMaskingInterceptor,
            { provide: security_ports_1.SECURITY_REPO_PORT, useClass: prisma_security_repository_1.PrismaSecurityRepository },
            { provide: security_ports_1.SESSION_STORE_PORT, useClass: redis_session_store_1.RedisSessionStore },
            { provide: security_ports_1.PASSWORD_HASHER_PORT, useClass: argon2_hasher_adapter_1.Argon2HasherAdapter },
        ],
        exports: [
            jwt_1.JwtModule,
            supervisor_override_use_case_1.SupervisorOverrideUseCase,
            fiscal_sequence_service_1.FiscalSequenceService,
            security_ports_1.SECURITY_REPO_PORT,
            security_ports_1.SESSION_STORE_PORT,
            security_ports_1.PASSWORD_HASHER_PORT,
        ],
    })
], SecurityModule);
//# sourceMappingURL=security.module.js.map