import { FiscalDocumentType, RoleCode, WarehouseType } from '@prisma/client';
export declare class CreateUserDto {
    branchId: string;
    roleCode: RoleCode;
    username: string;
    email: string;
    fullName: string;
    password: string;
    supervisorPin?: string;
    allowedWorkStart?: string;
    allowedWorkEnd?: string;
}
export declare class CreateBranchDto {
    code: string;
    name: string;
    address: string;
    city: string;
    phone?: string;
}
export declare class CreateWarehouseDto {
    branchId: string;
    code: string;
    name: string;
    type: WarehouseType;
    allowsDirectSales: boolean;
    allowsDispatch: boolean;
    allowsReceiving: boolean;
}
export declare class CreateLocationDto {
    warehouseId: string;
    zone: string;
    aisle: string;
    rack: string;
    level: string;
    barcode?: string;
}
export declare class CreateFiscalResolutionDto {
    branchId: string;
    documentType: FiscalDocumentType;
    resolutionNumber: string;
    prefix: string;
    rangeStart: number;
    rangeEnd: number;
    validFrom: string;
    validUntil: string;
    isContingency: boolean;
}
export declare class CreateTaxRuleDto {
    code: string;
    name: string;
    taxType: string;
    ratePercent: number;
    minBaseAmount?: number;
    isRetention: boolean;
}
export declare class CreatePosTerminalDto {
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
}
export declare class ManualDrawerOpenDto {
    shiftId?: string;
    reason: string;
    overrideToken?: string;
}
