import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { unwrapOrThrowHttp } from '../../../../shared/infra/http-result';
import { PrismaService } from '../../../../shared/infra/prisma.service';
import { FiscalSequenceService } from '../../application/fiscal-sequence.service';
import { OrganizationUseCase } from '../../application/organization.use-case';
import { PosTerminalUseCase } from '../../application/pos-terminal.use-case';
import { UserManagementUseCase } from '../../application/user-management.use-case';
import { AuthenticatedUser } from '../../domain/auth.types';
import {
  CurrentUser,
  RequirePermission,
} from './decorators/security.decorators';
import {
  CreateBranchDto,
  CreateFiscalResolutionDto,
  CreateLocationDto,
  CreatePosTerminalDto,
  CreateTaxRuleDto,
  CreateUserDto,
  CreateWarehouseDto,
  ManualDrawerOpenDto,
} from './dto/config-params.dto';

@ApiTags('Módulo 1 — Administración, Sedes, Fiscal y POS')
@ApiBearerAuth()
@Controller('admin')
export class SecurityAdminController {
  constructor(
    private readonly userUseCase: UserManagementUseCase,
    private readonly orgUseCase: OrganizationUseCase,
    private readonly fiscalService: FiscalSequenceService,
    private readonly posTerminalUseCase: PosTerminalUseCase,
    private readonly prisma: PrismaService,
  ) {}

  // --- RF-01: Usuarios y Roles ---

  @Post('users')
  @RequirePermission('security.params', 'C')
  @ApiOperation({ summary: 'Crear usuario con rol RBAC, Argon2id y PIN opcional (RF-01)' })
  async createUser(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateUserDto,
    @Req() req: Request,
  ) {
    return unwrapOrThrowHttp(
      await this.userUseCase.createUser(actor, dto, req.ip),
    );
  }

  @Get('users')
  @RequirePermission('security.params', 'L')
  @ApiOperation({ summary: 'Listar usuarios activos e inactivos' })
  listUsers(@Query('branchId') branchId?: string) {
    return this.userUseCase.listUsers(branchId);
  }

  @Get('roles')
  @RequirePermission('security.params', 'L')
  @ApiOperation({ summary: 'Consultar matriz completa de roles y permisos RBAC' })
  listRoles() {
    return this.userUseCase.listRoles();
  }

  // --- RF-02: Sedes, Bodegas y Ubicaciones ---

  @Post('branches')
  @RequirePermission('security.params', 'C')
  @ApiOperation({ summary: 'Crear nueva sucursal (RF-02)' })
  async createBranch(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateBranchDto,
    @Req() req: Request,
  ) {
    return unwrapOrThrowHttp(
      await this.orgUseCase.createBranch(actor, dto, req.ip),
    );
  }

  @Get('branches')
  @RequirePermission('security.params', 'L')
  @ApiOperation({ summary: 'Listar sucursales con sus bodegas asociadas' })
  listBranches() {
    return this.orgUseCase.listBranches();
  }

  @Post('warehouses')
  @RequirePermission('security.params', 'C')
  @ApiOperation({ summary: 'Crear bodega física o patio con reglas operativas (RF-02)' })
  async createWarehouse(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateWarehouseDto,
    @Req() req: Request,
  ) {
    return unwrapOrThrowHttp(
      await this.orgUseCase.createWarehouse(actor, dto, req.ip),
    );
  }

  @Post('warehouse-locations')
  @RequirePermission('security.params', 'C')
  @ApiOperation({ summary: 'Crear ubicación jerárquica zona/pasillo/estantería/nivel (RF-02)' })
  async createLocation(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateLocationDto,
    @Req() req: Request,
  ) {
    return unwrapOrThrowHttp(
      await this.orgUseCase.createLocation(actor, dto, req.ip),
    );
  }

  @Get('warehouses/:warehouseId/locations')
  @RequirePermission('inventory.catalog', 'L')
  @ApiOperation({ summary: 'Consultar mapa de ubicaciones de una bodega' })
  listLocations(@Param('warehouseId', ParseUUIDPipe) warehouseId: string) {
    return this.orgUseCase.listWarehouseLocations(warehouseId);
  }

  // --- RF-03: Impuestos y Resoluciones Fiscales ---

