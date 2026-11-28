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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaSecurityRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/infra/prisma.service");
let PrismaSecurityRepository = class PrismaSecurityRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByUsername(username) {
        const user = await this.prisma.user.findUnique({
            where: { username },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: { permission: true },
                        },
                    },
                },
            },
        });
        return user ? this.mapUser(user) : null;
    }
    async findById(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: { permission: true },
                        },
                    },
                },
            },
        });
        return user ? this.mapUser(user) : null;
    }
    async recordFailedLogin(userId, failedCount, lockedUntil) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { failedLoginCount: failedCount, lockedUntil },
        });
    }
    async recordSuccessfulLogin(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                failedLoginCount: 0,
                lockedUntil: null,
                lastActivityAt: new Date(),
            },
        });
    }
    async createOverrideLog(input) {
        const record = await this.prisma.supervisorOverrideLog.create({
            data: {
                requesterId: input.requesterId,
                approverId: input.approverId,
                actionCode: input.actionCode,
                reason: input.reason,
                referenceType: input.referenceType,
                referenceId: input.referenceId,
                expiresAt: input.expiresAt,
            },
            select: { id: true },
        });
        return record;
    }
    async markOverrideLogUsed(overrideLogId) {
        await this.prisma.supervisorOverrideLog.update({
            where: { id: overrideLogId },
            data: { usedAt: new Date() },
        });
    }
    mapUser(raw) {
        return {
            id: raw.id,
            branchId: raw.branchId,
            username: raw.username,
            email: raw.email,
            fullName: raw.fullName,
            passwordHash: raw.passwordHash,
            supervisorPinHash: raw.supervisorPinHash,
            allowedWorkStart: raw.allowedWorkStart,
            allowedWorkEnd: raw.allowedWorkEnd,
            isActive: raw.isActive,
            failedLoginCount: raw.failedLoginCount,
            lockedUntil: raw.lockedUntil,
            role: {
                code: raw.role.code,
                canViewCosts: raw.role.canViewCosts,
                canViewCashExpected: raw.role.canViewCashExpected,
                canApproveOverride: raw.role.canApproveOverride,
                permissions: raw.role.permissions.map((rp) => ({
                    resource: rp.permission.resource,
                    action: rp.permission.action,
                    ownRecordsOnly: rp.ownRecordsOnly,
                    maskedSensitive: rp.maskedSensitive,
                })),
            },
        };
    }
};
exports.PrismaSecurityRepository = PrismaSecurityRepository;
exports.PrismaSecurityRepository = PrismaSecurityRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaSecurityRepository);
//# sourceMappingURL=prisma-security.repository.js.map