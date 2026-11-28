import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Request } from 'express';
import {
  AuthenticatedUser,
  PermissionAction,
  PermissionRequirement,
} from '../../../domain/auth.types';

export const IS_PUBLIC_KEY = 'nohemi:is_public';
export const REQUIRED_PERMISSION_KEY = 'nohemi:required_permission';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const RequirePermission = (resource: string, action: PermissionAction) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, {
    resource,
    action,
  } satisfies PermissionRequirement);

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new Error('CurrentUser decorator used on unauthenticated route.');
    }
    return request.user;
  },
);