  @Post('fiscal/resolutions')
  @RequirePermission('fiscal.sequences', 'C')
  @ApiOperation({ summary: 'Registrar resolución fiscal y rango de consecutivos (RF-03)' })
  async createResolution(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateFiscalResolutionDto,
    @Req() req: Request,
  ) {
    return unwrapOrThrowHttp(
      await this.fiscalService.createResolution(
        actor,
        {
          ...dto,
          validFrom: new Date(dto.validFrom),
          validUntil: new Date(dto.validUntil),
        },
        req.ip,
      ),
    );
  }

  @Get('fiscal/resolutions')
  @RequirePermission('fiscal.sequences', 'L')
  @ApiOperation({ summary: 'Listar resoluciones fiscales con alertas del 85% / 15 días' })
  listResolutions(@Query('branchId') branchId?: string) {
    return this.fiscalService.listResolutions(branchId);
  }

  @Post('fiscal/tax-rules')
  @RequirePermission('fiscal.sequences', 'C')
  @ApiOperation({ summary: 'Crear regla tributaria (IVA, Retefuente, ReteICA)' })
  async createTaxRule(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateTaxRuleDto,
    @Req() req: Request,
  ) {
    return unwrapOrThrowHttp(
      await this.fiscalService.createTaxRule(actor, dto, req.ip),
    );
  }

  @Get('fiscal/tax-rules')
  @RequirePermission('fiscal.sequences', 'L')
  @ApiOperation({ summary: 'Listar reglas tributarias vigentes' })
  listTaxRules() {
    return this.fiscalService.listTaxRules();
  }

  // --- RF-04: Terminales POS y Cajón Monedero ---

  @Post('pos-terminals')
  @RequirePermission('security.params', 'C')
  @ApiOperation({ summary: 'Registrar terminal POS, bodega de descarga y tope de efectivo (RF-04)' })
  async createTerminal(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreatePosTerminalDto,
    @Req() req: Request,
  ) {
    return unwrapOrThrowHttp(
      await this.posTerminalUseCase.createTerminal(actor, dto, req.ip),
    );
  }

  @Get('pos-terminals')
  @RequirePermission('security.params', 'L')
  @ApiOperation({ summary: 'Listar terminales POS configuradas' })
  listTerminals(@Query('branchId') branchId?: string) {
    return this.posTerminalUseCase.listTerminals(branchId);
  }

  @Post('pos-terminals/:terminalId/drawer-open')
  @ApiOperation({ summary: 'Auditar apertura manual de cajón monedero (RF-04)' })
  async registerDrawerOpen(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('terminalId', ParseUUIDPipe) terminalId: string,
    @Body() dto: ManualDrawerOpenDto,
    @Req() req: Request,
  ) {
    return unwrapOrThrowHttp(
      await this.posTerminalUseCase.registerManualDrawerOpen(
        actor,
        {
          terminalId,
          shiftId: dto.shiftId,
          reason: dto.reason,
          overrideToken: dto.overrideToken,
        },
        req.ip,
      ),
    );
  }

  @Get('pos-terminals/anomalous-drawer-events')
  @RequirePermission('bi.audit', 'L')
  @ApiOperation({ summary: 'Reporte de auditoría de aperturas anómalas de cajón monedero' })
  listAnomalousDrawerEvents(@Query('terminalId') terminalId?: string) {
    return this.posTerminalUseCase.listAnomalousDrawerEvents(terminalId);
  }

  // --- RF-30: Consulta de Bitácora Inmutable ---

  @Get('audit-logs')
  @RequirePermission('bi.audit', 'L')
  @ApiOperation({ summary: 'Consultar bitácora inmutable de auditoría (RF-30)' })
  async listAuditLogs(
    @Query('module') module?: string,
    @Query('entityName') entityName?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const take = Math.min(Math.max(Number(limitRaw ?? 50) || 50, 1), 200);
    const logs = await this.prisma.auditLog.findMany({
      where: {
        ...(module ? { module } : {}),
        ...(entityName ? { entityName } : {}),
      },
      orderBy: { id: 'desc' },
      take,
    });

    // Serialización segura de BigInt -> string
    return logs.map((log) => ({
      ...log,
      id: log.id.toString(),
    }));
  }
}