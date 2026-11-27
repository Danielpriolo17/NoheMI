import { SetMetadata } from '@nestjs/common';

export const PERMISSION_METADATA_KEY = 'nohemi:rbac:permission';

export type PermissionAction = string;

export interface RequiredPermission {
  resource: string;
  action: PermissionAction;
}

export const RequirePermission = (resource: string, action: PermissionAction) =>
  SetMetadata(PERMISSION_METADATA_KEY, { resource, action });