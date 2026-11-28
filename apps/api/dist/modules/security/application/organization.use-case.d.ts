import { WarehouseType } from '@prisma/client';
import { AuditLoggerPort } from '../../../shared/application/ports';
import { DomainError } from '../../../shared/domain/domain-error';
import { Result } from '../../../shared/domain/result';
import { PrismaService } from '../../../shared/infra/prisma.service';
import { AuthenticatedUser } from '../domain/auth.types';
export declare class OrganizationUseCase {
    private readonly prisma;
    private readonly auditLogger;
    constructor(prisma: PrismaService, auditLogger: AuditLoggerPort);
    createBranch(actor: AuthenticatedUser, input: {
        code: string;
        name: string;
        address: string;
        city: string;
        phone?: string;
    }, ipAddress?: string): Promise<Result<Record<string, unknown>, DomainError>>;
    listBranches(): Promise<({
        warehouses: {
            branchId: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            type: import("@prisma/client").$Enums.WarehouseType;
            allowsDirectSales: boolean;
            allowsDispatch: boolean;
            allowsReceiving: boolean;
        }[];
    } & {
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        address: string;
        city: string;
        phone: string | null;
    })[]>;
    createWarehouse(actor: AuthenticatedUser, input: {
        branchId: string;
        code: string;
        name: string;
        type: WarehouseType;
        allowsDirectSales: boolean;
        allowsDispatch: boolean;
        allowsReceiving: boolean;
    }, ipAddress?: string): Promise<Result<Record<string, unknown>, DomainError>>;
    createLocation(actor: AuthenticatedUser, input: {
        warehouseId: string;
        zone: string;
        aisle: string;
        rack: string;
        level: string;
        barcode?: string;
    }, ipAddress?: string): Promise<Result<Record<string, unknown>, DomainError>>;
    listWarehouseLocations(warehouseId: string): Promise<{
        isActive: boolean;
        id: string;
        warehouseId: string;
        zone: string;
        aisle: string;
        rack: string;
        level: string;
        barcode: string;
    }[]>;
}
