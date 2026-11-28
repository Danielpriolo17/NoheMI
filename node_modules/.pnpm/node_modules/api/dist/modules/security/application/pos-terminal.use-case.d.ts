import { Prisma } from '@prisma/client';
import { AuditLoggerPort } from '../../../shared/application/ports';
import { DomainError } from '../../../shared/domain/domain-error';
import { Result } from '../../../shared/domain/result';
import { PrismaService } from '../../../shared/infra/prisma.service';
import { AuthenticatedUser } from '../domain/auth.types';
import { SupervisorOverrideUseCase } from './supervisor-override.use-case';
export declare class PosTerminalUseCase {
    private readonly prisma;
    private readonly overrideUseCase;
    private readonly auditLogger;
    constructor(prisma: PrismaService, overrideUseCase: SupervisorOverrideUseCase, auditLogger: AuditLoggerPort);
    createTerminal(actor: AuthenticatedUser, input: {
        branchId: string;
        defaultWarehouseId: string;
        primaryResolutionId?: string;
        contingencyResolutionId?: string;
        code: string;
        name: string;
        maxCashAllowed: number;
        thermalPrinterConfig?: Record<string, unknown>;
        laserPrinterConfig?: Record<string, unknown>;
        scaleSerialConfig?: Record<string, unknown>;
    }, ipAddress?: string): Promise<Result<Record<string, unknown>, DomainError>>;
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
        maxCashAllowed: Prisma.Decimal;
        thermalPrinterConfig: Prisma.JsonValue | null;
        laserPrinterConfig: Prisma.JsonValue | null;
        scaleSerialConfig: Prisma.JsonValue | null;
    })[]>;
    registerManualDrawerOpen(actor: AuthenticatedUser, input: {
        terminalId: string;
        shiftId?: string;
        reason: string;
        overrideToken?: string;
    }, ipAddress?: string): Promise<Result<Record<string, unknown>, DomainError>>;
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
}
