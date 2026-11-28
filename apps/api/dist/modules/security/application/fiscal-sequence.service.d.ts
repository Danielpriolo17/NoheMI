import { FiscalDocumentType } from '@prisma/client';
import { AuditLoggerPort, TransactionClient } from '../../../shared/application/ports';
import { DomainError } from '../../../shared/domain/domain-error';
import { Result } from '../../../shared/domain/result';
import { PrismaService } from '../../../shared/infra/prisma.service';
import { AuthenticatedUser } from '../domain/auth.types';
export interface NextSequenceResult {
    resolutionId: string;
    prefix: string;
    consecutive: bigint;
    fullNumber: string;
    isContingency: boolean;
    warnings: string[];
}
export interface ResolutionAlertStatus {
    id: string;
    branchId: string;
    documentType: FiscalDocumentType;
    resolutionNumber: string;
    prefix: string;
    rangeStart: string;
    rangeEnd: string;
    currentNumber: string;
    usagePercent: number;
    daysRemaining: number;
    validFrom: string;
    validUntil: string;
    isContingency: boolean;
    isActive: boolean;
    alerts: string[];
}
export declare class FiscalSequenceService {
    private readonly prisma;
    private readonly auditLogger;
    private static readonly USAGE_ALERT_THRESHOLD_PCT;
    private static readonly EXPIRY_ALERT_DAYS;
    constructor(prisma: PrismaService, auditLogger: AuditLoggerPort);
    allocateNext(tx: TransactionClient, resolutionId: string): Promise<Result<NextSequenceResult, DomainError>>;
    createResolution(actor: AuthenticatedUser, input: {
        branchId: string;
        documentType: FiscalDocumentType;
        resolutionNumber: string;
        prefix: string;
        rangeStart: number;
        rangeEnd: number;
        validFrom: Date;
        validUntil: Date;
        isContingency: boolean;
    }, ipAddress?: string): Promise<Result<ResolutionAlertStatus, DomainError>>;
    listResolutions(branchId?: string): Promise<ResolutionAlertStatus[]>;
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
    createTaxRule(actor: AuthenticatedUser, input: {
        code: string;
        name: string;
        taxType: string;
        ratePercent: number;
        minBaseAmount?: number;
        isRetention: boolean;
    }, ipAddress?: string): Promise<Result<Record<string, unknown>, DomainError>>;
    private toAlertStatus;
    private evaluateAlerts;
}
