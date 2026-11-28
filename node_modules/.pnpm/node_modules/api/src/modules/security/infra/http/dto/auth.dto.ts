import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { OverrideActionCode } from '../../../domain/auth.types';

const OVERRIDE_ACTIONS: OverrideActionCode[] = [
  'EXTRAORDINARY_DISCOUNT',
  'VOID_PRE_TRANSMISSION_INVOICE',
  'UNLOCK_OVERDUE_CREDIT',
  'MANUAL_CASH_DRAWER_OPEN',
  'APPROVE_RETURN_REFUND',
];

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: 'NohemiAdmin2026*' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ description: 'UUID de la terminal POS si aplica' })
  @IsOptional()
  @IsUUID()
  terminalId?: string;
}

export class RequestSupervisorOverrideDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  supervisorUsername!: string;

  @ApiProperty({ example: '987654' })
  @IsString()
  @MinLength(4)
  supervisorPin!: string;

  @ApiProperty({ enum: OVERRIDE_ACTIONS })
  @IsIn(OVERRIDE_ACTIONS)
  actionCode!: OverrideActionCode;

  @ApiProperty({ example: 'Descuento especial cliente constructor frecuente' })
  @IsString()
  @MinLength(5)
  reason!: string;

  @ApiProperty({ example: 'Invoice' })
  @IsString()
  @IsNotEmpty()
  referenceType!: string;

  @ApiProperty({ example: 'temp-cart-001' })
  @IsString()
  @IsNotEmpty()
  referenceId!: string;
}