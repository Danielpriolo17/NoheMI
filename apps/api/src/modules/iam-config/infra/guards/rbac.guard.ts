import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../../shared/infra/prisma.service';
import {
  PERMISSION_METADATA_KEY,
  RequiredPermission,
} from '../decorators/require-permission.decorator';
import { AuthenticatedUser } from './session-activity.guard';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<RequiredPermission>(
      PERMISSION_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const req = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = req.user;
    if (!user) return false;

    const permission = await this.prisma.rolePermission.findUnique({
      where: {
        role_resource_action: {
          role: user.role as Prisma.RolePermissionCreateManyInput['role'],
          resource: required.resource,
          action: required.action,
        },
      },
    });

    if (!permission) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RBAC',
        message: `El rol ${user.role} no tiene permiso [${required.action}] sobre [${required.resource}].`,
      });
    }

    req.rbacContext = {
      isRestricted: permission.isRestricted,
      hideCostData: permission.hideCostData,
    };
    return true;
  }
}