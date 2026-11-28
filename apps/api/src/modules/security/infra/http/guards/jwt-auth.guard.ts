import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  SECURITY_REPO_PORT,
  SecurityRepositoryPort,
  SESSION_STORE_PORT,
  SessionStorePort,
} from '../../../domain/security.ports';
import {
  AuthenticatedRequest,
  IS_PUBLIC_KEY,
} from '../decorators/security.decorators';

interface JwtPayload {
  sid: string;
  sub: string;
  username: string;
  branchId: string;
  terminalId?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(SESSION_STORE_PORT)
    private readonly sessionStore: SessionStorePort,
    @Inject(SECURITY_REPO_PORT)
    private readonly securityRepo: SecurityRepositoryPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Token de acceso requerido.',
      });
    }

    const token = authHeader.slice(7);
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Token inválido o expirado.',
      });
    }

    const idleTimeoutSeconds = Number(
      this.config.get<string>('POS_IDLE_TIMEOUT_SECONDS', '300'),
    );
    const activeSession = await this.sessionStore.touchActiveSession(
      payload.sid,
      idleTimeoutSeconds,
    );

    if (!activeSession) {
      throw new UnauthorizedException({
        code: 'SESSION_IDLE_EXPIRED',
        message: 'Sesión bloqueada automáticamente por inactividad. Inicie sesión nuevamente.',
      });
    }

    const user = await this.securityRepo.findById(payload.sub);
    if (!user || !user.isActive) {
      await this.sessionStore.revokeSession(payload.sid);
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Usuario inactivo o revocado.',
      });
    }

    request.user = {
      sessionId: payload.sid,
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      branchId: user.branchId,
      terminalId: activeSession.terminalId,
      roleCode: user.role.code,
      canViewCosts: user.role.canViewCosts,
      canViewCashExpected: user.role.canViewCashExpected,
      canApproveOverride: user.role.canApproveOverride,
      permissions: user.role.permissions,
    };

    return true;
  }
}