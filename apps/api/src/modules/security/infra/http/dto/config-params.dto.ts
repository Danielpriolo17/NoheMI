import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FiscalDocumentType,
  RoleCode,
  WarehouseType,
} from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsUUID()
  branchId!: string;

  @ApiProperty({ enum: RoleCode })
  @IsEnum(RoleCode)
  roleCode!: RoleCode;

  @ApiProperty({ example: 'vendedor1' })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty({ example: 'vendedor1@nohemi.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Carlos Pérez' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: 'Vendedor2026*' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  @MinLength(4)
  supervisorPin?: string;

  @ApiPropertyOptional({ example: '07:00' })
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  allowedWorkStart?: string;

  @ApiPropertyOptional({ example: '19:00' })
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  allowedWorkEnd?: string;
}

export class CreateBranchDto {
  @ApiProperty({ example: 'SEDE-02' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Sucursal Norte Materiales' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Av. Circunvalar #45-10' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ example: 'Montería' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiPropertyOptional({ example: '6047810000' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateWarehouseDto {
  @ApiProperty()
  @IsUUID()
  branchId!: string;

  @ApiProperty({ example: 'BOD-PAT-02' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Patio Hierro y Cemento' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: WarehouseType })
  @IsEnum(WarehouseType)
  type!: WarehouseType;

  @ApiProperty({ default: true })
  @IsBoolean()
  allowsDirectSales!: boolean;

  @ApiProperty({ default: true })
  @IsBoolean()
  allowsDispatch!: boolean;

  @ApiProperty({ default: true })
  @IsBoolean()
  allowsReceiving!: boolean;
}

export class CreateLocationDto {
  @ApiProperty()
  @IsUUID()
  warehouseId!: string;

  @ApiProperty({ example: 'Z1' })
  @IsString()
  @IsNotEmpty()
  zone!: string;

  @ApiProperty({ example: 'P04' })
  @IsString()
  @IsNotEmpty()
  aisle!: string;

  @ApiProperty({ example: 'E02' })
  @IsString()
  @IsNotEmpty()
  rack!: string;

  @ApiProperty({ example: 'N1' })
  @IsString()
  @IsNotEmpty()
  level!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;
}

export class CreateFiscalResolutionDto {
  @ApiProperty()
  @IsUUID()
  branchId!: string;

  @ApiProperty({ enum: FiscalDocumentType })
  @IsEnum(FiscalDocumentType)
  documentType!: FiscalDocumentType;

  @ApiProperty({ example: '18764000001234' })
  @IsString()
  @IsNotEmpty()
  resolutionNumber!: string;

  @ApiProperty({ example: 'FE' })
  @IsString()
  @IsNotEmpty()
  prefix!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  rangeStart!: number;

  @ApiProperty({ example: 50000 })
  @IsInt()
  @Min(2)
  rangeEnd!: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  @IsDateString()
  validFrom!: string;

  @ApiProperty({ example: '2027-01-01T23:59:59.000Z' })
  @IsDateString()
  validUntil!: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  isContingency!: boolean;
}

export class CreateTaxRuleDto {
  @ApiProperty({ example: 'IVA_19_FERRE' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'IVA Estándar Ferretería 19%' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'IVA' })
  @IsString()
  @IsNotEmpty()
  taxType!: string;

  @ApiProperty({ example: 19 })
  @IsNumber()
  @Min(0)
  ratePercent!: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minBaseAmount?: number;

  @ApiProperty({ default: false })
  @IsBoolean()
  isRetention!: boolean;
}

export class CreatePosTerminalDto {
  @ApiProperty()
  @IsUUID()
  branchId!: string;

  @ApiProperty()
  @IsUUID()
  defaultWarehouseId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  primaryResolutionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contingencyResolutionId?: string;

  @ApiProperty({ example: 'POS-01' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Caja Rápida Mostrador 1' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 5000000 })
  @IsNumber()
  @Min(0)
  maxCashAllowed!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  thermalPrinterConfig?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  laserPrinterConfig?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  scaleSerialConfig?: Record<string, unknown>;
}

export class ManualDrawerOpenDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @ApiProperty({ example: 'Cambio de billetes para vueltas' })
  @IsString()
  @MinLength(5)
  reason!: string;

  @ApiPropertyOptional({
    description: 'Token emitido por /auth/supervisor-override con actionCode MANUAL_CASH_DRAWER_OPEN',
  })
  @IsOptional()
  @IsString()
  overrideToken?: string;
}