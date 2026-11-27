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
exports.PrismaAuditAdapter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("./prisma.service");
let PrismaAuditAdapter = class PrismaAuditAdapter {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(entry, tx) {
        const client = tx ?? this.prisma;
        await client.auditLog.create({
            data: {
                userId: entry.userId,
                ipAddress: entry.ipAddress,
                terminalId: entry.terminalId,
                module: entry.module,
                action: entry.action,
                documentType: entry.documentType,
                documentId: entry.documentId,
                beforeState: entry.beforeState ?? client_1.Prisma.JsonNull,
                afterState: entry.afterState ?? client_1.Prisma.JsonNull,
            },
        });
    }
};
exports.PrismaAuditAdapter = PrismaAuditAdapter;
exports.PrismaAuditAdapter = PrismaAuditAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaAuditAdapter);
//# sourceMappingURL=prisma-audit.adapter.js.map