"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedModule = void 0;
const common_1 = require("@nestjs/common");
const ports_1 = require("../application/ports");
const prisma_audit_logger_1 = require("./prisma-audit-logger");
const prisma_service_1 = require("./prisma.service");
const prisma_unit_of_work_1 = require("./prisma-unit-of-work");
const redis_service_1 = require("./redis.service");
let SharedModule = class SharedModule {
};
exports.SharedModule = SharedModule;
exports.SharedModule = SharedModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            prisma_service_1.PrismaService,
            redis_service_1.RedisService,
            { provide: ports_1.UNIT_OF_WORK_PORT, useClass: prisma_unit_of_work_1.PrismaUnitOfWork },
            { provide: ports_1.AUDIT_LOGGER_PORT, useClass: prisma_audit_logger_1.PrismaAuditLogger },
        ],
        exports: [
            prisma_service_1.PrismaService,
            redis_service_1.RedisService,
            ports_1.UNIT_OF_WORK_PORT,
            ports_1.AUDIT_LOGGER_PORT,
        ],
    })
], SharedModule);
//# sourceMappingURL=shared.module.js.map