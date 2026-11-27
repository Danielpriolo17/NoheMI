export declare const PERMISSION_METADATA_KEY = "nohemi:rbac:permission";
export type PermissionAction = string;
export interface RequiredPermission {
    resource: string;
    action: PermissionAction;
}
export declare const RequirePermission: (resource: string, action: PermissionAction) => import("@nestjs/common").CustomDecorator<string>;
