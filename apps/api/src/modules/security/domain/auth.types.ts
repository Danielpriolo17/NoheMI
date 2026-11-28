import { RoleCode } from '@prisma/client';

export type PermissionAction = 'L' | 'C' | 'E' | 'A' | 'N';

export interface GrantedPermission {
  resource: string;
  action: PermissionAction;
  ownRecordsOnly: boolean;
  maskedSensitive: boolean;
}

export interface AuthenticatedUser {
  sessionId: string;
  userId: string;
  username: string;
  fullName: string;
  branchId: string;
  terminalId?: string;
  roleCode: RoleCode;
  canViewCosts: boolean;
  canViewCashExpected: boolean;
  canApproveOverride: boolean;
  permissions: GrantedPermission[];
}

export interface PermissionRequirement {
  resource: string;
  action: PermissionAction;
}

export type OverrideActionCode =
  | 'EXTRAORDINARY_DISCOUNT'
  | 'VOID_PRE_TRANSMISSION_INVOICE'
  | 'UNLOCK_OVERDUE_CREDIT'
  | 'MANUAL_CASH_DRAWER_OPEN'
  | 'APPROVE_RETURN_REFUND';