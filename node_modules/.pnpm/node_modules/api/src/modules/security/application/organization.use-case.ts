import { Inject, Injectable } from '@nestjs/common';
import { WarehouseType } from '@prisma/client';
import {
  AUDIT_LOGGER_PORT,
  AuditLoggerPort,
} from '../../../shared/application/ports';
import { DomainError, domainError } from '../../../shared/domain/domain-error';
import { err, ok, Result } from '../../../shared/domain/result';
import { PrismaService } from '../../../shared/infra/prisma.service';
import { AuthenticatedUser } from '../domain/auth.types';

@Injectable()
export class OrganizationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUDIT_LOGGER_PORT)
    private readonly auditLogger: AuditLoggerPort,
  ) {}

  async createBranch(
    actor: AuthenticatedUser,
    input: {
      code: string;
      name: string;
      address: string;
      city: string;
      phone?: string;
    },
    ipAddress?: string,
  ): Promise<Result<Record<string, unknown>, DomainError>> {
    const code = input.code.trim().toUpperCase();
    const exists = await this.prisma.branch.findUnique({ where: { code } });
    if (exists) {
      return err(domainError('CONFLICT', `La sede ${code} ya existe.`, 409));
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

    return ok(branch as unknown as Record<string, unknown>);
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

  async createWarehouse(
    actor: AuthenticatedUser,
    input: {
      branchId: string;
      code: string;
      name: string;
      type: WarehouseType;
      allowsDirectSales: boolean;
      allowsDispatch: boolean;
      allowsReceiving: boolean;
    },
    ipAddress?: string,
  ): Promise<Result<Record<string, unknown>, DomainError>> {
    const code = input.code.trim().toUpperCase();
    const [branch, existing] = await Promise.all([
      this.prisma.branch.findUnique({ where: { id: input.branchId } }),
      this.prisma.warehouse.findUnique({ where: { code } }),
    ]);

    if (!branch) {
      return err(domainError('NOT_FOUND', 'Sucursal no encontrada.', 404));
    }
    if (existing) {
      return err(
        domainError('CONFLICT', `El código de bodega ${code} ya existe.`, 409),
      );
    }

    // Regla de dominio: una bodega de cuarentena/averías nunca permite venta directa
    if (
      input.type === WarehouseType.CUARENTENA_AVERIAS &&
      input.allowsDirectSales
    ) {
      return err(
        domainError(
          'VALIDATION_ERROR',
          'Una bodega de cuarentena/averías no puede habilitar facturación directa.',
          400,
        ),
      );
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

    return ok(warehouse as unknown as Record<string, unknown>);
  }

  async createLocation(
    actor: AuthenticatedUser,
    input: {
      warehouseId: string;
      zone: string;
      aisle: string;
      rack: string;
      level: string;
      barcode?: string;
    },
    ipAddress?: string,
  ): Promise<Result<Record<string, unknown>, DomainError>> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: input.warehouseId },
    });
    if (!warehouse) {
      return err(domainError('NOT_FOUND', 'Bodega no encontrada.', 404));
    }

    const zone = input.zone.trim().toUpperCase();
    const aisle = input.aisle.trim().toUpperCase();
    const rack = input.rack.trim().toUpperCase();
    const level = input.level.trim().toUpperCase();
    const barcode = (
      input.barcode?.trim() || `${warehouse.code}-${zone}-${aisle}-${rack}-${level}`
    ).toUpperCase();

    const duplicate = await this.prisma.warehouseLocation.findFirst({
      where: {
        OR: [
          { barcode },
          { warehouseId: warehouse.id, zone, aisle, rack, level },
        ],
      },
    });

    if (duplicate) {
      return err(
        domainError(
          'CONFLICT',
          'La ubicación física o su código de barras ya existen en esta bodega.',
          409,
        ),
      );
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

    return ok(location as unknown as Record<string, unknown>);
  }

  async listWarehouseLocations(warehouseId: string) {
    return this.prisma.warehouseLocation.findMany({
      where: { warehouseId },
      orderBy: [{ zone: 'asc' }, { aisle: 'asc' }, { rack: 'asc' }, { level: 'asc' }],
    });
  }
}