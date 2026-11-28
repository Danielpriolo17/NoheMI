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
exports.SecurityAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const http_result_1 = require("../../../../shared/infra/http-result");
const prisma_service_1 = require("../../../../shared/infra/prisma.service");
const fiscal_sequence_service_1 = require("../../application/fiscal-sequence.service");
const organization_use_case_1 = require("../../application/organization.use-case");
const pos_terminal_use_case_1 = require("../../application/pos-terminal.use-case");
const user_management_use_case_1 = require("../../application/user-management.use-case");
const security_decorators_1 = require("./decorators/security.decorators");
const config_params_dto_1 = require("./dto/config-params.dto");
let SecurityAdminController = class SecurityAdminController {
    userUseCase;
    orgUseCase;
    fiscalService;
    posTerminalUseCase;
    prisma;
    constructor(userUseCase, orgUseCase, fiscalService, posTerminalUseCase, prisma) {
        this.userUseCase = userUseCase;
        this.orgUseCase = orgUseCase;
        this.fiscalService = fiscalService;
        this.posTerminalUseCase = posTerminalUseCase;
        this.prisma = prisma;
    }
    async createUser(actor, dto, req) {
        return (0, http_result_1.unwrapOrThrowHttp)(await this.userUseCase.createUser(actor, dto, req.ip));
    }
    listUsers(branchId) {
        return this.userUseCase.listUsers(branchId);
    }
    listRoles() {
        return this.userUseCase.listRoles();
    }
    async createBranch(actor, dto, req) {
        return (0, http_result_1.unwrapOrThrowHttp)(await this.orgUseCase.createBranch(actor, dto, req.ip));
    }
    listBranches() {
        return this.orgUseCase.listBranches();
    }
    async createWarehouse(actor, dto, req) {
        return (0, http_result_1.unwrapOrThrowHttp)(await this.orgUseCase.createWarehouse(actor, dto, req.ip));
    }
    async createLocation(actor, dto, req) {
        return (0, http_result_1.unwrapOrThrowHttp)(await this.orgUseCase.createLocation(actor, dto, req.ip));
    }
    listLocations(warehouseId) {
        return this.orgUseCase.listWarehouseLocations(warehouseId);
    }
    async createResolution(actor, dto, req) {
        return (0, http_result_1.unwrapOrThrowHttp)(await this.fiscalService.createResolution(actor, {
            ...dto,
            validFrom: new Date(dto.validFrom),
            validUntil: new Date(dto.validUntil),
        }, req.ip));
    }
    listResolutions(branchId) {
        return this.fiscalService.listResolutions(branchId);
    }
    async createTaxRule(actor, dto, req) {
        return (0, http_result_1.unwrapOrThrowHttp)(await this.fiscalService.createTaxRule(actor, dto, req.ip));
    }
    listTaxRules() {
        return this.fiscalService.listTaxRules();
    }
    async createTerminal(actor, dto, req) {
        return (0, http_result_1.unwrapOrThrowHttp)(await this.posTerminalUseCase.createTerminal(actor, dto, req.ip));
    }
    listTerminals(branchId) {
        return this.posTerminalUseCase.listTerminals(branchId);
    }
    async registerDrawerOpen(actor, terminalId, dto, req) {
        return (0, http_result_1.unwrapOrThrowHttp)(await this.posTerminalUseCase.registerManualDrawerOpen(actor, {
            terminalId,
            shiftId: dto.shiftId,
            reason: dto.reason,
            overrideToken: dto.overrideToken,
        }, req.ip));
    }
    listAnomalousDrawerEvents(terminalId) {
        return this.posTerminalUseCase.listAnomalousDrawerEvents(terminalId);
    }
    async listAuditLogs(module, entityName, limitRaw) {
        const take = Math.min(Math.max(Number(limitRaw ?? 50) || 50, 1), 200);
        const logs = await this.prisma.auditLog.findMany({
            where: {
                ...(module ? { module } : {}),
                ...(entityName ? { entityName } : {}),
            },
            orderBy: { id: 'desc' },
            take,
        });
        return logs.map((log) => ({
            ...log,
            id: log.id.toString(),
        }));
    }
};
exports.SecurityAdminController = SecurityAdminController;
__decorate([
    (0, common_1.Post)('users'),
    (0, security_decorators_1.RequirePermission)('security.params', 'C'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear usuario con rol RBAC, Argon2id y PIN opcional (RF-01)' }),
    __param(0, (0, security_decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, config_params_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", Promise)
], SecurityAdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, security_decorators_1.RequirePermission)('security.params', 'L'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar usuarios activos e inactivos' }),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SecurityAdminController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Get)('roles'),
    (0, security_decorators_1.RequirePermission)('security.params', 'L'),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar matriz completa de roles y permisos RBAC' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SecurityAdminController.prototype, "listRoles", null);
__decorate([
    (0, common_1.Post)('branches'),
    (0, security_decorators_1.RequirePermission)('security.params', 'C'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear nueva sucursal (RF-02)' }),
    __param(0, (0, security_decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, config_params_dto_1.CreateBranchDto, Object]),
    __metadata("design:returntype", Promise)
], SecurityAdminController.prototype, "createBranch", null);
__decorate([
    (0, common_1.Get)('branches'),
    (0, security_decorators_1.RequirePermission)('security.params', 'L'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar sucursales con sus bodegas asociadas' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SecurityAdminController.prototype, "listBranches", null);
__decorate([
    (0, common_1.Post)('warehouses'),
    (0, security_decorators_1.RequirePermission)('security.params', 'C'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear bodega física o patio con reglas operativas (RF-02)' }),
    __param(0, (0, security_decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, config_params_dto_1.CreateWarehouseDto, Object]),
    __metadata("design:returntype", Promise)
], SecurityAdminController.prototype, "createWarehouse", null);
__decorate([
    (0, common_1.Post)('warehouse-locations'),
    (0, security_decorators_1.RequirePermission)('security.params', 'C'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear ubicación jerárquica zona/pasillo/estantería/nivel (RF-02)' }),
    __param(0, (0, security_decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, config_params_dto_1.CreateLocationDto, Object]),
    __metadata("design:returntype", Promise)
], SecurityAdminController.prototype, "createLocation", null);
__decorate([
    (0, common_1.Get)('warehouses/:warehouseId/locations'),
    (0, security_decorators_1.RequirePermission)('inventory.catalog', 'L'),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar mapa de ubicaciones de una bodega' }),
    __param(0, (0, common_1.Param)('warehouseId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SecurityAdminController.prototype, "listLocations", null);
__decorate([
    (0, common_1.Post)('fiscal/resolutions'),
    (0, security_decorators_1.RequirePermission)('fiscal.sequences', 'C'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar resolución fiscal y rango de consecutivos (RF-03)' }),
    __param(0, (0, security_decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, config_params_dto_1.CreateFiscalResolutionDto, Object]),
    __metadata("design:returntype", Promise)
], SecurityAdminController.prototype, "createResolution", null);
__decorate([
    (0, common_1.Get)('fiscal/resolutions'),
    (0, security_decorators_1.RequirePermission)('fiscal.sequences', 'L'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar resoluciones fiscales con alertas del 85% / 15 días' }),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SecurityAdminController.prototype, "listResolutions", null);
__decorate([
    (0, common_1.Post)('fiscal/tax-rules'),
    (0, security_decorators_1.RequirePermission)('fiscal.sequences', 'C'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear regla tributaria (IVA, Retefuente, ReteICA)' }),
    __param(0, (0, security_decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, config_params_dto_1.CreateTaxRuleDto, Object]),
    __metadata("design:returntype", Promise)
], SecurityAdminController.prototype, "createTaxRule", null);
__decorate([
    (0, common_1.Get)('fiscal/tax-rules'),
    (0, security_decorators_1.RequirePermission)('fiscal.sequences', 'L'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar reglas tributarias vigentes' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SecurityAdminController.prototype, "listTaxRules", null);
__decorate([
    (0, common_1.Post)('pos-terminals'),
    (0, security_decorators_1.RequirePermission)('security.params', 'C'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar terminal POS, bodega de descarga y tope de efectivo (RF-04)' }),
    __param(0, (0, security_decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, config_params_dto_1.CreatePosTerminalDto, Object]),
    __metadata("design:returntype", Promise)
], SecurityAdminController.prototype, "createTerminal", null);
__decorate([
    (0, common_1.Get)('pos-terminals'),
    (0, security_decorators_1.RequirePermission)('security.params', 'L'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar terminales POS configuradas' }),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SecurityAdminController.prototype, "listTerminals", null);
__decorate([
    (0, common_1.Post)('pos-terminals/:terminalId/drawer-open'),
    (0, swagger_1.ApiOperation)({ summary: 'Auditar apertura manual de cajón monedero (RF-04)' }),
    __param(0, (0, security_decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('terminalId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, config_params_dto_1.ManualDrawerOpenDto, Object]),
    __metadata("design:returntype", Promise)
], SecurityAdminController.prototype, "registerDrawerOpen", null);
__decorate([
    (0, common_1.Get)('pos-terminals/anomalous-drawer-events'),
    (0, security_decorators_1.RequirePermission)('bi.audit', 'L'),
    (0, swagger_1.ApiOperation)({ summary: 'Reporte de auditoría de aperturas anómalas de cajón monedero' }),
    __param(0, (0, common_1.Query)('terminalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SecurityAdminController.prototype, "listAnomalousDrawerEvents", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, security_decorators_1.RequirePermission)('bi.audit', 'L'),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar bitácora inmutable de auditoría (RF-30)' }),
    __param(0, (0, common_1.Query)('module')),
    __param(1, (0, common_1.Query)('entityName')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SecurityAdminController.prototype, "listAuditLogs", null);
exports.SecurityAdminController = SecurityAdminController = __decorate([
    (0, swagger_1.ApiTags)('Módulo 1 — Administración, Sedes, Fiscal y POS'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [user_management_use_case_1.UserManagementUseCase,
        organization_use_case_1.OrganizationUseCase,
        fiscal_sequence_service_1.FiscalSequenceService,
        pos_terminal_use_case_1.PosTerminalUseCase,
        prisma_service_1.PrismaService])
], SecurityAdminController);
//# sourceMappingURL=security-admin.controller.js.map