import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { AUDIT_PORT, AuditPort } from '../../../../shared/domain/audit.port';
import { REDIS_CLIENT } from '../../../../shared/infra/redis.provider';

export interface AuthenticatedUser {
  sub: string;
  jti: string;
  role: string;
  branchIds: string[];
  sessionTimeoutMinutes: number;
  terminalId?: string;
}

@Injectable()
export class SessionActivityGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(AUDIT_PORT) private readonly audit: AuditPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader: string | undefined = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Token requerido.' });
    }

    const token = authHeader.slice(7);
    let payload: AuthenticatedUser;
    try {
      payload = await this.jwtService.verifyAsync<AuthenticatedUser>(token);
    } catch {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Token inválido o expirado.' });
    }

    const sessionKey = `session:active:${payload.jti}`;
    const isAlive = await this.redis.get(sessionKey);

    if (!isAlive) {
      await this.audit.record({
        userId: payload.sub,
        ipAddress: req.ip,
        terminalId: payload.terminalId,
        module: 'IAM',
        action: 'SESSION_LOCKED_INACTIVITY',
      });
      throw new UnauthorizedException({
        code: 'SESSION_LOCKED_INACTIVITY',
        message: 'Sesión bloqueada por inactividad. Ingrese sus credenciales.',
      });
    }

    // Renovar ventana deslizante de inactividad (ej. 3 a 5 minutos)
    const ttlSeconds = Math.max(180, (payload.sessionTimeoutMinutes || 5) * 60);
    await this.redis.expire(sessionKey, ttlSeconds);

    req.user = payload;
    return true;
  }
}