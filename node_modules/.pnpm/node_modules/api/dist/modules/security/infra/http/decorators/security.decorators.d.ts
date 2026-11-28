import { Request } from 'express';
import { AuthenticatedUser, PermissionAction } from '../../../domain/auth.types';
export declare const IS_PUBLIC_KEY = "nohemi:is_public";
export declare const REQUIRED_PERMISSION_KEY = "nohemi:required_permission";
export declare const Public: () => import("@nestjs/common").CustomDecorator<string>;
export declare const RequirePermission: (resource: string, action: PermissionAction) => import("@nestjs/common").CustomDecorator<string>;
export interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
