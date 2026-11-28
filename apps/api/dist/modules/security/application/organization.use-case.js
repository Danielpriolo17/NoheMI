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
exports.OrganizationUseCase = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const ports_1 = require("../../../shared/application/ports");
const domain_error_1 = require("../../../shared/domain/domain-error");
const result_1 = require("../../../shared/domain/result");
const prisma_service_1 = require("../../../shared/infra/prisma.service");
let OrganizationUseCase = class OrganizationUseCase {
    prisma;
    auditLogger;
    constructor(prisma, auditLogger) {
        this.prisma = prisma;
        this.auditLogger = auditLogger;
    }
    async createBranch(actor, input, ipAddress) {
        const code = input.code.trim().toUpperCase();
        const exists = await this.prisma.branch.findUnique({ where: { code } });
        if (exists) {
            return (0, result_1.err)((0, domain_error_1.domainError)('CONFLICT', `La sede ${code} ya existe.`, 409));
        }
        const branch = await this.prisma.branch.create({
            data: {
                code,
                name: input.name.trim(),
                address: input.address.trim(),
                city: input.city.trim(),
                phone: input.phone?.trim() ?? null,
            },
        });
        await this.auditLogger.log({
            userId: actor.userId,
            branchId: actor.branchId,
            ipAddress,
            module: 'SECURITY_ORG',
            action: 'BRANCH_CREATED',
            entityName: 'Branch',
            entityId: branch.id,
            afterData: { code: branch.code, name: branch.name, city: branch.city },
        });
        return (0, result_1.ok)(branch);
    }
    async listBranches() {
        return this.prisma.branch.findMany({
            include: {
                warehouses: {
                    orderBy: { code: 'asc' },
                },
            },
            orderBy: { code: 'asc' },
        });
    }
    async createWarehouse(actor, input, ipAddress) {
        const code = input.code.trim().toUpperCase();
        const [branch, existing] = await Promise.all([
            this.prisma.branch.findUnique({ where: { id: input.branchId } }),
            this.prisma.warehouse.findUnique({ where: { code } }),
        ]);
        if (!branch) {
            return (0, result_1.err)((0, domain_error_1.domainError)('NOT_FOUND', 'Sucursal no encontrada.', 404));
        }
        if (existing) {
            return (0, result_1.err)((0, domain_error_1.domainError)('CONFLICT', `El código de bodega ${code} ya existe.`, 409));
        }
        if (input.type === client_1.WarehouseType.CUARENTENA_AVERIAS &&
            input.allowsDirectSales) {
            return (0, result_1.err)((0, domain_error_1.domainError)('VALIDATION_ERROR', 'Una bodega de cuarentena/averías no puede habilitar facturación directa.', 400));
        }
        const warehouse = await this.prisma.warehouse.create({
            data: {
                branchId: branch.id,
                code,
                name: input.name.trim(),
                type: input.type,
                allowsDirectSales: input.allowsDirectSales,
                allowsDispatch: input.allowsDispatch,
                allowsReceiving: input.allowsReceiving,
            },
        });
        await this.auditLogger.log({
            userId: actor.userId,
            branchId: actor.branchId,
            ipAddress,
            module: 'SECURITY_ORG',
            action: 'WAREHOUSE_CREATED',
            entityName: 'Warehouse',
            entityId: warehouse.id,
            afterData: {
                code: warehouse.code,
                type: warehouse.type,
                branchId: warehouse.branchId,
            },
        });
        return (0, result_1.ok)(warehouse);
    }
    async createLocation(actor, input, ipAddress) {
        const warehouse = await this.prisma.warehouse.findUnique({
            where: { id: input.warehouseId },
        });
        if (!warehouse) {
            return (0, result_1.err)((0, domain_error_1.domainError)('NOT_FOUND', 'Bodega no encontrada.', 404));
        }
        const zone = input.zone.trim().toUpperCase();
        const aisle = input.aisle.trim().toUpperCase();
        const rack = input.rack.trim().toUpperCase();
        const level = input.level.trim().toUpperCase();
        const barcode = (input.barcode?.trim() || `${warehouse.code}-${zone}-${aisle}-${rack}-${level}`).toUpperCase();
        const duplicate = await this.prisma.warehouseLocation.findFirst({
            where: {
                OR: [
                    { barcode },
                    { warehouseId: warehouse.id, zone, aisle, rack, level },
                ],
            },
        });
        if (duplicate) {
            return (0, result_1.err)((0, domain_error_1.domainError)('CONFLICT', 'La ubicación física o su código de barras ya existen en esta bodega.', 409));
        }
        const location = await this.prisma.warehouseLocation.create({
            data: {
                warehouseId: warehouse.id,
                zone,
                aisle,
                rack,
                level,
                barcode,
            },
        });
        await this.auditLogger.log({
            userId: actor.userId,
            branchId: actor.branchId,
            ipAddress,
            module: 'SECURITY_ORG',
            action: 'WAREHOUSE_LOCATION_CREATED',
            entityName: 'WarehouseLocation',
            entityId: location.id,
            afterData: { barcode: location.barcode, warehouseId: warehouse.id },
        });
        return (0, result_1.ok)(location);
    }
    async listWarehouseLocations(warehouseId) {
        return this.prisma.warehouseLocation.findMany({
            where: { warehouseId },
            orderBy: [{ zone: 'asc' }, { aisle: 'asc' }, { rack: 'asc' }, { level: 'asc' }],
        });
    }
};
exports.OrganizationUseCase = OrganizationUseCase;
exports.OrganizationUseCase = OrganizationUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(ports_1.AUDIT_LOGGER_PORT)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], OrganizationUseCase);
//# sourceMappingURL=organization.use-case.js.map