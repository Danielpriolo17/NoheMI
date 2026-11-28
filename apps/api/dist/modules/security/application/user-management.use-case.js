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
exports.UserManagementUseCase = void 0;
const common_1 = require("@nestjs/common");
const ports_1 = require("../../../shared/application/ports");
const domain_error_1 = require("../../../shared/domain/domain-error");
const result_1 = require("../../../shared/domain/result");
const prisma_service_1 = require("../../../shared/infra/prisma.service");
const security_ports_1 = require("../domain/security.ports");
let UserManagementUseCase = class UserManagementUseCase {
    prisma;
    hasher;
    auditLogger;
    constructor(prisma, hasher, auditLogger) {
        this.prisma = prisma;
        this.hasher = hasher;
        this.auditLogger = auditLogger;
    }
    async createUser(actor, input, ipAddress) {
        const [branch, role, existingUser] = await Promise.all([
            this.prisma.branch.findUnique({ where: { id: input.branchId } }),
            this.prisma.role.findUnique({ where: { code: input.roleCode } }),
            this.prisma.user.findFirst({
                where: {
                    OR: [
                        { username: input.username.trim() },
                        { email: input.email.trim().toLowerCase() },
                    ],
                },
            }),
        ]);
        if (!branch || !branch.isActive) {
            return (0, result_1.err)((0, domain_error_1.domainError)('NOT_FOUND', 'Sede no encontrada o inactiva.', 404));
        }
        if (!role) {
            return (0, result_1.err)((0, domain_error_1.domainError)('NOT_FOUND', 'Rol RBAC no encontrado.', 404));
        }
        if (existingUser) {
            return (0, result_1.err)((0, domain_error_1.domainError)('CONFLICT', 'El username o email ya está registrado.', 409));
        }
        if (input.supervisorPin && !role.canApproveOverride) {
            return (0, result_1.err)((0, domain_error_1.domainError)('VALIDATION_ERROR', `El rol ${role.code} no está habilitado para autorizaciones de supervisor.`, 400));
        }
        const passwordHash = await this.hasher.hash(input.password);
        const supervisorPinHash = input.supervisorPin
            ? await this.hasher.hash(input.supervisorPin)
            : null;
        const created = await this.prisma.user.create({
            data: {
                branchId: branch.id,
                roleId: role.id,
                username: input.username.trim(),
                email: input.email.trim().toLowerCase(),
                fullName: input.fullName.trim(),
                passwordHash,
                supervisorPinHash,
                allowedWorkStart: input.allowedWorkStart ?? null,
                allowedWorkEnd: input.allowedWorkEnd ?? null,
            },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                branchId: true,
                allowedWorkStart: true,
                allowedWorkEnd: true,
                isActive: true,
                createdAt: true,
                role: {
                    select: { code: true, name: true, canApproveOverride: true },
                },
            },
        });
        await this.auditLogger.log({
            userId: actor.userId,
            branchId: actor.branchId,
            ipAddress,
            module: 'SECURITY',
            action: 'USER_CREATED',
            entityName: 'User',
            entityId: created.id,
            afterData: {
                username: created.username,
                roleCode: created.role.code,
                branchId: created.branchId,
                hasSupervisorPin: Boolean(supervisorPinHash),
            },
        });
        return (0, result_1.ok)(created);
    }
    async listUsers(branchId) {
        return this.prisma.user.findMany({
            where: branchId ? { branchId } : undefined,
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                branchId: true,
                isActive: true,
                allowedWorkStart: true,
                allowedWorkEnd: true,
                lastActivityAt: true,
                role: {
                    select: {
                        code: true,
                        name: true,
                        canViewCosts: true,
                        canViewCashExpected: true,
                        canApproveOverride: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async listRoles() {
        return this.prisma.role.findMany({
            include: {
                permissions: {
                    include: { permission: true },
                },
            },
            orderBy: { code: 'asc' },
        });
    }
};
exports.UserManagementUseCase = UserManagementUseCase;
exports.UserManagementUseCase = UserManagementUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(security_ports_1.PASSWORD_HASHER_PORT)),
    __param(2, (0, common_1.Inject)(ports_1.AUDIT_LOGGER_PORT)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, Object])
], UserManagementUseCase);
//# sourceMappingURL=user-management.use-case.js.map