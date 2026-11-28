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
exports.PrismaAuditLogger = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("./prisma.service");
let PrismaAuditLogger = class PrismaAuditLogger {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(entry, tx) {
        const client = tx ?? this.prisma;
        await client.auditLog.create({
            data: {
                userId: entry.userId ?? null,
                supervisorId: entry.supervisorId ?? null,
                branchId: entry.branchId ?? null,
                terminalId: entry.terminalId ?? null,
                ipAddress: entry.ipAddress ?? null,
                module: entry.module,
                action: entry.action,
                entityName: entry.entityName,
                entityId: entry.entityId,
                beforeData: entry.beforeData
                    ? entry.beforeData
                    : client_1.Prisma.JsonNull,
                afterData: entry.afterData
                    ? entry.afterData
                    : client_1.Prisma.JsonNull,
                metadata: entry.metadata
                    ? entry.metadata
                    : client_1.Prisma.JsonNull,
            },
        });
    }
};
exports.PrismaAuditLogger = PrismaAuditLogger;
exports.PrismaAuditLogger = PrismaAuditLogger = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaAuditLogger);
//# sourceMappingURL=prisma-audit-logger.js.map