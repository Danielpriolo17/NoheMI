import { Request } from 'express';
import { PrismaService } from '../../../../shared/infra/prisma.service';
import { FiscalSequenceService } from '../../application/fiscal-sequence.service';
import { OrganizationUseCase } from '../../application/organization.use-case';
import { PosTerminalUseCase } from '../../application/pos-terminal.use-case';
import { UserManagementUseCase } from '../../application/user-management.use-case';
import { AuthenticatedUser } from '../../domain/auth.types';
import { CreateBranchDto, CreateFiscalResolutionDto, CreateLocationDto, CreatePosTerminalDto, CreateTaxRuleDto, CreateUserDto, CreateWarehouseDto, ManualDrawerOpenDto } from './dto/config-params.dto';
export declare class SecurityAdminController {
    private readonly userUseCase;
    private readonly orgUseCase;
    private readonly fiscalService;
    private readonly posTerminalUseCase;
    private readonly prisma;
    constructor(userUseCase: UserManagementUseCase, orgUseCase: OrganizationUseCase, fiscalService: FiscalSequenceService, posTerminalUseCase: PosTerminalUseCase, prisma: PrismaService);
    createUser(actor: AuthenticatedUser, dto: CreateUserDto, req: Request): Promise<Record<string, unknown>>;
    listUsers(branchId?: string): Promise<{
        username: string;
        fullName: string;
        branchId: string;
        isActive: boolean;
        role: {
            canViewCosts: boolean;
            canViewCashExpected: boolean;
            canApproveOverride: boolean;
            name: string;
            code: import("@prisma/client").$Enums.RoleCode;
        };
        id: string;
        email: string;
        allowedWorkStart: string | null;
        allowedWorkEnd: string | null;
        lastActivityAt: Date | null;
    }[]>;
    listRoles(): Promise<({
        permissions: ({
            permission: {
                resource: string;
                id: string;
                description: string;
                action: string;
            };
        } & {
            roleId: string;
            permissionId: string;
            ownRecordsOnly: boolean;
            maskedSensitive: boolean;
        })[];
    } & {
        canViewCosts: boolean;
        canViewCashExpected: boolean;
        canApproveOverride: boolean;
        id: string;
        createdAt: Date;
        name: string;
        code: import("@prisma/client").$Enums.RoleCode;
    })[]>;
    createBranch(actor: AuthenticatedUser, dto: CreateBranchDto, req: Request): Promise<Record<string, unknown>>;
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
    createWarehouse(actor: AuthenticatedUser, dto: CreateWarehouseDto, req: Request): Promise<Record<string, unknown>>;
    createLocation(actor: AuthenticatedUser, dto: CreateLocationDto, req: Request): Promise<Record<string, unknown>>;
    listLocations(warehouseId: string): Promise<{
        isActive: boolean;
        id: string;
        warehouseId: string;
        zone: string;
        aisle: string;
        rack: string;
        level: string;
        barcode: string;
    }[]>;
    createResolution(actor: AuthenticatedUser, dto: CreateFiscalResolutionDto, req: Request): Promise<import("../../application/fiscal-sequence.service").ResolutionAlertStatus>;
    listResolutions(branchId?: string): Promise<import("../../application/fiscal-sequence.service").ResolutionAlertStatus[]>;
    createTaxRule(actor: AuthenticatedUser, dto: CreateTaxRuleDto, req: Request): Promise<Record<string, unknown>>;
    listTaxRules(): Promise<{
        isActive: boolean;
        id: string;
        createdAt: Date;
        name: string;
        code: string;
        taxType: string;
        ratePercent: import("@prisma/client/runtime/client").Decimal;
        minBaseAmount: import("@prisma/client/runtime/client").Decimal;
        isRetention: boolean;
    }[]>;
    createTerminal(actor: AuthenticatedUser, dto: CreatePosTerminalDto, req: Request): Promise<Record<string, unknown>>;
    listTerminals(branchId?: string): Promise<({
        defaultWarehouse: {
            id: string;
            name: string;
            code: string;
        };
        primaryResolution: {
            validUntil: Date;
            id: string;
            prefix: string;
        } | null;
        contingencyResolution: {
            validUntil: Date;
            id: string;
            prefix: string;
        } | null;
    } & {
        branchId: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        name: string;
        code: string;
        defaultWarehouseId: string;
        primaryResolutionId: string | null;
        contingencyResolutionId: string | null;
        maxCashAllowed: import("@prisma/client/runtime/client").Decimal;
        thermalPrinterConfig: import("@prisma/client/runtime/client").JsonValue | null;
        laserPrinterConfig: import("@prisma/client/runtime/client").JsonValue | null;
        scaleSerialConfig: import("@prisma/client/runtime/client").JsonValue | null;
    })[]>;
    registerDrawerOpen(actor: AuthenticatedUser, terminalId: string, dto: ManualDrawerOpenDto, req: Request): Promise<Record<string, unknown>>;
    listAnomalousDrawerEvents(terminalId?: string): Promise<({
        terminal: {
            name: string;
            code: string;
        };
    } & {
        userId: string;
        terminalId: string;
        id: string;
        createdAt: Date;
        reason: string;
        shiftId: string | null;
        isAuthorized: boolean;
    })[]>;
    listAuditLogs(module?: string, entityName?: string, limitRaw?: string): Promise<{
        id: string;
        userId: string | null;
        branchId: string | null;
        terminalId: string | null;
        createdAt: Date;
        action: string;
        module: string;
        entityName: string;
        supervisorId: string | null;
        ipAddress: string | null;
        entityId: string;
        beforeData: import("@prisma/client/runtime/client").JsonValue | null;
        afterData: import("@prisma/client/runtime/client").JsonValue | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    }[]>;
}
